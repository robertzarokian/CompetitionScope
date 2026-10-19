import { after, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getPlan } from "@/lib/account";
import { readDb } from "@/lib/db";
import { auditInputSchema } from "@/lib/audit/schema";
import { runCycle } from "@/lib/monitor/cycle";
import { startRunForWatch } from "@/lib/monitor/engine";
import { createWatch, listWatches } from "@/lib/monitor/store";

export const maxDuration = 300;

const bodySchema = z.object({
  input: auditInputSchema,
  reportId: z.string().max(80).nullable().optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Log in first." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }
  const { input, reportId } = parsed.data;

  const plan = await getPlan(user.id);
  const limits = plan.limits;
  if (limits.clients === 0) {
    return NextResponse.json({ error: "Tracking needs a paid plan. See the pricing page." }, { status: 403 });
  }
  const existing = await listWatches(user.id);
  if (existing.length >= limits.clients) {
    return NextResponse.json(
      { error: `Your ${plan.name} plan tracks ${limits.clients} ${limits.clients === 1 ? "company" : "companies"}. Remove one or upgrade.` },
      { status: 403 }
    );
  }
  const usedQuestions = existing.reduce((n, w) => n + w.input.questions.length, 0);
  if (usedQuestions + input.questions.length > limits.questions) {
    return NextResponse.json(
      { error: `Your ${plan.name} plan tracks ${limits.questions} questions in total, and ${usedQuestions} are already in use.` },
      { status: 403 }
    );
  }
  if (input.competitors.length > limits.competitors) {
    return NextResponse.json(
      { error: `Your ${plan.name} plan tracks up to ${limits.competitors} competitors per company.` },
      { status: 403 }
    );
  }

  // A report can be linked so its competitor list is refreshed on every check,
  // but only the person it belongs to can link it.
  let linkedReport: string | null = null;
  if (reportId) {
    const report = (await readDb()).reports.find((r) => r.id === reportId);
    const mine = report && (report.ownerUserId === user.id || report.answers.email.toLowerCase() === user.email.toLowerCase());
    if (!mine) return NextResponse.json({ error: "That report was not found." }, { status: 404 });
    linkedReport = reportId;
  }

  const watch = await createWatch(user.id, input, linkedReport);
  await startRunForWatch(watch);
  const origin = new URL(request.url).origin;
  after(() => runCycle({ origin, depth: 0, startDue: false }));
  return NextResponse.json({ ok: true, id: watch.id });
}
