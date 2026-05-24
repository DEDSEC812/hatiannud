import { Router, type IRouter } from "express";
import { db, commentsTable, videosTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { optionalAuth, requireAuth, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

function toApi(c: typeof commentsTable.$inferSelect) {
  return {
    id: c.id,
    videoId: c.videoId,
    userId: c.userId,
    body: c.body,
    anonymous: c.anonymous,
    displayName: c.displayName,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/videos/:id/comments", async (req, res) => {
  const rows = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.videoId, String(req.params.id)))
    .orderBy(desc(commentsTable.createdAt))
    .limit(200);
  res.json(rows.map(toApi));
});

router.post("/videos/:id/comments", optionalAuth, async (req: AuthedRequest, res) => {
  const body = String(req.body?.body ?? "").trim();
  const anonymous = Boolean(req.body?.anonymous);
  if (body.length < 1 || body.length > 2000) {
    return res.status(400).json({ error: "invalid_body" });
  }
  const [v] = await db.select().from(videosTable).where(eq(videosTable.id, String(req.params.id))).limit(1);
  if (!v) return res.status(404).json({ error: "not_found" });

  const showAnon = anonymous || !req.user;
  const displayName = showAnon
    ? "Anonyme"
    : req.user?.displayName || req.user?.email?.split("@")[0] || "Utilisateur";

  const [created] = await db
    .insert(commentsTable)
    .values({
      videoId: String(req.params.id),
      userId: req.user?.id ?? null,
      body,
      anonymous: showAnon,
      displayName,
    })
    .returning();

  res.status(201).json(toApi(created));
});

router.delete("/comments/:id", requireAuth, async (req: AuthedRequest, res) => {
  const [c] = await db.select().from(commentsTable).where(eq(commentsTable.id, String(req.params.id))).limit(1);
  if (!c) return res.status(404).json({ error: "not_found" });
  if (c.userId !== req.user!.id && !req.user!.isAdmin) {
    return res.status(403).json({ error: "forbidden" });
  }
  await db.delete(commentsTable).where(eq(commentsTable.id, String(req.params.id)));
  res.status(204).end();
});

export default router;
