import Stripe from "stripe";
import {
  getProfile,
  getSubscription,
  getSubscriptionByCustomer,
  upsertSubscription,
  type SubscriptionRow,
} from "./account";
import { PLANS, isPlanId, priceCents, type BillingInterval, type PlanId } from "./plans";
import { ensureTables, pool } from "./tables";

export function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key) : null;
}

export class BillingError extends Error {}

const customerId = (c: Stripe.Subscription["customer"]) => (typeof c === "string" ? c : c.id);

// Stripe moved the billing period onto the subscription items in newer API
// versions, so read it from there and fall back to the old location.
function periodEnd(sub: Stripe.Subscription): Date | null {
  const fromItem = sub.items?.data?.[0]?.current_period_end;
  const legacy = (sub as unknown as { current_period_end?: number }).current_period_end;
  const seconds = fromItem ?? legacy;
  return typeof seconds === "number" ? new Date(seconds * 1000) : null;
}

function rowFromSubscription(sub: Stripe.Subscription, userId: string): SubscriptionRow | null {
  const plan = sub.metadata?.plan;
  if (!plan || !isPlanId(plan) || plan === "free") return null;
  return {
    userId,
    plan,
    interval: sub.metadata?.interval === "year" ? "year" : "month",
    status: sub.status,
    stripeCustomerId: customerId(sub.customer),
    stripeSubscriptionId: sub.id,
    currentPeriodEnd: periodEnd(sub),
    cancelAtPeriodEnd: !!sub.cancel_at_period_end,
  };
}

// Starts a Stripe Checkout for a subscription. The price is sent inline, so
// no products or prices need to exist in the Stripe dashboard first.
export async function createCheckoutUrl(args: {
  userId: string;
  email: string;
  plan: PlanId;
  interval: BillingInterval;
  origin: string;
}): Promise<string> {
  const stripe = stripeClient();
  if (!stripe) throw new BillingError("Payments are not set up yet.");
  if (args.plan === "free") throw new BillingError("The free plan does not need a payment.");

  const plan = PLANS[args.plan];
  const existing = await getSubscription(args.userId);
  const metadata = { userId: args.userId, plan: args.plan, interval: args.interval };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: priceCents(plan, args.interval),
          recurring: { interval: args.interval },
          product_data: {
            name: `CompetitionScope ${plan.name}`,
            description: plan.tagline,
          },
        },
      },
    ],
    ...(existing?.stripeCustomerId ? { customer: existing.stripeCustomerId } : { customer_email: args.email }),
    success_url: `${args.origin}/dashboard?subscribed=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${args.origin}/pricing`,
    metadata,
    subscription_data: { metadata },
    allow_promotion_codes: true,
  });
  if (!session.url) throw new BillingError("Stripe did not return a checkout address.");
  return session.url;
}

// Called when the customer lands back on the site after paying. It verifies the
// session with Stripe itself, so access does not depend on the webhook arriving.
export async function syncFromCheckoutSession(sessionId: string, userId: string): Promise<boolean> {
  const stripe = stripeClient();
  if (!stripe) return false;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
    if (session.mode !== "subscription" || session.metadata?.userId !== userId) return false;
    const sub = session.subscription;
    if (!sub || typeof sub === "string") return false;
    const row = rowFromSubscription(sub, userId);
    if (!row) return false;
    await upsertSubscription(row);
    return true;
  } catch (err) {
    console.error("[billing] could not verify checkout session:", err);
    return false;
  }
}

// Refreshes a customer's subscription from Stripe (for example after they
// cancel in the billing portal). Skipped if checked in the last few minutes.
export async function syncUserFromStripe(userId: string, force = false): Promise<void> {
  const stripe = stripeClient();
  if (!stripe) return;
  const sub = await getSubscription(userId);
  if (!sub?.stripeCustomerId) return;
  const profile = await getProfile(userId);
  if (!force && profile.lastBillingSync && Date.now() - profile.lastBillingSync.getTime() < 5 * 60_000) return;

  try {
    const list = await stripe.subscriptions.list({ customer: sub.stripeCustomerId, status: "all", limit: 5 });
    const live = list.data.find((s) => ["active", "trialing", "past_due"].includes(s.status)) ?? list.data[0];
    if (live) {
      const row = rowFromSubscription(live, userId);
      if (row) await upsertSubscription(row);
    } else {
      await upsertSubscription({ ...sub, status: "canceled" });
    }
    await ensureTables();
    await pool().query("UPDATE profiles SET last_billing_sync = now() WHERE user_id = $1", [userId]);
  } catch (err) {
    console.error("[billing] could not sync from Stripe:", err);
  }
}

// Applies a subscription event sent by Stripe's webhook.
export async function applyStripeSubscription(sub: Stripe.Subscription): Promise<void> {
  let userId: string | undefined = sub.metadata?.userId;
  if (!userId) {
    const existing = await getSubscriptionByCustomer(customerId(sub.customer));
    userId = existing?.userId;
  }
  if (!userId) return;
  const row = rowFromSubscription(sub, userId);
  if (row) await upsertSubscription(row);
}

export async function createPortalUrl(userId: string, origin: string): Promise<string> {
  const stripe = stripeClient();
  if (!stripe) throw new BillingError("Payments are not set up yet.");
  const sub = await getSubscription(userId);
  if (!sub?.stripeCustomerId) throw new BillingError("There is no subscription to manage yet.");
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${origin}/dashboard`,
  });
  return session.url;
}
