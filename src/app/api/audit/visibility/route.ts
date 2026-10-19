import { NextResponse } from "next/server";
import { visibilityRequestSchema } from "@/lib/audit/schema";
import { runVisibility } from "@/lib/audit/visibility";
import { getProvider } from "@/lib/audit/providers";
import { ProviderError } from "@/lib/audit/providers/types";
import { fail, handleError, readBody } from "@/lib/audit/http";
import { enforceLimits } from "@/lib/rateLimit";

// One AI platform answering one question once, plus reading the answer.
export const maxDuration = 90;

const DAILY_LIMIT = Number(process.env.AUDIT_DAILY_VISIBILITY_LIMIT) || 400;

export async function POST(request: Request) {
  const body = await readBody(request, visibilityRequestSchema);
  if (body instanceof NextResponse) return body;

  const provider = getProvider(body.provider);
  if (!provider || !provider.enabled()) return fail("That AI platform is not available.", 400);

  try {
    // Every call here spends money on a paid API, so it is counted per
    // visitor and across the whole site per day.
    await enforceLimits(request, "audit-visibility", 90, DAILY_LIMIT);
    // Answer with a clear message before the platform's own limit would cut us off.
    const run = await Promise.race([
      runVisibility(body.provider, body.question, body.run, body),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new ProviderError(`${provider.label} took too long to answer.`)), 80_000)
      ),
    ]);
    return NextResponse.json({ ok: true, run });
  } catch (err) {
    return handleError(err);
  }
}
