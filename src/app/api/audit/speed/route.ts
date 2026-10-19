import { NextResponse } from "next/server";
import { speedRequestSchema } from "@/lib/audit/schema";
import { runPageSpeed } from "@/lib/audit/pagespeed";
import { handleError, readBody } from "@/lib/audit/http";
import { enforceLimits } from "@/lib/rateLimit";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await readBody(request, speedRequestSchema);
  if (body instanceof NextResponse) return body;
  try {
    await enforceLimits(request, "audit-speed", 12);
    const result = await runPageSpeed(body.website);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return handleError(err);
  }
}
