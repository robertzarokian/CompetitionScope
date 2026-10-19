import { NextResponse } from "next/server";
import { siteRequestSchema } from "@/lib/audit/schema";
import { runSiteAudit } from "@/lib/audit/site";
import { handleError, readBody } from "@/lib/audit/http";
import { enforceLimits } from "@/lib/rateLimit";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await readBody(request, siteRequestSchema);
  if (body instanceof NextResponse) return body;
  try {
    await enforceLimits(request, "audit-site", 12);
    const result = await runSiteAudit(body);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return handleError(err);
  }
}
