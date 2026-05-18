import { Router, type IRouter } from "express";
import { db, plansTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

function toPlan(p: typeof plansTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    durationDays: p.durationDays,
    priceCents: p.priceCents,
    currency: p.currency,
    features: p.features,
  };
}

router.get("/plans", async (_req, res) => {
  const rows = await db.select().from(plansTable).where(eq(plansTable.active, true));
  res.json(rows.map(toPlan));
});

router.get("/subscriptions/me", requireAuth, async (req: AuthedRequest, res) => {
  const u = req.user!;
  const active = u.plan === "vip" && u.subscriptionEndsAt && u.subscriptionEndsAt > new Date();
  res.json({
    plan: u.plan,
    status: active ? "active" : u.plan === "vip" ? "active" : "free",
    startedAt: null,
    endsAt: u.subscriptionEndsAt ? u.subscriptionEndsAt.toISOString() : null,
    planName: u.plan === "vip" ? "VIP" : "Gratuit",
  });
});

router.post("/subscriptions/checkout", requireAuth, async (req: AuthedRequest, res) => {
  const planId = String(req.body?.planId ?? "");
  if (!planId) return res.status(400).json({ error: "missing_plan" });

  const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, planId)).limit(1);
  if (!plan) return res.status(404).json({ error: "plan_not_found" });

  // Stripe wiring (kept lazy so the server still runs without Stripe configured).
  const secret = process.env.STRIPE_SECRET_KEY;
  if (secret) {
    try {
      const StripeMod = (await import("stripe")).default;
      const stripe = new StripeMod(secret);
      const origin = `${req.protocol}://${req.get("host")}`;
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: `${origin}/account?checkout=success&plan=${plan.id}`,
        cancel_url: `${origin}/plans?checkout=cancel`,
        customer_email: req.user!.email,
        client_reference_id: req.user!.id,
        metadata: { planId: plan.id, userId: req.user!.id, durationDays: String(plan.durationDays) },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: plan.currency.toLowerCase(),
              unit_amount: plan.priceCents,
              product_data: {
                name: `Haïtien Nud Média — ${plan.name}`,
                description: `Accès VIP ${plan.durationDays} jours`,
              },
            },
          },
        ],
      });
      if (session.url) return res.json({ url: session.url });
    } catch (err) {
      req.log?.error({ err }, "stripe_checkout_failed");
    }
  }

  // Dev fallback: instantly grant the plan so the flow is testable end-to-end.
  const endsAt = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);
  await db
    .update(usersTable)
    .set({ plan: "vip", subscriptionEndsAt: endsAt, freeDownloadsUsed: 0 })
    .where(eq(usersTable.id, req.user!.id));
  const origin = `${req.protocol}://${req.get("host")}`;
  res.json({ url: `${origin}/account?checkout=dev_success&plan=${plan.id}` });
});

export default router;
