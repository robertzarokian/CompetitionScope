import { NextResponse } from "next/server";
import { auditInputSchema } from "@/lib/audit/schema";
import { enabledProviders } from "@/lib/audit/providers";
import { auditQuestionLimit, createAuditSession, RUNS_PER_QUESTION } from "@/lib/audit/session";
import { fail, handleError, readBody } from "@/lib/audit/http";
import { getCurrentUser } from "@/lib/auth";
import { getPlan, getProfile } from "@/lib/account";
import { consume, enforceLimits } from "@/lib/rateLimit";
import { pool } from "@/lib/tables";

// Starts an audit. This is where the plan is checked: the free plan gets one
// audit per account, and paid plans a fair daily number.
export async function POST(request: Request) {
  const body = await readBody(request, auditInputSchema);
  if (body instanceof NextResponse) return body;

  const user = await getCurrentUser();
  if (!user) return fail("Create a free account to run an audit.", 401);

  try {
    const plan = await getPlan(user.id);
    if (body.questions.length > auditQuestionLimit(plan)) {
      return fail(`Your ${plan.name} plan allows ${auditQuestionLimit(plan)} questions per audit.`, 403);
    }
    await enforceLimits(request, "audit-start", 20);

    const providers = enabledProviders();
    if (providers.length === 0) return fail("No AI platforms are connected right now.", 503);

    if (plan.id === "free") {
      // One statement checks and claims the free audit, so two simultaneous
      // requests cannot both get it.
      await getProfile(user.id);
      const claimed = await pool().query(
        "UPDATE profiles SET free_audits_used = free_audits_used + 1 WHERE user_id = $1 AND free_audits_used < 1",
        [user.id]
      );
      if (claimed.rowCount !== 1) return fail("You have used your free audit. Choose a plan to run more.", 403);
    } else if (!(await consume("audit-start-user", user.id, 10, 86400))) {
      return fail("You have reached today's limit of audits. Please try again tomorrow.", 429);
    }

    const auditId = await createAuditSession(user.id, body, providers.length);
    return NextResponse.json({
      ok: true,
      auditId,
      runsPerQuestion: RUNS_PER_QUESTION,
      providers: providers.map((p) => ({ id: p.id, label: p.label })),
    });
  } catch (err) {
    return handleError(err);
  }
}
