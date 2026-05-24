import { pgTable, text, integer, boolean } from "drizzle-orm/pg-core";

export const plansTable = pgTable("plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  durationDays: integer("duration_days").notNull(),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").notNull().default("USD"),
  features: text("features").array().notNull().default([] as string[]),
  active: boolean("active").notNull().default(true),
  stripePriceId: text("stripe_price_id"),
});

export type Plan = typeof plansTable.$inferSelect;
export type InsertPlan = typeof plansTable.$inferInsert;
