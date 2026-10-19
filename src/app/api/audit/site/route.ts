import { NextResponse } from "next/server";
import { siteRequestSchema } from "@/lib/audit/schema";
import { runSiteAudit } from "@/lib/audit/site";
import { getAuditSession } from "@/lib/audit/session";
import { fail, handleError, readBody } from "@/lib/audit/http";
import { getUserIdFromSession } from "@/lib/auth";
import { consume, enforceLimits } from "@/lib/rateLimit";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await readBody(request, siteRequestSchema);
  if (body instanceof NextResponse) return body;
  const userId = await getUserIdFromSession();
  if (!userId) return fail("Log in to run an audit.", 401);
  const input = await getAuditSession(body.auditId, userId);
  if (!input) return fail("This audit has expired. Please start a new one.", 404);
  try {
    await enforceLimits(request, "audit-site", 30);
    // Once per audit, plus one retry.
    if (!(await consume("audit-site-session", body.auditId, 2, 86400))) return fail("This check has already run.", 429);
    const result = await runSiteAudit(input);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return handleError(err);
  }
}
