import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

const FREE_DOWNLOAD_LIMIT = 2;

function toMe(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    plan: u.plan,
    downloadsRemaining: u.plan === "vip" ? -1 : Math.max(0, FREE_DOWNLOAD_LIMIT - u.freeDownloadsUsed),
    ageConfirmed: u.ageConfirmed,
    isAdmin: u.isAdmin,
    subscriptionEndsAt: u.subscriptionEndsAt ? u.subscriptionEndsAt.toISOString() : null,
  };
}

router.get("/me", requireAuth, (req: AuthedRequest, res) => {
  res.json(toMe(req.user!));
});

router.post("/me/age-confirm", requireAuth, async (req: AuthedRequest, res) => {
  const [updated] = await db
    .update(usersTable)
    .set({ ageConfirmed: true })
    .where(eq(usersTable.id, req.user!.id))
    .returning();
  res.json(toMe(updated));
});

export default router;
