import Stripe from "stripe";
import { updateDb } from "./db";
import { REPORT_PRICE_CENTS } from "./pricing";

/**
 * Belt-and-suspenders confirmation used on the success-redirect page.
 * The Stripe webhook is the source of truth in production, but webhooks
 * can't reach `localhost` during local development, so we also verify
 * the Checkout Session directly when the customer lands back on the site.
 */
export async function confirmStripeSessionAndUnlock(
  reportId: string,
  sessionId: string
): Promise<boolean> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return false;

  const stripe = new Stripe(secretKey);
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") return false;
    if (session.metadata?.reportId !== reportId) return false;

    await updateDb((db) => {
      const report = db.reports.find((r) => r.id === reportId);
      if (!report || report.unlocked) return;
      report.unlocked = true;
      db.purchases.push({
        reportId,
        userId: session.metadata?.userId ?? "unknown",
        amountCents: session.amount_total ?? REPORT_PRICE_CENTS,
        createdAt: new Date().toISOString(),
        mode: "stripe",
      });
    });
    return true;
  } catch (err) {
    console.error("[CompetitionScope] Failed to verify Stripe session:", err);
    return false;
  }
}
