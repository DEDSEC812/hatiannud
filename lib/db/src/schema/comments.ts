import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { videosTable } from "./videos";

export const commentsTable = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  videoId: uuid("video_id").notNull().references(() => videosTable.id, { onDelete: "cascade" }),
  userId: text("user_id"),
  body: text("body").notNull(),
  anonymous: boolean("anonymous").notNull().default(false),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Comment = typeof commentsTable.$inferSelect;
export type InsertComment = typeof commentsTable.$inferInsert;
