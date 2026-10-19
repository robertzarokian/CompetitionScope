import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserIdFromSession } from "@/lib/auth";
import { getPlan, updateProfile } from "@/lib/account";
import { markAlertsRead } from "@/lib/monitor/store";

// Printable ASCII only: the PDF fonts cannot draw other characters.
const brandSchema = z
  .string()
  .trim()
  .max(40)
  .regex(/^[\x20-\x7E]*$/, "Use letters, numbers, and common punctuation only.");

const bodySchema = z.object({
  brandName: brandSchema.nullable().optional(),
  emailAlerts: z.boolean().optional(),
  markAlertsRead: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const userId = await getUserIdFromSession();
  if (!userId) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  const { brandName, emailAlerts, markAlertsRead: read } = parsed.data;

  if (brandName !== undefined) {
    const plan = await getPlan(userId);
    if (!plan.limits.whiteLabel) {
      return NextResponse.json({ error: "White-label reports are included with the Agency plan." }, { status: 403 });
    }
    await updateProfile(userId, { brandName: brandName ? brandName : null });
  }
  if (emailAlerts !== undefined) await updateProfile(userId, { emailAlerts });
  if (read) await markAlertsRead(userId);
  return NextResponse.json({ ok: true });
}
