import crypto from "node:crypto";

type StripeResponse<T> = T & { error?: { message?: string } };

export class InvalidWebhookError extends Error {}

function config() {
  return {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  };
}

export function stripeConfigured() {
  const { secretKey, webhookSecret } = config();
  return Boolean(secretKey && webhookSecret);
}

async function stripeRequest<T>(path: string, body: URLSearchParams) {
  const { secretKey } = config();
  if (!secretKey) throw new Error("Stripe is not configured");
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = (await response.json()) as StripeResponse<T>;
  if (!response.ok) throw new Error(data.error?.message ?? "Stripe request failed");
  return data;
}

export async function createCheckoutSession(input: {
  sessionId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  lineItems: Array<{ name: string; description: string; unitAmount: number; quantity: number }>;
  totalCents: number;
}) {
  const body = new URLSearchParams({
    mode: "payment",
    customer_email: input.customerEmail,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    "metadata[checkout_session_id]": input.sessionId,
    "payment_intent_data[metadata][checkout_session_id]": input.sessionId,
  });
  input.lineItems.forEach((item, index) => {
    body.set(`line_items[${index}][quantity]`, String(item.quantity));
    body.set(`line_items[${index}][price_data][currency]`, "usd");
    body.set(`line_items[${index}][price_data][unit_amount]`, String(item.unitAmount));
    body.set(`line_items[${index}][price_data][product_data][name]`, item.name);
    body.set(`line_items[${index}][price_data][product_data][description]`, item.description.slice(0, 500));
  });
  body.set("expires_at", String(Math.floor(Date.now() / 1000) + 1800));
  return stripeRequest<{ id: string; url: string }>("checkout/sessions", body);
}

export function verifyStripeSignature(payload: string, signature: string) {
  const { webhookSecret } = config();
  if (!webhookSecret) throw new InvalidWebhookError("Stripe webhook is not configured");
  const parts = signature.split(",").reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split("=", 2);
    if (key && value) acc[key] = value;
    return acc;
  }, {});
  const timestamp = Number(parts.t);
  if (!timestamp || Math.abs(Date.now() / 1000 - timestamp) > 300) {
    throw new InvalidWebhookError("Webhook timestamp outside tolerance");
  }
  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(`${parts.t}.${payload}`)
    .digest("hex");
  if (!parts.v1 || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1))) {
    throw new InvalidWebhookError("Invalid webhook signature");
  }
}