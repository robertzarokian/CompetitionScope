import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { readDb } from "@/lib/db";
import { getUserIdFromSession } from "@/lib/auth";
import { REPORT_PRICE_CENTS } from "@/lib/pricing";

const bodySchema = z.object({ reportId: z.string().min(1) });

export async function POST(request: Request) {
  const userId = await getUserIdFromSession();
  if (!userId) {
    return NextResponse.json(
      { error: "You need an account to unlock this report." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing report id." }, { status: 400 });
  }

  const db = await readDb();
  const report = db.reports.find((r) => r.id === parsed.data.reportId);
  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }
  if (report.unlocked) {
    return NextResponse.json({ mode: "already-unlocked" as const });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (secretKey) {
    const stripe = new Stripe(secretKey);
    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: REPORT_PRICE_CENTS,
            product_data: {
              name: `CompetitionScope Report: ${report.answers.companyName || "Your Company"}`,
              description:
                "Full competitor breakdown, success factors, and roadmap, plus a branded PDF export.",
            },
          },
        },
      ],
      success_url: `${origin}/report/${report.id}/full?purchased=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/${report.id}`,
      customer_email: report.answers.email || undefined,
      metadata: { reportId: report.id, userId },
    });

    return NextResponse.json({ mode: "stripe" as const, url: session.url });
  }

  const paymentLink = process.env.STRIPE_PAYMENT_LINK;
  if (paymentLink) {
    // A Stripe Payment Link is a single static URL — it has no per-request
    // success_url, so we can't have Stripe hand the reportId back to us.
    // Instead we stash it in a short-lived cookie before the browser leaves
    // the site, and /api/checkout/return reads it when the Payment Link's
    // dashboard-configured "after payment" redirect sends the customer back.
    // There's no secret key here, so this trusts the redirect happened
    // rather than cryptographically verifying payment the way the Stripe
    // Checkout Session path above does.
    const url = new URL(paymentLink);
    url.searchParams.set("client_reference_id", report.id);
    if (report.answers.email) {
      url.searchParams.set("prefilled_email", report.answers.email);
    }

    const response = NextResponse.json({ mode: "stripe" as const, url: url.toString() });
    response.cookies.set("pending_checkout_report_id", report.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });
    return response;
  }

  // No Stripe configuration at all — client falls back to the demo checkout UI.
  return NextResponse.json({ mode: "demo" as const });
}
