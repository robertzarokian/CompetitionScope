import { getPlan, getProfile } from "../account";
import { analyze } from "../audit/analysis";
import { backlinksEnabled, fetchBacklinks } from "../audit/backlinks";
import { cleanDomain } from "../audit/match";
import { runPageSpeed } from "../audit/pagespeed";
import { enabledProviders } from "../audit/providers";
import type { VisibilityRun } from "../audit/schema";
import { runSiteAudit } from "../audit/site";
import { runVisibility } from "../audit/visibility";
import { generateReport } from "../anthropic";
import { updateDb } from "../db";
import { alertDigest, sendEmail } from "../email";
import { consume } from "../rateLimit";
import { SITE_URL } from "../site";
import { pool } from "../tables";
import { diffSummaries, syncTodo } from "./diff";
import {
  claimDueWatches,
  claimNextRun,
  createAlert,
  createRun,
  failStaleRuns,
  finishRun,
  getWatchById,
  listRuns,
  releaseRun,
  rescheduleWatch,
  runningRunFor,
  saveRunProgress,
  saveTodo,
  setWatchActive,
} from "./store";
import type { RunSummary, Task, Watch, WatchRun } from "./types";

const CONCURRENCY = 6;
// One AI check can take close to this long, so no new batch starts when less time than this is left.
const BATCH_ALLOWANCE_MS = 95_000;
const DAILY_CALL_LIMIT = Number(process.env.MONITOR_DAILY_CALL_LIMIT) || 1500;

export function buildTasks(watch: Watch, questionLimit: number, websiteMonitoring: boolean): Task[] {
  const providers = enabledProviders();
  const questions = watch.input.questions.slice(0, Math.max(questionLimit, 1));
  // Large question lists get one answer each, to keep the cost of a check in bounds.
  const runsPer = questions.length * providers.length > 20 ? 1 : 2;
  const tasks: Task[] = [];
  for (const p of providers) {
    for (const question of questions) {
      for (let run = 1; run <= runsPer; run++) tasks.push({ type: "visibility", provider: p.id, question, run });
    }
  }
  if (websiteMonitoring) tasks.push({ type: "site" }, { type: "speed" });
  if (watch.reportId) tasks.push({ type: "refresh" });
  return tasks;
}

// Begins a check for one watch, unless its owner no longer has a plan that
// includes monitoring (the watch is paused instead) or a check is already running.
export async function startRunForWatch(watch: Watch): Promise<WatchRun | null> {
  const plan = await getPlan(watch.userId);
  if (!plan.limits.checkEveryDays) {
    await setWatchActive(watch.id, false);
    return null;
  }
  if (await runningRunFor(watch.id)) return null;
  const tasks = buildTasks(watch, plan.limits.questions, plan.limits.websiteMonitoring);
  if (tasks.length === 0) return null;
  // Schedule the next check from now, so a new or manually started check does
  // not leave the watch looking due again straight away.
  await rescheduleWatch(watch.id, plan.limits.checkEveryDays);
  return createRun(watch, tasks);
}

export async function startDueRuns(): Promise<number> {
  await failStaleRuns();
  const due = await claimDueWatches(async (userId) => (await getPlan(userId)).limits.checkEveryDays || 30);
  let started = 0;
  for (const w of due) {
    if (await startRunForWatch(w)) started++;
  }
  return started;
}

const trimRun = (r: VisibilityRun): VisibilityRun => ({ ...r, text: r.text.slice(0, 1200) });

async function executeTask(run: WatchRun, watch: Watch, task: Task): Promise<void> {
  if (task.type === "visibility") {
    const within = await consume("monitor-calls", "all", DAILY_CALL_LIMIT, 86400);
    let result: VisibilityRun;
    try {
      if (!within) throw new Error("The daily check capacity was reached.");
      result = await runVisibility(task.provider, task.question, task.run, watch.input);
    } catch (err) {
      result = {
        provider: task.provider,
        providerLabel: task.provider,
        question: task.question,
        run: task.run,
        ok: false,
        error: err instanceof Error ? err.message : "The check failed.",
        text: "",
        sources: [],
        brands: [],
      };
    }
    run.runs.push(trimRun(result));
  } else if (task.type === "site") {
    try {
      run.site = await runSiteAudit({
        website: watch.input.website,
        services: watch.input.services,
        questions: watch.input.questions,
        scope: watch.input.scope,
        city: watch.input.city,
      });
    } catch (err) {
      console.error("[monitor] site check failed:", err);
    }
  } else if (task.type === "speed") {
    try {
      run.speed = await runPageSpeed(watch.input.website);
    } catch (err) {
      console.error("[monitor] speed check failed:", err);
    }
  } else if (task.type === "refresh" && watch.reportId) {
    try {
      const { readDb } = await import("../db");
      const base = (await readDb()).reports.find((r) => r.id === watch.reportId);
      if (!base) return;
      const report = await generateReport(base.answers, watch.userId);
      // generateReport quietly falls back to a made-up sample when the AI call
      // fails. Never save that as a customer's refreshed report.
      if (report.source !== "ai") return;
      await updateDb((db) => {
        db.reports.push(report);
      });
      run.refresh = { reportId: report.id, competitors: report.competitors.map((c) => c.name) };
    } catch (err) {
      console.error("[monitor] report refresh failed:", err);
    }
  }
}

