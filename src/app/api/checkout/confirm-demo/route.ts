import { NextResponse } from "next/server";
import { z } from "zod";
import { updateDb } from "@/lib/db";
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

  // Demo mode never runs on a live deployment with Stripe configured —
  // it exists so the full purchase flow can be exercised without payment infra.
  if (process.env.STRIPE_SECRET_KEY || process.env.STRIPE_PAYMENT_LINK) {
    return NextResponse.json(
      { error: "Demo checkout is disabled while Stripe is configured." },
      { status: 400 }
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

  const result = await updateDb((db) => {
    const report = db.reports.find((r) => r.id === parsed.data.reportId);
    if (!report) return { error: "Report not found." as const };
    report.unlocked = true;
    report.ownerUserId = report.ownerUserId ?? userId;
    db.purchases.push({
      reportId: report.id,
      userId,
      amountCents: REPORT_PRICE_CENTS,
      createdAt: new Date().toISOString(),
      mode: "demo",
    });
    return { ok: true as const };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
