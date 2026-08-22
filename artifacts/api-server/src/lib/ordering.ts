import crypto from "node:crypto";
import { pool } from "@workspace/db";
export { pool } from "@workspace/db";

export type OrderingSettings = {
  orderingEnabled: boolean;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  taxRate: number;
  deliveryFeeCents: number;
  deliveryMinimumCents: number;
  leadTimeMinutes: number;
  deliveryZones: Array<{ zip: string; name: string }>;
  hours: Array<{ day: number; open: string; close: string }>;
};

export type SelectedModifier = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceCents: number;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  japaneseName: string | null;
  description: string;
  imageUrl: string | null;
  priceCents: number;
  currency: string;
  available: boolean;
  draft: boolean;
  sortOrder: number;
  modifiers: Array<{
    id: string;
    name: string;
    required: boolean;
    options: Array<{ id: string; name: string; priceCents: number }>;
  }>;
};

export const DRAFT_SETTINGS: OrderingSettings = {
  orderingEnabled: false,
  pickupEnabled: true,
  deliveryEnabled: false,
  taxRate: 0,
  deliveryFeeCents: 0,
  deliveryMinimumCents: 0,
  leadTimeMinutes: 30,
  deliveryZones: [],
  hours: [
    { day: 2, open: "09:00", close: "16:00" },
    { day: 3, open: "09:00", close: "16:00" },
    { day: 4, open: "09:00", close: "16:00" },
    { day: 5, open: "09:00", close: "16:00" },
    { day: 6, open: "09:00", close: "16:00" },
  ],
};

export const DRAFT_MENU = [
  {
    id: "teriyaki-salmon",
    categoryId: "musubi",
    name: "Teriyaki Salmon",
    japaneseName: "照り焼きサーモン",
    description: "Flaky teriyaki salmon, warm rice, and toasted nori.",
    imageUrl: "/assets/Teriyaki_Salmon_Onigiri._A_fan_favorite_Tuesday-_Thursday._Wh_1787218065516.webp",
    priceCents: 850,
    modifiers: [],
  },
  {
    id: "spicy-tuna-kimchi",
    categoryId: "musubi",
    name: "Spicy Tuna & Kimchi",
    japaneseName: "スパイシーツナ",
    description: "Miso tuna mayo, house kimchi, and sesame rice.",
    imageUrl: "/assets/Spicy_Tuna_and_Kimchi_Onigiri._These_are_available_every_Frida_1787217974801.jpg",
    priceCents: 825,
    modifiers: [],
  },
  {
    id: "okubi",
    categoryId: "musubi",
    name: "Okubi",
    japaneseName: "おくび",
    description: "Wasabi tuna, pickled ginger, and seasoned rice.",
    imageUrl: "/assets/Smores_butter_mochi_and_Okubi_Onigiri_(wasabi_tuna,_pickled_g_1787217977055.webp",
    priceCents: 825,
    modifiers: [
      {
        id: "heat",
        name: "Heat level",
        required: true,
        options: [
          { id: "mild", name: "Mild", priceCents: 0 },
          { id: "spicy", name: "Spicy", priceCents: 0 },
        ],
      },
    ],
  },
  {
    id: "karasu-tengu",
    categoryId: "weekend-specials",
    name: "Karasu Tengu",
    japaneseName: "烏天狗",
    description: "Kimchi rice with miso tuna mayo. A rotating weekend special.",
    imageUrl: "/assets/Karasu_Tengu_Onigiri_(kimchi_rice_with_miso_tuna_mayo)_and_Ma_1787218068176.webp",
    priceCents: 900,
    modifiers: [],
  },
  {
    id: "kappa",
    categoryId: "weekend-specials",
    name: "Kappa",
    japaneseName: "河童",
    description: "Japanese pickle, cucumber, and bright sesame rice.",
    imageUrl: "/assets/The_Kappa_is_back_this_Friday_and_Saturday!_Japanese_pickle,__1787218062713.webp",
    priceCents: 800,
    modifiers: [],
  },
  {
    id: "butter-mochi",
    categoryId: "sweets",
    name: "Butter Mochi",
    japaneseName: "バターモチ",
    description: "Scratch-made, chewy, buttery, and just sweet enough.",
    imageUrl: "/assets/Smores_butter_mochi_and_Okubi_Onigiri_(wasabi_tuna,_pickled_g_1787217977055.webp",
    priceCents: 500,
    modifiers: [],
  },
] as const;