async function userEmail(userId: string): Promise<string | null> {
  const res = await pool().query<{ email: string }>("SELECT email FROM users WHERE id = $1", [userId]);
  return res.rows[0]?.email ?? null;
}

export function summarize(run: WatchRun, watch: Watch): RunSummary {
  const clientDomain = cleanDomain(watch.input.website);
  const analysis = analyze(run.runs, { companyName: watch.input.companyName, clientDomain });
  return {
    answers: analysis.answers,
    failed: analysis.failed,
    clientMentions: analysis.client.mentions,
    mentionRate: analysis.answers > 0 ? analysis.client.mentions / analysis.answers : null,
    avgPosition: analysis.client.avgPosition,
    topBrands: analysis.topBrands.filter((b) => !b.isClient).slice(0, 5).map((b) => ({ name: b.name, mentions: b.mentions })),
    checks: run.site ? run.site.checks.map((c) => ({ n: c.n, title: c.title, status: c.status })) : null,
    speedScore: run.speed?.available ? run.speed.performance : null,
    backlinks: run.backlinks
      ? run.backlinks.filter((b) => b.ok).map((b) => ({ domain: b.domain, rank: b.rank, referringDomains: b.referringMainDomains ?? b.referringDomains }))
      : null,
    refreshCompetitors: run.refresh ? run.refresh.competitors : null,
  };
}

async function finalize(run: WatchRun): Promise<void> {
  const watch = await getWatchById(run.watchId);
  if (!watch) return void (await finishRun(run, "failed"));
  const plan = await getPlan(watch.userId);

  // Backlinks for the customer and the companies AI recommended most.
  if (plan.limits.websiteMonitoring && backlinksEnabled()) {
    const clientDomain = cleanDomain(watch.input.website);
    const analysis = analyze(run.runs, { companyName: watch.input.companyName, clientDomain });
    const domains = Array.from(
      new Set([clientDomain, ...analysis.topBrands.filter((b) => !b.isClient).slice(0, 5).map((b) => b.domain)].filter((d): d is string => !!d))
    ).slice(0, 6);
    if (domains.length) run.backlinks = await Promise.all(domains.map(fetchBacklinks));
  }

  const summary = summarize(run, watch);
  run.summary = summary;
  const usable = summary.answers > 0 || summary.checks !== null || summary.refreshCompetitors !== null;
  if (!usable) return void (await finishRun(run, "failed"));

  const previous = (await listRuns(watch.id, watch.userId, 5)).find((r) => r.id !== run.id && r.status === "done" && r.summary);
  const drafts = diffSummaries(previous?.summary ?? null, summary, watch.name);

  const analysis = analyze(run.runs, { companyName: watch.input.companyName, clientDomain: cleanDomain(watch.input.website) });
  await saveTodo(watch.id, syncTodo(watch.todo, analysis.advice, summary.checks));
  await finishRun(run, "done");

  for (const d of drafts) {
    await createAlert({ userId: watch.userId, watchId: watch.id, kind: d.kind, title: d.title, body: d.body });
  }

  const toEmail = drafts.filter((d) => d.kind !== "baseline");
  if (toEmail.length && plan.limits.emailAlerts) {
    const profile = await getProfile(watch.userId);
    const to = profile.emailAlerts ? await userEmail(watch.userId) : null;
    if (to) {
      const mail = alertDigest(watch.name, toEmail, `${SITE_URL}/dashboard/watch/${watch.id}`);
      await sendEmail({ to, ...mail });
    }
  }
}

// Works through one claimed run until it finishes or time runs short. Progress
// is saved after every batch, so another worker can pick up where this one stopped.
async function processOne(run: WatchRun, deadline: number): Promise<void> {
  const watch = await getWatchById(run.watchId);
  if (!watch) return void (await finishRun(run, "failed"));
  try {
    while (run.pending.length > 0 && Date.now() < deadline - BATCH_ALLOWANCE_MS) {
      const batch = run.pending.splice(0, CONCURRENCY);
      await Promise.all(batch.map((t) => executeTask(run, watch, t)));
      await saveRunProgress(run);
    }
    if (run.pending.length === 0) await finalize(run);
  } finally {
    await releaseRun(run.id);
  }
}

// Processes unfinished runs for up to "budgetMs". Pass an owner to limit it to
// one customer's runs (used when a customer starts a check themselves).
export async function processRuns(budgetMs: number, ownerUserId?: string): Promise<void> {
  const deadline = Date.now() + budgetMs;
  while (Date.now() < deadline - BATCH_ALLOWANCE_MS) {
    const run = await claimNextRun(ownerUserId);
    if (!run) return;
    await processOne(run, deadline);
  }
}
