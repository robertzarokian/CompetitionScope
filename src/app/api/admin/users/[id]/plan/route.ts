import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin, logAdmin, sameOrigin } from "@/lib/admin";
import { getSubscription, upsertSubscription } from "@/lib/account";
import { pool } from "@/lib/tables";

const bodySchema = z.object({ plan: z.enum(["free", "starter", "growth", "agency"]) });

// Gives a customer a plan by hand (for testing, comps, or refunds) or returns
// them to the free plan. It never touches money in Stripe.
export async function POST(request: Request, ctx: RouteContext<"/api/admin/users/[id]/plan">) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { id } = await ctx.params;
  const user = (await pool().query("SELECT email FROM users WHERE id = $1", [id])).rows[0];
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const existing = await getSubscription(id);
  if (parsed.data.plan === "free") {
    if (existing) await upsertSubscription({ ...existing, status: "canceled" });
  } else {
    await upsertSubscription({
      userId: id,
      plan: parsed.data.plan,
      interval: existing?.interval ?? "month",
      status: "active",
      stripeCustomerId: existing?.stripeCustomerId ?? null,
      stripeSubscriptionId: existing?.stripeSubscriptionId ?? null,
      currentPeriodEnd: existing?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: false,
    });
  }
  await logAdmin(admin, "set_plan", `${user.email} -> ${parsed.data.plan}`);
  return NextResponse.json({ ok: true });
}
