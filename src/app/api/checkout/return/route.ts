import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updateDb } from "@/lib/db";
import { getUserIdFromSession } from "@/lib/auth";
import { REPORT_PRICE_CENTS } from "@/lib/pricing";

const COOKIE_NAME = "pending_checkout_report_id";

/**
 * Where Stripe's Payment Link "after payment" redirect (configured in the
 * Dashboard, not per-request) sends the customer back. There's no secret
 * key in this flow, so we can't verify the payment — we trust that arriving
 * here with the cookie set in /api/checkout/create means the redirect
 * happened, the same trust level as the demo checkout path.
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const cookieStore = await cookies();
  const reportId = cookieStore.get(COOKIE_NAME)?.value;

  if (!reportId) {
    return NextResponse.redirect(`${origin}/`);
  }

  const userId = await getUserIdFromSession();
  if (!userId) {
    const response = NextResponse.redirect(`${origin}/checkout/${reportId}`);
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  const result = await updateDb((db) => {
    const report = db.reports.find((r) => r.id === reportId);
    if (!report) return { found: false as const };
    if (!report.unlocked) {
      report.unlocked = true;
      report.ownerUserId = report.ownerUserId ?? userId;
      db.purchases.push({
        reportId: report.id,
        userId,
        amountCents: REPORT_PRICE_CENTS,
        createdAt: new Date().toISOString(),
        mode: "payment-link",
      });
    }
    return { found: true as const };
  });

  const destination = result.found
    ? `${origin}/report/${reportId}/full?purchased=1`
    : `${origin}/`;

  const response = NextResponse.redirect(destination);
  response.cookies.delete(COOKIE_NAME);
  return response;
}
