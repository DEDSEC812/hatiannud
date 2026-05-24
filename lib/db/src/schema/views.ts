import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const videoViewsTable = pgTable("video_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id"),
  videoId: uuid("video_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
