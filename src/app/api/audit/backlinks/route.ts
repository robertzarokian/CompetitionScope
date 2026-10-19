import { NextResponse } from "next/server";
import { backlinksRequestSchema } from "@/lib/audit/schema";
import { backlinksEnabled, cleanDomain, fetchBacklinks } from "@/lib/audit/backlinks";
import { getAuditSession } from "@/lib/audit/session";
import { fail, handleError, readBody } from "@/lib/audit/http";
import { getUserIdFromSession } from "@/lib/auth";
import { consume, enforceLimits } from "@/lib/rateLimit";

export const maxDuration = 60;

const DAILY_LIMIT = Number(process.env.AUDIT_DAILY_BACKLINK_LIMIT) || 100;

export async function POST(request: Request) {
  const body = await readBody(request, backlinksRequestSchema);
  if (body instanceof NextResponse) return body;
  if (!backlinksEnabled()) return fail("Backlink checks are not available.", 400);

  const userId = await getUserIdFromSession();
  if (!userId) return fail("Log in to run an audit.", 401);
  const input = await getAuditSession(body.auditId, userId);
  if (!input) return fail("This audit has expired. Please start a new one.", 404);

  // The customer's own website is always checked; competitors are optional.
  const own = cleanDomain(input.website);
  const rest = body.domains.map(cleanDomain).filter((d): d is string => !!d);
  const domains = Array.from(new Set([...(own ? [own] : []), ...rest])).slice(0, 6);
  if (domains.length === 0) return fail("No valid domains to check.", 400);

  try {
    // Each domain costs a few cents, so requests are limited per visitor and per day.
    await enforceLimits(request, "audit-backlinks", 10, DAILY_LIMIT);
    if (!(await consume("audit-backlinks-session", body.auditId, 1, 86400))) return fail("This check has already run.", 429);
    const results = await Promise.all(domains.map(fetchBacklinks));
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    return handleError(err);
  }
}
