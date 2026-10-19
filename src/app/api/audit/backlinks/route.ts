import { NextResponse } from "next/server";
import { backlinksRequestSchema } from "@/lib/audit/schema";
import { backlinksEnabled, cleanDomain, fetchBacklinks } from "@/lib/audit/backlinks";
import { fail, handleError, readBody } from "@/lib/audit/http";
import { enforceLimits } from "@/lib/rateLimit";

export const maxDuration = 60;

const DAILY_LIMIT = Number(process.env.AUDIT_DAILY_BACKLINK_LIMIT) || 100;

export async function POST(request: Request) {
  const body = await readBody(request, backlinksRequestSchema);
  if (body instanceof NextResponse) return body;
  if (!backlinksEnabled()) return fail("Backlink checks are not available.", 400);

  const domains = Array.from(new Set(body.domains.map(cleanDomain).filter((d): d is string => !!d)));
  if (domains.length === 0) return fail("No valid domains to check.", 400);

  try {
    // Each domain costs a few cents, so requests are limited per visitor and per day.
    await enforceLimits(request, "audit-backlinks", 10, DAILY_LIMIT);
    const results = await Promise.all(domains.map(fetchBacklinks));
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    return handleError(err);
  }
}
