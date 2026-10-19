import { randomBytes, randomUUID } from "node:crypto";
import type Stripe from "stripe";
import { stripeClient } from "./billing";
import { emailEnabled, escapeHtml, sendEmail } from "./email";
import { SITE_URL } from "./site";
import { ensureTables, pool } from "./tables";

// The popup discount: 25% off the first month only. One Stripe coupon holds
// the discount ("once" means the first invoice and nothing after it), and every
// signup gets its own single-use promotion code on top of it.
export const PROMO_PERCENT = 25;
const COUPON_ID = "first-month-25";
const VALID_DAYS = 30;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0, O, 1, I

export interface PromoRow {
  email: string;
  code: string;
  stripePromotionId: string;
  expiresAt: Date;
}

const makeCode = () => {
  const bytes = randomBytes(6);
  return `SCOPE-${Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("")}`;
};

export const normalizeCode = (s: string) => s.trim().toUpperCase().replace(/\s+/g, "");

async function ensureCoupon(stripe: Stripe): Promise<void> {
  try {
    await stripe.coupons.retrieve(COUPON_ID);
  } catch (err) {
    if ((err as { code?: string }).code !== "resource_missing") throw err;
    await stripe.coupons.create({
      id: COUPON_ID,
      percent_off: PROMO_PERCENT,
      duration: "once",
      name: `${PROMO_PERCENT}% off your first month`,
    });
  }
}

const rowFrom = (r: { email: string; code: string; stripe_promotion_id: string; expires_at: Date }): PromoRow => ({
  email: r.email,
  code: r.code,
  stripePromotionId: r.stripe_promotion_id,
  expiresAt: r.expires_at,
});

// Returns the visitor's code, creating it the first time. Asking again with the
// same email returns the same code, so nobody can collect extra ones.
export async function getOrCreatePromo(email: string): Promise<{ promo: PromoRow; created: boolean }> {
  await ensureTables();
  const lower = email.toLowerCase();
  const existing = await pool().query("SELECT email, code, stripe_promotion_id, expires_at FROM promo_signups WHERE email_lower = $1", [lower]);
  if (existing.rows[0]) return { promo: rowFrom(existing.rows[0]), created: false };

  const stripe = stripeClient();
  if (!stripe) throw new Error("Payments are not set up.");
  await ensureCoupon(stripe);

  const expiresAt = new Date(Date.now() + VALID_DAYS * 86_400_000);
  // A code clash is astronomically unlikely, but retry rather than fail.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode();
    let promotion: Stripe.PromotionCode;
    try {
      promotion = await stripe.promotionCodes.create({
        promotion: { type: "coupon", coupon: COUPON_ID },
        code,
        max_redemptions: 1,
        expires_at: Math.floor(expiresAt.getTime() / 1000),
        restrictions: { first_time_transaction: true },
        metadata: { source: "landing-popup" },
      });
    } catch (err) {
      if ((err as { code?: string }).code === "resource_already_exists") continue;
      throw err;
    }
    const res = await pool().query(
      `INSERT INTO promo_signups (id, email, email_lower, code, stripe_promotion_id, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email_lower) DO NOTHING RETURNING email, code, stripe_promotion_id, expires_at`,
      [randomUUID(), email, lower, code, promotion.id, expiresAt]
    );
    if (res.rows[0]) return { promo: rowFrom(res.rows[0]), created: true };
    // Two requests raced for the same email. Retire ours and use the winner.
    await stripe.promotionCodes.update(promotion.id, { active: false }).catch(() => undefined);
    const winner = await pool().query("SELECT email, code, stripe_promotion_id, expires_at FROM promo_signups WHERE email_lower = $1", [lower]);
    return { promo: rowFrom(winner.rows[0]), created: false };
  }
  throw new Error("Could not create a unique code.");
}

export async function sendPromoEmail(promo: PromoRow): Promise<boolean> {
  if (!emailEnabled()) return false;
  const link = `${SITE_URL}/pricing?code=${encodeURIComponent(promo.code)}`;
  const until = promo.expiresAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const subject = `Your ${PROMO_PERCENT}% off code for CompetitionScope`;
  const html = `<div style="font-family:Georgia,serif;color:#151c2a;max-width:560px">
<h2 style="margin:0 0 12px">Here is your ${PROMO_PERCENT}% off</h2>
<p>Thanks for stopping by. Use this code to take ${PROMO_PERCENT}% off your first month on any monthly plan:</p>
<p style="font-size:26px;letter-spacing:3px;font-weight:bold;background:#f4ecd8;border:2px dashed #ab7f3c;padding:14px 18px;display:inline-block;margin:6px 0">${escapeHtml(promo.code)}</p>
<p><a href="${escapeHtml(link)}" style="color:#7d5b2a">Choose a plan and apply your code</a></p>
<p style="color:#5c6d8c;font-size:13px">The discount applies to your first month only, then your plan renews at the normal price. Works once, on monthly billing, for new subscribers. Valid until ${escapeHtml(until)}. You can cancel anytime.</p></div>`;
  const text = `Here is your ${PROMO_PERCENT}% off\n\nYour code: ${promo.code}\n\nTake ${PROMO_PERCENT}% off your first month on any monthly plan: ${link}\n\nThe discount applies to your first month only, then your plan renews at the normal price. Works once, on monthly billing, for new subscribers. Valid until ${until}. Cancel anytime.`;
  const ok = await sendEmail({ to: promo.email, subject, html, text });
  if (ok) await pool().query("UPDATE promo_signups SET emailed = true WHERE email_lower = $1", [promo.email.toLowerCase()]);
  return ok;
}

export type PromoCheck = { ok: true; promotionId: string } | { ok: false; error: string };

// Confirms a code is one we issued and that Stripe still considers it usable.
export async function checkPromoCode(raw: string): Promise<PromoCheck> {
  const code = normalizeCode(raw);
  if (!/^[A-Z0-9-]{4,30}$/.test(code)) return { ok: false, error: "That code is not valid." };
  await ensureTables();
  const row = (await pool().query("SELECT stripe_promotion_id FROM promo_signups WHERE code = $1", [code])).rows[0];
  if (!row) return { ok: false, error: "That code is not valid." };
  const stripe = stripeClient();
  if (!stripe) return { ok: false, error: "Discounts are not available right now." };
  try {
    const p = await stripe.promotionCodes.retrieve(row.stripe_promotion_id);
    if (!p.active) return { ok: false, error: "That code has expired or was already used." };
    if (p.expires_at && p.expires_at * 1000 < Date.now()) return { ok: false, error: "That code has expired." };
    if (p.max_redemptions && p.times_redeemed >= p.max_redemptions) return { ok: false, error: "That code was already used." };
    return { ok: true, promotionId: p.id };
  } catch {
    return { ok: false, error: "We could not check that code. Please try again." };
  }
}
