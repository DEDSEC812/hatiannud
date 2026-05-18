import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const ticketsTable = pgTable("support_tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  reply: text("reply"),
  status: text("status", { enum: ["open", "answered", "closed"] }).notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Ticket = typeof ticketsTable.$inferSelect;
