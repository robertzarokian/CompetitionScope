import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getSubscription, planFromSubscription, upsertSubscription } from "@/lib/account";
import { BillingError, createCheckoutUrl, stripeClient } from "@/lib/billing";
import { PAID_PLANS, type PlanId } from "@/lib/plans";

const bodySchema = z.object({
  plan: z.enum(["starter", "growth", "agency"]),
  interval: z.enum(["month", "year"]),
  code: z.string().trim().max(40).optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Create an account or log in first." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a plan." }, { status: 400 });
  const { plan, interval, code } = parsed.data;

  // Someone who already subscribes changes plan in the billing portal, so they
  // are never charged for two subscriptions at once.
  const current = await getSubscription(user.id);
  if (planFromSubscription(current).id !== "free") {
    return NextResponse.json({ mode: "manage" as const });
  }

  if (!stripeClient()) {
    // Without Stripe keys, local development can switch plans for testing.
    // Never on a live deployment, where it would hand out paid plans for free.
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Payments are not set up yet." }, { status: 503 });
    }
    await upsertSubscription({
      userId: user.id,
      plan: plan as PlanId,
      interval,
      status: "active",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000),
      cancelAtPeriodEnd: false,
    });
    return NextResponse.json({ mode: "demo" as const });
  }

  try {
    const url = await createCheckoutUrl({
      userId: user.id,
      email: user.email,
      plan: plan as (typeof PAID_PLANS)[number],
      interval,
      origin: new URL(request.url).origin,
      promoCode: code || undefined,
    });
    return NextResponse.json({ mode: "stripe" as const, url });
  } catch (err) {
    console.error("[billing] checkout failed:", err);
    const message = err instanceof BillingError ? err.message : "We could not start the checkout. Please try again.";
    return NextResponse.json({ error: message }, { status: err instanceof BillingError ? 400 : 502 });
  }
}
