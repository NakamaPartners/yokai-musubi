import { Router, type IRouter, type Response } from "express";
import { z } from "zod";
import {
  getMenu,
  getSettings,
  hmacToken,
  id,
  normalizeOrderNumber,
  pool,
  type MenuItem,
} from "../lib/ordering";
import { createCheckoutSession, stripeConfigured, verifyStripeSignature } from "../lib/stripe";

const router: IRouter = Router();

const modifierSchema = z.object({
  groupId: z.string().min(1),
  optionId: z.string().min(1),
});
const checkoutSchema = z.object({
  items: z.array(z.object({
    itemId: z.string().min(1),
    quantity: z.number().int().min(1).max(20),
    modifiers: z.array(modifierSchema).max(20).default([]),
  })).min(1).max(50),
  customer: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().email().max(254),
    phone: z.string().trim().min(7).max(32),
  }),
  fulfillment: z.object({
    type: z.enum(["pickup", "delivery"]),
    scheduledFor: z.string().datetime({ offset: true }).optional(),
    address: z.string().trim().max(240).optional(),
    city: z.string().trim().max(80).optional(),
    state: z.string().trim().max(40).optional(),
    zip: z.string().trim().max(12).optional(),
  }),
  notes: z.string().trim().max(1000).optional(),
});

function error(res: Response, status: number, code: string, message: string, details?: unknown) {
  res.status(status).json({ error: { code, message, details } });
}

function staffOnly(req: any, res: any, next: any) {
  const expected = process.env.STAFF_ACCESS_KEY;
  const provided = req.header("x-staff-key");
  if (!expected || !provided || provided !== expected) {
    error(res, 401, "STAFF_AUTH_REQUIRED", "Enter the staff access key to view orders.");
    return;
  }
  next();
}

function selectModifiers(item: MenuItem, requested: Array<{ groupId: string; optionId: string }>) {
  const selected = [];
  for (const group of item.modifiers) {
    const choice = requested.find((modifier) => modifier.groupId === group.id);
    if (group.required && !choice) throw new Error(`${item.name}: choose ${group.name}.`);
    if (!choice) continue;
    const option = group.options.find((candidate) => candidate.id === choice.optionId);
    if (!option) throw new Error(`${item.name}: that ${group.name.toLowerCase()} is unavailable.`);
    selected.push({
      groupId: group.id,
      groupName: group.name,
      optionId: option.id,
      optionName: option.name,
      priceCents: option.priceCents,
    });
  }
  if (requested.some((requestedModifier) => !item.modifiers.some((group) => group.id === requestedModifier.groupId))) {
    throw new Error(`${item.name}: an add-on is unavailable.`);
  }
  return selected;
}

function validateSchedule(scheduledFor: string | undefined, settings: Awaited<ReturnType<typeof getSettings>>) {
  const date = scheduledFor ? new Date(scheduledFor) : new Date(Date.now() + settings.leadTimeMinutes * 60_000);
  if (Number.isNaN(date.getTime()) || (scheduledFor && date.getTime() < Date.now() + settings.leadTimeMinutes * 60_000)) {
    throw new Error(`Please choose a time at least ${settings.leadTimeMinutes} minutes from now.`);
  }
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(lookup.weekday);
  const hour = Number(lookup.hour);
  const minute = Number(lookup.minute);
  const current = hour * 60 + minute;
  const window = settings.hours.find((candidate) => candidate.day === day);
  if (!window) throw new Error("The shop is closed on that day.");
  const [openHour, openMinute] = window.open.split(":").map(Number);
  const [closeHour, closeMinute] = window.close.split(":").map(Number);
  if (current < openHour * 60 + openMinute || current > closeHour * 60 + closeMinute) {
    throw new Error(`Please choose a time between ${window.open} and ${window.close}.`);
  }
}

router.get("/menu", async (_req, res) => {
  const [items, settings] = await Promise.all([getMenu(), getSettings()]);
  const categories = [...new Map(items.map((item) => [
    item.categoryId,
    { id: item.categoryId, name: item.category_name, description: item.category_description },
  ])).values()];
  res.json({
    draft: !settings.orderingEnabled,
    orderingEnabled: settings.orderingEnabled,
    categories,
    items: items.map((item) => ({
      id: item.id,
      categoryId: item.categoryId,
      name: item.name,
      japaneseName: item.japaneseName,
      description: item.description,
      imageUrl: item.imageUrl,
      priceCents: item.priceCents,
      currency: item.currency,
      available: item.available,
      draft: item.draft,
      modifiers: item.modifiers,
    })),
    fulfillment: settings,
  });
});

