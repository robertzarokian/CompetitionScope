import { ensureTables, pool } from "./tables";
import { PLANS, isPlanId, type BillingInterval, type Plan, type PlanId } from "./plans";

export interface SubscriptionRow {
  userId: string;
  plan: PlanId;
  interval: BillingInterval;
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

interface Row {
  user_id: string;
  plan: string;
  interval: string;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: Date | null;
  cancel_at_period_end: boolean;
}

const toSub = (r: Row): SubscriptionRow => ({
  userId: r.user_id,
  plan: isPlanId(r.plan) ? r.plan : "free",
  interval: r.interval === "year" ? "year" : "month",
  status: r.status,
  stripeCustomerId: r.stripe_customer_id,
  stripeSubscriptionId: r.stripe_subscription_id,
  currentPeriodEnd: r.current_period_end,
  cancelAtPeriodEnd: r.cancel_at_period_end,
});

export async function getSubscription(userId: string): Promise<SubscriptionRow | null> {
  await ensureTables();
  const res = await pool().query<Row>("SELECT * FROM subscriptions WHERE user_id = $1", [userId]);
  return res.rows[0] ? toSub(res.rows[0]) : null;
}

export async function getSubscriptionByCustomer(customerId: string): Promise<SubscriptionRow | null> {
  await ensureTables();
  const res = await pool().query<Row>("SELECT * FROM subscriptions WHERE stripe_customer_id = $1 LIMIT 1", [customerId]);
  return res.rows[0] ? toSub(res.rows[0]) : null;
}

export async function upsertSubscription(s: SubscriptionRow): Promise<void> {
  await ensureTables();
  await pool().query(
    `INSERT INTO subscriptions
       (user_id, plan, interval, status, stripe_customer_id, stripe_subscription_id, current_period_end, cancel_at_period_end, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())
     ON CONFLICT (user_id) DO UPDATE SET
       plan = EXCLUDED.plan, interval = EXCLUDED.interval, status = EXCLUDED.status,
       stripe_customer_id = EXCLUDED.stripe_customer_id,
       stripe_subscription_id = EXCLUDED.stripe_subscription_id,
       current_period_end = EXCLUDED.current_period_end,
       cancel_at_period_end = EXCLUDED.cancel_at_period_end,
       updated_at = now()`,
    [s.userId, s.plan, s.interval, s.status, s.stripeCustomerId, s.stripeSubscriptionId, s.currentPeriodEnd, s.cancelAtPeriodEnd]
  );
}

// Statuses that still grant the paid plan. past_due keeps access while Stripe
// retries the card, instead of cutting people off over a single failed payment.
const ACTIVE = new Set(["active", "trialing", "past_due"]);

export function planFromSubscription(sub: SubscriptionRow | null): Plan {
  if (!sub || !ACTIVE.has(sub.status)) return PLANS.free;
  return PLANS[sub.plan];
}

export async function getPlan(userId: string | null): Promise<Plan> {
  if (!userId) return PLANS.free;
  return planFromSubscription(await getSubscription(userId));
}

export interface Profile {
  userId: string;
  brandName: string | null;
  freeAuditsUsed: number;
  emailAlerts: boolean;
  lastBillingSync: Date | null;
}

export async function getProfile(userId: string): Promise<Profile> {
  await ensureTables();
  await pool().query("INSERT INTO profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING", [userId]);
  const res = await pool().query<{
    user_id: string;
    brand_name: string | null;
    free_audits_used: number;
    email_alerts: boolean;
    last_billing_sync: Date | null;
  }>("SELECT * FROM profiles WHERE user_id = $1", [userId]);
  const r = res.rows[0];
  return {
    userId: r.user_id,
    brandName: r.brand_name,
    freeAuditsUsed: r.free_audits_used,
    emailAlerts: r.email_alerts,
    lastBillingSync: r.last_billing_sync,
  };
}

export async function updateProfile(userId: string, patch: { brandName?: string | null; emailAlerts?: boolean }) {
  await getProfile(userId);
  if (patch.brandName !== undefined) {
    await pool().query("UPDATE profiles SET brand_name = $2 WHERE user_id = $1", [userId, patch.brandName]);
  }
  if (patch.emailAlerts !== undefined) {
    await pool().query("UPDATE profiles SET email_alerts = $2 WHERE user_id = $1", [userId, patch.emailAlerts]);
  }
}
