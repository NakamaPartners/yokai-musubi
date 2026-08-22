import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { z } from "zod";

export const menuCategoriesTable = pgTable("menu_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const menuItemsTable = pgTable("menu_items", {
  id: text("id").primaryKey(),
  categoryId: text("category_id").notNull(),
  name: text("name").notNull(),
  japaneseName: text("japanese_name"),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").notNull().default("usd"),
  available: boolean("available").notNull().default(false),
  draft: boolean("draft").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  modifiers: jsonb("modifiers").$type<ModifierGroup[]>().notNull().default([]),
});

export const fulfillmentSettingsTable = pgTable("fulfillment_settings", {
  id: text("id").primaryKey(),
  orderingEnabled: boolean("ordering_enabled").notNull().default(false),
  pickupEnabled: boolean("pickup_enabled").notNull().default(true),
  deliveryEnabled: boolean("delivery_enabled").notNull().default(false),
  taxRate: text("tax_rate").notNull().default("0.0"),
  deliveryFeeCents: integer("delivery_fee_cents").notNull().default(0),
  deliveryMinimumCents: integer("delivery_minimum_cents").notNull().default(0),
  leadTimeMinutes: integer("lead_time_minutes").notNull().default(30),
  deliveryZones: jsonb("delivery_zones").$type<DeliveryZone[]>().notNull().default([]),
  hours: jsonb("hours").$type<BusinessHours[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const checkoutSessionsTable = pgTable(
  "checkout_sessions",
  {
    id: text("id").primaryKey(),
    providerSessionId: text("provider_session_id"),
    confirmationToken: text("confirmation_token").notNull(),
    customer: jsonb("customer").$type<CustomerDetails>().notNull(),
    fulfillment: jsonb("fulfillment").$type<FulfillmentDetails>().notNull(),
    notes: text("notes"),
    items: jsonb("items").$type<CheckoutItemSnapshot[]>().notNull(),
    subtotalCents: integer("subtotal_cents").notNull(),
    taxCents: integer("tax_cents").notNull(),
    deliveryFeeCents: integer("delivery_fee_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    currency: text("currency").notNull().default("usd"),
    status: text("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    providerSessionUnique: uniqueIndex("checkout_sessions_provider_session_idx").on(
      table.providerSessionId,
    ),
  }),
);

export const ordersTable = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    orderNumber: text("order_number").notNull().unique(),
    checkoutSessionId: text("checkout_session_id").notNull().unique(),
    confirmationToken: text("confirmation_token").notNull(),
    customer: jsonb("customer").$type<CustomerDetails>().notNull(),
    fulfillment: jsonb("fulfillment").$type<FulfillmentDetails>().notNull(),
    notes: text("notes"),
    subtotalCents: integer("subtotal_cents").notNull(),
    taxCents: integer("tax_cents").notNull(),
    deliveryFeeCents: integer("delivery_fee_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    currency: text("currency").notNull().default("usd"),
    paymentStatus: text("payment_status").notNull().default("paid"),
    status: text("status").notNull().default("accepted"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

export const orderItemsTable = pgTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull(),
  menuItemId: text("menu_item_id").notNull(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  modifiers: jsonb("modifiers").$type<SelectedModifier[]>().notNull().default([]),
});

export const webhookEventsTable = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ModifierOption = {
  id: string;
  name: string;
  priceCents: number;
};

export type ModifierGroup = {
  id: string;
  name: string;
  required: boolean;
  options: ModifierOption[];
};

export type SelectedModifier = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceCents: number;
};

export type CustomerDetails = {
  name: string;
  email: string;
  phone: string;
};

export type FulfillmentDetails = {
  type: "pickup" | "delivery";
  scheduledFor?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
};

export type CheckoutItemSnapshot = {
  itemId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  modifiers: SelectedModifier[];
};

export type DeliveryZone = {
  zip: string;
  name: string;
};

export type BusinessHours = {
  day: number;
  open: string;
  close: string;
};

export const insertMenuCategorySchema = createInsertSchema(menuCategoriesTable);
export const insertMenuItemSchema = createInsertSchema(menuItemsTable);
export const insertFulfillmentSettingsSchema = createInsertSchema(
  fulfillmentSettingsTable,
);
export const insertOrderSchema = createInsertSchema(ordersTable);
export const insertOrderItemSchema = createInsertSchema(orderItemsTable);
export const insertCheckoutSessionSchema = createInsertSchema(
  checkoutSessionsTable,
);

export type MenuCategory = typeof menuCategoriesTable.$inferSelect;
export type MenuItem = typeof menuItemsTable.$inferSelect;
export type FulfillmentSettings = typeof fulfillmentSettingsTable.$inferSelect;
export type CheckoutSession = typeof checkoutSessionsTable.$inferSelect;
export type Order = typeof ordersTable.$inferSelect;
export type OrderItem = typeof orderItemsTable.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;