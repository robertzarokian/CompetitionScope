import { NextResponse } from "next/server";
import { speedRequestSchema } from "@/lib/audit/schema";
import { runPageSpeed } from "@/lib/audit/pagespeed";
import { getAuditSession } from "@/lib/audit/session";
import { fail, handleError, readBody } from "@/lib/audit/http";
import { getUserIdFromSession } from "@/lib/auth";
import { consume, enforceLimits } from "@/lib/rateLimit";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await readBody(request, speedRequestSchema);
  if (body instanceof NextResponse) return body;
  const userId = await getUserIdFromSession();
  if (!userId) return fail("Log in to run an audit.", 401);
  const input = await getAuditSession(body.auditId, userId);
  if (!input) return fail("This audit has expired. Please start a new one.", 404);
  try {
    await enforceLimits(request, "audit-speed", 30);
    if (!(await consume("audit-speed-session", body.auditId, 2, 86400))) return fail("This check has already run.", 429);
    const result = await runPageSpeed(input.website);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return handleError(err);
  }
}
