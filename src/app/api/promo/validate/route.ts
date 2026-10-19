import { NextResponse } from "next/server";
import { z } from "zod";
import { sameOrigin } from "@/lib/admin";
import { checkPromoCode, PROMO_PERCENT } from "@/lib/promo";
import { clientIp, consume } from "@/lib/rateLimit";

const schema = z.object({ code: z.string().trim().min(3).max(40) });

// Lets the pricing page confirm a code before the customer goes to checkout.
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Enter your code." }, { status: 400 });
  if (!(await consume("promo-check", clientIp(request), 20, 3600))) {
    return NextResponse.json({ ok: false, error: "Too many tries. Please wait a while." }, { status: 429 });
  }
  const result = await checkPromoCode(parsed.data.code);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, percent: PROMO_PERCENT });
}
