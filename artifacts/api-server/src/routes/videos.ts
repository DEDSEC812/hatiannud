import { Router, type IRouter } from "express";
import { db, videosTable, videoViewsTable, downloadsTable, usersTable } from "@workspace/db";
import { eq, desc, and, or, ilike, sql } from "drizzle-orm";
import { optionalAuth, requireAuth, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

const FREE_DOWNLOAD_LIMIT = 3;

function toApi(v: typeof videosTable.$inferSelect) {
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

function toApiPublic(v: typeof videosTable.$inferSelect) {
  return {
    id: v.id,
    title: v.title,
    description: v.description,
    thumbnailUrl: v.thumbnailUrl,
    videoUrl: v.isVip ? "" : v.videoUrl,
    category: v.category,
    durationSec: v.durationSec,
    views: v.views,
    isVip: v.isVip,
    published: v.published,
    createdAt: v.createdAt.toISOString(),
  };
}

router.get("/videos", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
  const conds = [eq(videosTable.published, true)] as any[];
  if (q) conds.push(or(ilike(videosTable.title, `%${q}%`), ilike(videosTable.description, `%${q}%`)));
  if (category) conds.push(eq(videosTable.category, category));
  const rows = await db
    .select()
    .from(videosTable)
    .where(and(...conds))
    .orderBy(desc(videosTable.createdAt))
    .limit(100);
  res.json(rows.map(toApiPublic));
});

router.get("/videos/trending", async (_req, res) => {
  const rows = await db
    .select()
    .from(videosTable)
    .where(eq(videosTable.published, true))
    .orderBy(desc(videosTable.views), desc(videosTable.createdAt))
    .limit(10);
  res.json(rows.map(toApiPublic));
});

router.get("/videos/:id", async (req, res) => {
  const [v] = await db.select().from(videosTable).where(eq(videosTable.id, String(req.params.id))).limit(1);
  if (!v) return res.status(404).json({ error: "not_found" });
  res.json(toApiPublic(v));
});

router.post("/videos/:id/view", optionalAuth, async (req: AuthedRequest, res) => {
  const id = String(req.params.id);
  const [v] = await db.select().from(videosTable).where(eq(videosTable.id, id)).limit(1);
  if (!v) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  await db.insert(videoViewsTable).values({ videoId: id, userId: req.userId ?? null });
  await db.update(videosTable).set({ views: sql`${videosTable.views} + 1` }).where(eq(videosTable.id, id));
  res.status(204).end();
});

router.post("/videos/:id/download", requireAuth, async (req: AuthedRequest, res) => {
  const id = String(req.params.id);
  const user = req.user!;
  const [v] = await db.select().from(videosTable).where(eq(videosTable.id, id)).limit(1);
  if (!v) return res.status(404).json({ error: "not_found" });

  const isVip = user.plan === "vip";
  if (!isVip) {
    if (v.isVip) {
      return res.status(402).json({ error: "vip_required", message: "Cette vidéo est réservée aux membres VIP." });
    }
    if (user.freeDownloadsUsed >= FREE_DOWNLOAD_LIMIT) {
      return res.status(402).json({
        error: "quota_exceeded",
        message: "Limite de 3 téléchargements par jour atteinte sur le plan gratuit. Revenez demain ou rejoignez notre Telegram VIP.",
      });
    }
    await db
      .update(usersTable)
      .set({ freeDownloadsUsed: user.freeDownloadsUsed + 1 })
      .where(eq(usersTable.id, user.id));
  }

  await db.insert(downloadsTable).values({ userId: user.id, videoId: id });
  const remaining = isVip ? -1 : FREE_DOWNLOAD_LIMIT - (user.freeDownloadsUsed + 1);
  res.json({ url: v.videoUrl, remaining });
});

export default router;
