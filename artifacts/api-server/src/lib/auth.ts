import type { Request, Response, NextFunction } from "express";
import { getAuth, createClerkClient } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export interface AuthedRequest extends Request {
  userId?: string;
  user?: typeof usersTable.$inferSelect;
}

export async function ensureUser(userId: string) {
  const existing = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (existing[0]) {
    if (existing[0].subscriptionEndsAt && existing[0].subscriptionEndsAt < new Date() && existing[0].plan === "vip") {
      const [downgraded] = await db
        .update(usersTable)
        .set({ plan: "free" })
        .where(eq(usersTable.id, userId))
        .returning();
      return downgraded;
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

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = adminEmails.includes(email.toLowerCase());

  const [created] = await db
    .insert(usersTable)
    .values({ id: userId, email, displayName, isAdmin })
    .onConflictDoNothing()
    .returning();
  if (created) return created;
  const [again] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
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
