import { NextResponse } from "next/server";
import Stripe from "stripe";
import { updateDb } from "@/lib/db";
import { REPORT_PRICE_CENTS } from "@/lib/pricing";

// Stripe requires the raw, unparsed request body to verify webhook signatures.
export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe is not configured on this server." },
      { status: 400 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const stripe = new Stripe(secretKey);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[CompetitionScope] Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const reportId = session.metadata?.reportId;
    const userId = session.metadata?.userId;
    if (reportId) {
      await updateDb((db) => {
        const report = db.reports.find((r) => r.id === reportId);
        if (!report) return;
        report.unlocked = true;
        report.ownerUserId = report.ownerUserId ?? userId ?? null;
        db.purchases.push({
          reportId,
          userId: userId ?? "unknown",
          amountCents: session.amount_total ?? REPORT_PRICE_CENTS,
          createdAt: new Date().toISOString(),
          mode: "stripe",
        });
      });
    }
  }

  return NextResponse.json({ received: true });
}
