import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  isAdmin: boolean("is_admin").notNull().default(false),
  blocked: boolean("blocked").notNull().default(false),
  ageConfirmed: boolean("age_confirmed").notNull().default(false),
  plan: text("plan", { enum: ["free", "vip"] }).notNull().default("free"),
  freeDownloadsUsed: integer("free_downloads_used").notNull().default(0),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