router.post("/checkout/sessions", async (req, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    error(res, 400, "INVALID_CHECKOUT", "Check the highlighted checkout details.", parsed.error.flatten());
    return;
  }
  const settings = await getSettings();
  if (!settings.orderingEnabled) {
    error(res, 409, "ORDERING_DISABLED", "Online ordering is still being configured. Please call the shop or check back soon.");
    return;
  }
  const data = parsed.data;
  if (data.fulfillment.type === "pickup" && !settings.pickupEnabled) {
    error(res, 409, "PICKUP_UNAVAILABLE", "Pickup is not available right now.");
    return;
  }
  if (data.fulfillment.type === "delivery") {
    if (!settings.deliveryEnabled) {
      error(res, 409, "DELIVERY_UNAVAILABLE", "Local delivery is not available right now.");
      return;
    }
    if (!data.fulfillment.address || !data.fulfillment.city || !data.fulfillment.state || !data.fulfillment.zip) {
      error(res, 400, "ADDRESS_REQUIRED", "A complete delivery address is required.");
      return;
    }
    if (!settings.deliveryZones.some((zone) => zone.zip === data.fulfillment.zip)) {
      error(res, 422, "OUTSIDE_DELIVERY_ZONE", "That address is outside the current delivery zone.");
      return;
    }
  }
  try {
    validateSchedule(data.fulfillment.scheduledFor, settings);
    const menu = await getMenu();
    const snapshots = data.items.map((requested) => {
      const item = menu.find((candidate) => candidate.id === requested.itemId);
      if (!item || !item.available) throw new Error("One of the selected items is no longer available.");
      const modifiers = selectModifiers(item, requested.modifiers);
      const unitPriceCents = item.priceCents + modifiers.reduce((sum, modifier) => sum + modifier.priceCents, 0);
      return { itemId: item.id, name: item.name, description: item.description, quantity: requested.quantity, unitPriceCents, modifiers };
    });
    const subtotalCents = snapshots.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
    if (data.fulfillment.type === "delivery" && subtotalCents < settings.deliveryMinimumCents) {
      throw new Error(`Delivery has a ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(settings.deliveryMinimumCents / 100)} minimum.`);
    }
    const deliveryFeeCents = data.fulfillment.type === "delivery" ? settings.deliveryFeeCents : 0;
    const taxCents = Math.round(subtotalCents * settings.taxRate);
    const totalCents = subtotalCents + taxCents + deliveryFeeCents;
    if (!stripeConfigured()) {
      error(res, 503, "PAYMENT_NOT_CONFIGURED", "Online payment is not configured yet. No order was created.");
      return;
    }
    const checkoutId = id("checkout");
    const confirmationToken = hmacToken();
    const expiresAt = new Date(Date.now() + 30 * 60_000);
    await pool.query(
      `INSERT INTO checkout_sessions (id, confirmation_token, customer, fulfillment, notes, items, subtotal_cents, tax_cents, delivery_fee_cents, total_cents, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [checkoutId, confirmationToken, JSON.stringify(data.customer), JSON.stringify(data.fulfillment), data.notes ?? null, JSON.stringify(snapshots), subtotalCents, taxCents, deliveryFeeCents, totalCents, expiresAt],
    );
    const baseUrl = process.env.PUBLIC_APP_URL ?? `${req.protocol}://${req.get("host")}`;
    const stripeSession = await createCheckoutSession({
      sessionId: checkoutId,
      customerEmail: data.customer.email,
      successUrl: `${baseUrl}/order/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/order/checkout`,
      totalCents,
      lineItems: [
        ...snapshots.map((item) => ({
        name: `${item.name}${item.modifiers.length ? ` · ${item.modifiers.map((modifier) => modifier.optionName).join(", ")}` : ""}`,
        description: item.description,
        unitAmount: item.unitPriceCents,
        quantity: item.quantity,
        })),
        ...(taxCents ? [{ name: "Tax", description: "Configured sales tax", unitAmount: taxCents, quantity: 1 }] : []),
        ...(deliveryFeeCents ? [{ name: "Local delivery", description: "Configured local delivery fee", unitAmount: deliveryFeeCents, quantity: 1 }] : []),
      ],
    });
    await pool.query("UPDATE checkout_sessions SET provider_session_id = $1 WHERE id = $2", [stripeSession.id, checkoutId]);
    res.status(201).json({
      checkoutSessionId: checkoutId,
      providerSessionId: stripeSession.id,
      confirmationToken,
      checkoutUrl: stripeSession.url,
      totals: { subtotalCents, taxCents, deliveryFeeCents, totalCents, currency: "usd" },
      fulfillment: data.fulfillment,
      expiresAt,
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Unable to start checkout.";
    error(res, 422, "CHECKOUT_INVALID", message);
  }
});

router.get("/checkout/sessions/:sessionId", async (req, res) => {
  const confirmationToken = req.header("x-confirmation-token");
  if (!confirmationToken) {
    error(res, 401, "CONFIRMATION_TOKEN_REQUIRED", "This confirmation requires the original browser session.");
    return;
  }
  const result = await pool.query("SELECT * FROM checkout_sessions WHERE (id = $1 OR provider_session_id = $1) AND confirmation_token = $2", [req.params.sessionId, confirmationToken]);
  const session = result.rows[0];
  if (!session) {
    error(res, 404, "CHECKOUT_NOT_FOUND", "That checkout session could not be found.");
    return;
  }
  const order = await pool.query("SELECT order_number, id, status, payment_status FROM orders WHERE checkout_session_id = $1", [session.id]);
  res.json({
    checkoutSessionId: session.id,
    status: order.rows[0] ? "paid" : session.status,
    order: order.rows[0] ? {
      id: order.rows[0].id,
      orderNumber: order.rows[0].order_number,
      status: order.rows[0].status,
      paymentStatus: order.rows[0].payment_status,
    } : null,
    customer: session.customer,
    fulfillment: session.fulfillment,
    items: session.items,
    totals: {
      subtotalCents: session.subtotal_cents,
      taxCents: session.tax_cents,
      deliveryFeeCents: session.delivery_fee_cents,
      totalCents: session.total_cents,
      currency: session.currency,
    },
  });
});

router.get("/orders/:orderId", async (req, res) => {
  const token = req.header("x-confirmation-token");
  if (!token) {
    error(res, 401, "CONFIRMATION_TOKEN_REQUIRED", "This order confirmation requires the original browser session.");
    return;
  }
  const result = await pool.query("SELECT * FROM orders WHERE id = $1 AND confirmation_token = $2", [req.params.orderId, token]);
  const order = result.rows[0];
  if (!order) {
    error(res, 404, "ORDER_NOT_FOUND", "That order could not be found.");
    return;
  }
  const items = await pool.query("SELECT * FROM order_items WHERE order_id = $1", [order.id]);
  res.json({
    id: order.id,
    orderNumber: order.order_number,
    customer: { name: order.customer.name, email: order.customer.email },
    fulfillment: order.fulfillment,
    notes: order.notes,
    items: items.rows,
    totals: { subtotalCents: order.subtotal_cents, taxCents: order.tax_cents, deliveryFeeCents: order.delivery_fee_cents, totalCents: order.total_cents, currency: order.currency },
    paymentStatus: order.payment_status,
    status: order.status,
    createdAt: order.created_at,
  });
});

router.get("/staff/settings", staffOnly, async (_req, res) => {
  res.json(await getSettings());
});

router.patch("/staff/settings", staffOnly, async (req, res) => {
  const settings = z.object({
    orderingEnabled: z.boolean(),
    pickupEnabled: z.boolean(),
    deliveryEnabled: z.boolean(),
    taxRate: z.number().min(0).max(1),
    deliveryFeeCents: z.number().int().min(0).max(100000),
    deliveryMinimumCents: z.number().int().min(0).max(1000000),
    leadTimeMinutes: z.number().int().min(0).max(1440),
    deliveryZones: z.array(z.object({ zip: z.string().min(1).max(12), name: z.string().min(1).max(100) })).max(100),
    hours: z.array(z.object({ day: z.number().int().min(0).max(6), open: z.string(), close: z.string() })).max(7),
  }).safeParse(req.body);
  if (!settings.success) {
    error(res, 400, "INVALID_SETTINGS", "Check the fulfillment settings.", settings.error.flatten());
    return;
  }
  const value = settings.data;
  if (value.orderingEnabled && !stripeConfigured()) {
    error(res, 409, "PAYMENT_NOT_CONFIGURED", "Connect Stripe and configure the webhook before enabling online ordering.");
    return;
  }
  await pool.query(
    `UPDATE fulfillment_settings SET ordering_enabled=$1,pickup_enabled=$2,delivery_enabled=$3,tax_rate=$4,delivery_fee_cents=$5,delivery_minimum_cents=$6,lead_time_minutes=$7,delivery_zones=$8,hours=$9,updated_at=NOW() WHERE id='default'`,
    [value.orderingEnabled, value.pickupEnabled, value.deliveryEnabled, value.taxRate, value.deliveryFeeCents, value.deliveryMinimumCents, value.leadTimeMinutes, JSON.stringify(value.deliveryZones), JSON.stringify(value.hours)],
  );
  res.json(await getSettings());
});

router.get("/staff/orders", staffOnly, async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const values: unknown[] = [];
  let where = "";
  if (status) {
    values.push(status);
    where = `WHERE status = $${values.length}`;
  }
  const result = await pool.query(`SELECT id, order_number, customer, fulfillment, total_cents, currency, payment_status, status, created_at, updated_at FROM orders ${where} ORDER BY created_at DESC LIMIT 100`, values);
  res.json({ orders: result.rows.map((order) => ({
    id: order.id,
    orderNumber: order.order_number,
    customer: order.customer,
    fulfillment: order.fulfillment,
    totalCents: order.total_cents,
    currency: order.currency,
    paymentStatus: order.payment_status,
    status: order.status,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  })) });
});

router.get("/staff/orders/:orderId", staffOnly, async (req, res) => {
  const result = await pool.query("SELECT * FROM orders WHERE id = $1", [req.params.orderId]);
  if (!result.rows[0]) {
    error(res, 404, "ORDER_NOT_FOUND", "Order not found.");
    return;
  }
  const order = result.rows[0];
  const items = await pool.query("SELECT * FROM order_items WHERE order_id = $1", [order.id]);
  res.json({ ...order, items: items.rows });
});

router.patch("/staff/orders/:orderId", staffOnly, async (req, res) => {
  const parsed = z.object({ status: z.enum(["accepted", "preparing", "ready", "completed", "cancelled"]), cancellationReason: z.string().trim().max(500).optional() }).safeParse(req.body);
  if (!parsed.success) {
    error(res, 400, "INVALID_STATUS", "Choose a valid order status.", parsed.error.flatten());
    return;
  }
  if (parsed.data.status === "cancelled" && !parsed.data.cancellationReason) {
    error(res, 400, "CANCELLATION_REASON_REQUIRED", "Add a reason before cancelling an order.");
    return;
  }
  const result = await pool.query("UPDATE orders SET status=$1, notes=CASE WHEN $2::text IS NULL THEN notes ELSE CONCAT(COALESCE(notes || E'\\n', ''), 'Cancellation: ', $2) END, updated_at=NOW() WHERE id=$3 RETURNING *", [parsed.data.status, parsed.data.cancellationReason ?? null, req.params.orderId]);
  if (!result.rows[0]) {
    error(res, 404, "ORDER_NOT_FOUND", "Order not found.");
    return;
  }
  res.json(result.rows[0]);
});

export async function handleStripeWebhook(rawBody: string, signature: string) {
  verifyStripeSignature(rawBody, signature);
  const event = JSON.parse(rawBody) as { id: string; type: string; data?: { object?: Record<string, any> } };
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query("INSERT INTO webhook_events (id, type) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING id", [event.id, event.type]);
    if (!inserted.rows[0]) {
      await client.query("COMMIT");
      return;
    }
    if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
      await client.query("COMMIT");
      return;
    }
    const providerSession = event.data?.object;
    const checkoutId = providerSession?.metadata?.checkout_session_id;
    if (!checkoutId || providerSession?.payment_status !== "paid") {
      await client.query("COMMIT");
      return;
    }
    const sessionResult = await client.query("SELECT * FROM checkout_sessions WHERE id=$1 FOR UPDATE", [checkoutId]);
    const session = sessionResult.rows[0];
    if (!session || session.provider_session_id !== providerSession.id || session.expires_at < new Date()) {
      throw new Error("Webhook did not match a valid checkout session");
    }
    const orderId = id("order");
    const order = await client.query(
      `INSERT INTO orders (id, order_number, checkout_session_id, confirmation_token, customer, fulfillment, notes, subtotal_cents, tax_cents, delivery_fee_cents, total_cents, currency, payment_status, status, stripe_payment_intent_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'paid','accepted',$13)
       ON CONFLICT (checkout_session_id) DO NOTHING
       RETURNING id`,
      [orderId, normalizeOrderNumber(), session.id, session.confirmation_token, session.customer, session.fulfillment, session.notes, session.subtotal_cents, session.tax_cents, session.delivery_fee_cents, session.total_cents, session.currency, providerSession.payment_intent ?? null],
    );
    if (order.rows[0]) {
      for (const item of session.items) {
        await client.query(
          `INSERT INTO order_items (id, order_id, menu_item_id, name, quantity, unit_price_cents, modifiers) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [id("order_item"), orderId, item.itemId, item.name, item.quantity, item.unitPriceCents, JSON.stringify(item.modifiers)],
        );
      }
      await client.query("UPDATE checkout_sessions SET status='paid' WHERE id=$1", [session.id]);
    }
    await client.query("COMMIT");
  } catch (cause) {
    await client.query("ROLLBACK");
    throw cause;
  } finally {
    client.release();
  }
}

export { router as orderingRouter };