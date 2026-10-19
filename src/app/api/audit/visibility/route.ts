import { NextResponse } from "next/server";
import { visibilityRequestSchema } from "@/lib/audit/schema";
import { runVisibility } from "@/lib/audit/visibility";
import { getProvider } from "@/lib/audit/providers";
import { ProviderError } from "@/lib/audit/providers/types";
import { getAuditSession, consumeAuditCall } from "@/lib/audit/session";
import { fail, handleError, readBody } from "@/lib/audit/http";
import { getUserIdFromSession } from "@/lib/auth";
import { enforceLimits } from "@/lib/rateLimit";

// One AI platform answering one question once, plus reading the answer.
export const maxDuration = 90;

const DAILY_LIMIT = Number(process.env.AUDIT_DAILY_VISIBILITY_LIMIT) || 400;

export async function POST(request: Request) {
  const body = await readBody(request, visibilityRequestSchema);
  if (body instanceof NextResponse) return body;

  const userId = await getUserIdFromSession();
  if (!userId) return fail("Log in to run an audit.", 401);
  const input = await getAuditSession(body.auditId, userId);
  if (!input) return fail("This audit has expired. Please start a new one.", 404);

  const question = input.questions[body.questionIndex];
  if (!question) return fail("That question is not part of this audit.", 400);
  const provider = getProvider(body.provider);
  if (!provider || !provider.enabled()) return fail("That AI platform is not available.", 400);

  try {
    // Every call here spends money on a paid API. It is counted against the
    // audit's own allowance, per visitor, and across the whole site per day.
    await enforceLimits(request, "audit-visibility", 90, DAILY_LIMIT);
    if (!(await consumeAuditCall(body.auditId, userId))) return fail("This audit has used all of its checks.", 429);
    // Answer with a clear message before the platform's own limit would cut us off.
    const run = await Promise.race([
      runVisibility(body.provider, question, body.run, input),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new ProviderError(`${provider.label} took too long to answer.`)), 80_000)
      ),
    ]);
    return NextResponse.json({ ok: true, run });
  } catch (err) {
    return handleError(err);
  }
}
