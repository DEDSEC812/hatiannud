import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const downloadsTable = pgTable("downloads", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  videoId: uuid("video_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Download = typeof downloadsTable.$inferSelect;
