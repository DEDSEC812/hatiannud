import { Router, type IRouter } from "express";
import { db, videosTable, usersTable, ticketsTable, downloadsTable } from "@workspace/db";
import { eq, desc, sql, and, gt } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

router.use(requireAuth, requireAdmin);

router.get("/admin/stats", async (_req, res) => {
  const [users] = await db.select({ c: sql<number>`count(*)::int` }).from(usersTable);
  const [vipsRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(and(eq(usersTable.plan, "vip"), gt(usersTable.subscriptionEndsAt, new Date())));
  const [vids] = await db.select({ c: sql<number>`count(*)::int` }).from(videosTable);
  const [viewsRow] = await db.select({ c: sql<number>`coalesce(sum(${videosTable.views}), 0)::int` }).from(videosTable);
  const [downs] = await db.select({ c: sql<number>`count(*)::int` }).from(downloadsTable);
  const [tickets] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(ticketsTable)
    .where(eq(ticketsTable.status, "open"));
  res.json({
    totalUsers: users.c,
    activeVip: vipsRow.c,
    totalVideos: vids.c,
    totalViews: viewsRow.c,
    totalDownloads: downs.c,
    openTickets: tickets.c,
  });
});

function toVideo(v: typeof videosTable.$inferSelect) {
  return {
    id: v.id,
    title: v.title,
    description: v.description,
    thumbnailUrl: v.thumbnailUrl,
    videoUrl: v.videoUrl,
    category: v.category,
    durationSec: v.durationSec,
    views: v.views,
    isVip: v.isVip,
    published: v.published,
    createdAt: v.createdAt.toISOString(),
  };
}

router.get("/admin/videos", async (_req, res) => {
  const rows = await db.select().from(videosTable).orderBy(desc(videosTable.createdAt));
  res.json(rows.map(toVideo));
});

router.post("/admin/videos", async (req, res) => {
  const b = req.body ?? {};
  const [created] = await db
    .insert(videosTable)
    .values({
      title: String(b.title ?? "").trim(),
      description: String(b.description ?? "").trim(),
      thumbnailUrl: String(b.thumbnailUrl ?? ""),
      videoUrl: String(b.videoUrl ?? ""),
      category: String(b.category ?? "Général"),
      durationSec: Number(b.durationSec ?? 0),
      isVip: Boolean(b.isVip),
      published: b.published === undefined ? true : Boolean(b.published),
    })
    .returning();
  res.status(201).json(toVideo(created));
});

router.patch("/admin/videos/:id", async (req, res) => {
  const b = req.body ?? {};
  const [updated] = await db
    .update(videosTable)
    .set({
      title: String(b.title ?? "").trim(),
      description: String(b.description ?? "").trim(),
      thumbnailUrl: String(b.thumbnailUrl ?? ""),
      videoUrl: String(b.videoUrl ?? ""),
      category: String(b.category ?? "Général"),
      durationSec: Number(b.durationSec ?? 0),
      isVip: Boolean(b.isVip),
      published: b.published === undefined ? true : Boolean(b.published),
    })
    .where(eq(videosTable.id, String(req.params.id)))
    .returning();
  if (!updated) return res.status(404).json({ error: "not_found" });
  res.json(toVideo(updated));
});

router.delete("/admin/videos/:id", async (req, res) => {
  await db.delete(videosTable).where(eq(videosTable.id, String(req.params.id)));
  res.status(204).end();
});

function toUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    plan: u.plan,
    blocked: u.blocked,
    isAdmin: u.isAdmin,
    ageConfirmed: u.ageConfirmed,
    createdAt: u.createdAt.toISOString(),
    subscriptionEndsAt: u.subscriptionEndsAt ? u.subscriptionEndsAt.toISOString() : null,
  };
}

router.get("/admin/users", async (_req, res) => {
  const rows = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json(rows.map(toUser));
});

router.post("/admin/users/:id/block", async (req, res) => {
  const blocked = Boolean(req.body?.blocked);
  const [updated] = await db
    .update(usersTable)
    .set({ blocked })
    .where(eq(usersTable.id, String(req.params.id)))
    .returning();
  if (!updated) return res.status(404).json({ error: "not_found" });
  res.json(toUser(updated));
});

function toTicket(t: typeof ticketsTable.$inferSelect) {
  return {
    id: t.id,
    userId: t.userId,
    subject: t.subject,
    message: t.message,
    reply: t.reply,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/admin/tickets", async (_req, res) => {
  const rows = await db.select().from(ticketsTable).orderBy(desc(ticketsTable.createdAt));
  res.json(rows.map(toTicket));
});

router.post("/admin/tickets/:id/reply", async (req, res) => {
  const reply = String(req.body?.reply ?? "").trim();
  if (!reply) return res.status(400).json({ error: "empty_reply" });
  const [updated] = await db
    .update(ticketsTable)
    .set({ reply, status: "answered" })
    .where(eq(ticketsTable.id, String(req.params.id)))
    .returning();
  if (!updated) return res.status(404).json({ error: "not_found" });
  res.json(toTicket(updated));
});

export default router;
