import { NextResponse } from "next/server";
import Stripe from "stripe";
import { applyStripeSubscription, stripeClient } from "@/lib/billing";
import { syncFromCheckoutSession } from "@/lib/billing";

// Stripe requires the raw, unparsed request body to verify webhook signatures.
// Subscription state is also re-checked with Stripe when customers return to
// the site, so a missed webhook delays an update but never loses a payment.
export async function POST(request: Request) {
  const stripe = stripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe is not configured on this server." }, { status: 400 });
  }

  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[CompetitionScope] Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.metadata?.userId) {
        await syncFromCheckoutSession(session.id, session.metadata.userId);
      }
    } else if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await applyStripeSubscription(event.data.object as Stripe.Subscription);
    }
  } catch (err) {
    console.error("[CompetitionScope] Stripe webhook handling failed:", err);
    // A 500 makes Stripe retry the event later.
    return NextResponse.json({ error: "Could not process the event." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
