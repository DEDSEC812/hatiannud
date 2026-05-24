import { Router, type IRouter } from "express";
import { db, ticketsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

function toApi(t: typeof ticketsTable.$inferSelect) {
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

router.get("/support/tickets", requireAuth, async (req: AuthedRequest, res) => {
  const rows = await db
    .select()
    .from(ticketsTable)
    .where(eq(ticketsTable.userId, req.user!.id))
    .orderBy(desc(ticketsTable.createdAt));
  res.json(rows.map(toApi));
});

router.post("/support/tickets", requireAuth, async (req: AuthedRequest, res) => {
  const subject = String(req.body?.subject ?? "").trim();
  const message = String(req.body?.message ?? "").trim();
  if (subject.length < 2 || subject.length > 200) return res.status(400).json({ error: "invalid_subject" });
  if (message.length < 2 || message.length > 5000) return res.status(400).json({ error: "invalid_message" });
  const [created] = await db
    .insert(ticketsTable)
    .values({ userId: req.user!.id, subject, message })
    .returning();
  res.status(201).json(toApi(created));
});

export default router;
