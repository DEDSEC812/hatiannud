import type { Request, Response, NextFunction } from "express";
import { getAuth, createClerkClient } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export interface AuthedRequest extends Request {
  userId?: string;
  user?: typeof usersTable.$inferSelect;
}

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function ensureUser(userId: string) {
  const existing = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (existing[0]) {
    const adminEmails = getAdminEmails();
    const shouldBeAdmin = adminEmails.includes(existing[0].email.toLowerCase());
    const needsVipDowngrade =
      existing[0].subscriptionEndsAt &&
      existing[0].subscriptionEndsAt < new Date() &&
      existing[0].plan === "vip";

    // Sync admin flag on every login + handle VIP expiry
    if (shouldBeAdmin !== existing[0].isAdmin || needsVipDowngrade) {
      const updates: Partial<typeof usersTable.$inferInsert> = {};
      if (shouldBeAdmin !== existing[0].isAdmin) updates.isAdmin = shouldBeAdmin;
      if (needsVipDowngrade) updates.plan = "free";

      const [updated] = await db
        .update(usersTable)
        .set(updates)
        .where(eq(usersTable.id, userId))
        .returning();
      return updated;
    }
    return existing[0];
  }

  let email = `${userId}@unknown.local`;
  let displayName: string | null = null;
  try {
    const u = await clerk.users.getUser(userId);
    email = u.primaryEmailAddress?.emailAddress ?? u.emailAddresses[0]?.emailAddress ?? email;
    displayName = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || null;
  } catch {
    // ignore — fallback to placeholders
  }

  const adminEmails = getAdminEmails();
  const isAdmin = adminEmails.includes(email.toLowerCase());

  const [created] = await db
    .insert(usersTable)
    .values({ id: userId, email, displayName, isAdmin })
    .onConflictDoNothing()
    .returning();
  if (created) return created;

  // Race condition fallback: user was created between our SELECT and INSERT
  const [again] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  // Still sync admin status for the fallback case
  if (again && adminEmails.includes(again.email.toLowerCase()) !== again.isAdmin) {
    const [fixed] = await db
      .update(usersTable)
      .set({ isAdmin: adminEmails.includes(again.email.toLowerCase()) })
      .where(eq(usersTable.id, userId))
      .returning();
    return fixed;
  }
  return again!;
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  try {
    const user = await ensureUser(userId);
    if (user.blocked) return res.status(403).json({ error: "blocked" });
    req.userId = userId;
    req.user = user;
    next();
  } catch (err) {
    req.log?.error({ err }, "ensureUser failed");
    res.status(500).json({ error: "auth_failed" });
  }
}

export async function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (userId) {
    try {
      const user = await ensureUser(userId);
      if (!user.blocked) {
        req.userId = userId;
        req.user = user;
      }
    } catch {
      // ignore
    }
  }
  next();
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "admin_required" });
  next();
}
