import { NextResponse } from "next/server";
import { z } from "zod";
import { sameOrigin } from "@/lib/admin";
import { emailEnabled } from "@/lib/email";
import { getOrCreatePromo, PROMO_PERCENT, sendPromoEmail } from "@/lib/promo";
import { clientIp, consume } from "@/lib/rateLimit";

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(200) });

// Popup signup: creates the visitor's own code and emails it. Only visitors who
// use the popup get a code, ordinary account signups do not.
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
  const { email } = parsed.data;

  const ip = clientIp(request);
  if (!(await consume("promo-ip", ip, 5, 86400)) || !(await consume("promo-email", email, 3, 86400))) {
    return NextResponse.json({ ok: false, error: "Too many requests. Please try again tomorrow." }, { status: 429 });
  }

  try {
    const { promo } = await getOrCreatePromo(email);
    const emailed = await sendPromoEmail(promo);
    // If email is not set up or fails, show the code on screen instead of losing it.
    return NextResponse.json({
      ok: true,
      emailed,
      percent: PROMO_PERCENT,
      code: emailed ? undefined : promo.code,
      emailConfigured: emailEnabled(),
    });
  } catch (err) {
    console.error("[promo] signup failed:", err);
    return NextResponse.json({ ok: false, error: "We could not create your code. Please try again." }, { status: 502 });
  }
}