export async function ensureOrderingSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS menu_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE
    );
    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES menu_categories(id),
      name TEXT NOT NULL,
      japanese_name TEXT,
      description TEXT NOT NULL,
      image_url TEXT,
      price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
      currency TEXT NOT NULL DEFAULT 'usd',
      available BOOLEAN NOT NULL DEFAULT FALSE,
      draft BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      modifiers JSONB NOT NULL DEFAULT '[]'::jsonb
    );
    CREATE TABLE IF NOT EXISTS fulfillment_settings (
      id TEXT PRIMARY KEY,
      ordering_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      pickup_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      delivery_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      tax_rate NUMERIC(6,5) NOT NULL DEFAULT 0,
      delivery_fee_cents INTEGER NOT NULL DEFAULT 0,
      delivery_minimum_cents INTEGER NOT NULL DEFAULT 0,
      lead_time_minutes INTEGER NOT NULL DEFAULT 30,
      delivery_zones JSONB NOT NULL DEFAULT '[]'::jsonb,
      hours JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS checkout_sessions (
      id TEXT PRIMARY KEY,
      provider_session_id TEXT UNIQUE,
      confirmation_token TEXT NOT NULL,
      customer JSONB NOT NULL,
      fulfillment JSONB NOT NULL,
      notes TEXT,
      items JSONB NOT NULL,
      subtotal_cents INTEGER NOT NULL,
      tax_cents INTEGER NOT NULL,
      delivery_fee_cents INTEGER NOT NULL,
      total_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'usd',
      status TEXT NOT NULL DEFAULT 'pending',
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      checkout_session_id TEXT NOT NULL UNIQUE REFERENCES checkout_sessions(id),
      confirmation_token TEXT NOT NULL,
      customer JSONB NOT NULL,
      fulfillment JSONB NOT NULL,
      notes TEXT,
      subtotal_cents INTEGER NOT NULL,
      tax_cents INTEGER NOT NULL,
      delivery_fee_cents INTEGER NOT NULL,
      total_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'usd',
      payment_status TEXT NOT NULL DEFAULT 'paid',
      status TEXT NOT NULL DEFAULT 'accepted',
      stripe_payment_intent_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id TEXT NOT NULL,
      name TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price_cents INTEGER NOT NULL,
      modifiers JSONB NOT NULL DEFAULT '[]'::jsonb
    );
    CREATE TABLE IF NOT EXISTS webhook_events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS orders_status_created_idx ON orders(status, created_at DESC);
    ALTER TABLE checkout_sessions ADD COLUMN IF NOT EXISTS notes TEXT;
  `);
  await seedDraftData();
}

async function seedDraftData() {
  await pool.query(
    `INSERT INTO menu_categories (id, name, description, sort_order)
     VALUES ('musubi', 'Musubi & onigiri', 'Portable rice triangles made fresh at the counter.', 1),
            ('weekend-specials', 'Weekend specials', 'Rotating Friday and Saturday creations.', 2),
            ('sweets', 'Sweets', 'Small, scratch-made treats for the road.', 3)
     ON CONFLICT (id) DO NOTHING`,
  );
  for (const [index, item] of DRAFT_MENU.entries()) {
    await pool.query(
      `INSERT INTO menu_items
        (id, category_id, name, japanese_name, description, image_url, price_cents, available, draft, sort_order, modifiers)
       VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,TRUE,$8,$9)
       ON CONFLICT (id) DO NOTHING`,
      [
        item.id,
        item.categoryId,
        item.name,
        item.japaneseName,
        item.description,
        item.imageUrl,
        item.priceCents,
        index,
        JSON.stringify(item.modifiers),
      ],
    );
  }
  await pool.query(
    `INSERT INTO fulfillment_settings (id, ordering_enabled, pickup_enabled, delivery_enabled, tax_rate, delivery_fee_cents, delivery_minimum_cents, lead_time_minutes, delivery_zones, hours)
     VALUES ('default', FALSE, TRUE, FALSE, $1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO NOTHING`,
    [
      DRAFT_SETTINGS.taxRate,
      DRAFT_SETTINGS.deliveryFeeCents,
      DRAFT_SETTINGS.deliveryMinimumCents,
      DRAFT_SETTINGS.leadTimeMinutes,
      JSON.stringify(DRAFT_SETTINGS.deliveryZones),
      JSON.stringify(DRAFT_SETTINGS.hours),
    ],
  );
}

export async function getSettings(): Promise<OrderingSettings> {
  const result = await pool.query("SELECT * FROM fulfillment_settings WHERE id = 'default'");
  const row = result.rows[0];
  if (!row) return DRAFT_SETTINGS;
  return {
    orderingEnabled: row.ordering_enabled,
    pickupEnabled: row.pickup_enabled,
    deliveryEnabled: row.delivery_enabled,
    taxRate: Number(row.tax_rate),
    deliveryFeeCents: row.delivery_fee_cents,
    deliveryMinimumCents: row.delivery_minimum_cents,
    leadTimeMinutes: row.lead_time_minutes,
    deliveryZones: row.delivery_zones,
    hours: row.hours,
  };
}

export async function getMenu() {
  const result = await pool.query(`
    SELECT mi.*, mc.name AS category_name, mc.description AS category_description
    FROM menu_items mi
    JOIN menu_categories mc ON mc.id = mi.category_id
    WHERE mc.active = TRUE
    ORDER BY mc.sort_order, mi.sort_order, mi.name
  `);
  return result.rows.map((row) => ({
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    japaneseName: row.japanese_name,
    description: row.description,
    imageUrl: row.image_url,
    priceCents: row.price_cents,
    currency: row.currency,
    available: row.available,
    draft: row.draft,
    sortOrder: row.sort_order,
    modifiers: row.modifiers,
    category_name: row.category_name,
    category_description: row.category_description,
  })) as Array<MenuItem & { category_name: string; category_description: string | null }>;
}

export function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function hmacToken() {
  return crypto.randomBytes(24).toString("hex");
}

export function cents(value: number) {
  return Math.round(value);
}

export function formatMoney(value: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value / 100);
}

export function normalizeOrderNumber() {
  return `YM-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}