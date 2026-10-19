import { NextResponse } from "next/server";
import { auditInputSchema } from "@/lib/audit/schema";
import { enabledProviders } from "@/lib/audit/providers";
import { auditQuestionLimit, createAuditSession, RUNS_PER_QUESTION } from "@/lib/audit/session";
import { fail, handleError, readBody } from "@/lib/audit/http";
import { getCurrentUser } from "@/lib/auth";
import { getPlan } from "@/lib/account";
import { consume, enforceLimits } from "@/lib/rateLimit";

// Starts an audit. This is where the plan is checked: the audit is part of the
// paid plans, which get a fair daily number.
export async function POST(request: Request) {
  const body = await readBody(request, auditInputSchema);
  if (body instanceof NextResponse) return body;

  const user = await getCurrentUser();
  if (!user) return fail("Log in and choose a plan to run the AI visibility audit.", 401);

  try {
    const plan = await getPlan(user.id);
    if (plan.id === "free") return fail("The AI visibility audit is included with paid plans.", 403);
    if (body.questions.length > auditQuestionLimit(plan)) {
      return fail(`Your ${plan.name} plan allows ${auditQuestionLimit(plan)} questions per audit.`, 403);
    }
    await enforceLimits(request, "audit-start", 20);

    const providers = enabledProviders();
    if (providers.length === 0) return fail("No AI platforms are connected right now.", 503);

    if (!(await consume("audit-start-user", user.id, 10, 86400))) {
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
