"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Minus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/Button";
import { ButtonLink } from "@/components/ButtonLink";
import { Panel } from "@/components/decor/Panel";
import { AuditForm } from "./AuditForm";
import { SiteChecksPanel } from "./SiteChecksPanel";
import { VisibilityPanel } from "./VisibilityPanel";
import { BacklinksPanel } from "./BacklinksPanel";
import { AdLibraryPanel } from "./AdLibraryPanel";
import { analyze } from "@/lib/audit/analysis";
import { cleanDomain } from "@/lib/audit/match";
import { speedCheckRow } from "@/lib/audit/pagespeed-row";
import type { AuditInput, BacklinkRow, SiteAuditResult, SpeedResult, VisibilityRun } from "@/lib/audit/schema";

const RUNS_PER_QUESTION = 2;
const DRAFT_KEY = "cs_audit_draft";
const CONCURRENCY = 3;

interface Config {
  providers: { id: string; label: string }[];
  backlinks: boolean;
}

type Step = "idle" | "running" | "done" | "error" | "skipped";

async function post<T>(url: string, body: unknown): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(110_000),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) return { ok: false, error: json?.error ?? "Something went wrong. Please try again." };
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, error: "The check could not be completed. Check your connection and try again." };
  }
}

async function runPool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const item = items[next++];
        await worker(item);
      }
    })
  );
}

function StepIcon({ step }: { step: Step }) {
  if (step === "running") return <Loader2 size={16} className="animate-spin text-brass-500" aria-label="Running" />;
  if (step === "done") return <Check size={16} className="text-emerald-700" aria-label="Done" />;
  if (step === "error") return <X size={16} className="text-red-700" aria-label="Failed" />;
  return <Minus size={16} className="text-navy-300" aria-label={step === "skipped" ? "Not available" : "Waiting"} />;
}

export function AuditTool() {
  const [config, setConfig] = useState<Config | null>(null);
  const [configError, setConfigError] = useState(false);
  // null while loading; "none" when logged out; otherwise the plan id.
  const [plan, setPlan] = useState<string | null>(null);
  const [locked, setLocked] = useState<AuditInput | null>(null);
  const [draft, setDraft] = useState<AuditInput | undefined>(undefined);
  const [startError, setStartError] = useState<string | null>(null);
  const [input, setInput] = useState<AuditInput | null>(null);
  const [started, setStarted] = useState(false);

  const [siteStep, setSiteStep] = useState<Step>("idle");
  const [site, setSite] = useState<SiteAuditResult | null>(null);
  const [siteError, setSiteError] = useState<string | null>(null);
  const [speedStep, setSpeedStep] = useState<Step>("idle");
  const [speed, setSpeed] = useState<SpeedResult | null>(null);
  const [runs, setRuns] = useState<VisibilityRun[]>([]);
  const [totalRuns, setTotalRuns] = useState(0);
  const [visStep, setVisStep] = useState<Step>("idle");
  const [backStep, setBackStep] = useState<Step>("idle");
  const [backlinks, setBacklinks] = useState<BacklinkRow[]>([]);

  useEffect(() => {
    fetch("/api/audit/config")
      .then((r) => r.json())
      .then((c: Config) => setConfig(c))
      .catch(() => setConfigError(true));
    fetch("/api/auth/me?plan=1")
      .then((r) => r.json())
      .then((d: { user: unknown; plan?: string }) => {
        setPlan(d.user ? (d.plan ?? "free") : "none");
        // Details typed before choosing a plan are restored once they come back.
        try {
          const saved = sessionStorage.getItem(DRAFT_KEY);
          if (saved) setDraft(JSON.parse(saved) as AuditInput);
        } catch {
          /* storage may be unavailable */
        }
      })
      .catch(() => setPlan("none"));
  }, []);

  const clientDomain = input ? cleanDomain(input.website) : null;
  const analysis = useMemo(
    () => (input && visStep === "done" ? analyze(runs, { companyName: input.companyName, clientDomain }) : null),
    [runs, input, visStep, clientDomain]
  );

  function reset() {
    setStartError(null);
    setInput(null);
    setStarted(false);
    setSiteStep("idle");
    setSite(null);
    setSiteError(null);
    setSpeedStep("idle");
    setSpeed(null);
    setRuns([]);
    setTotalRuns(0);
    setVisStep("idle");
    setBackStep("idle");
    setBacklinks([]);
  }

  async function start(values: AuditInput) {
    if (!config) return;
    reset();

    // Free and logged-out visitors can fill in their details, but the audit
    // itself is part of the paid plans. Keep what they typed for later.
    if (plan !== "none" && plan !== "free" && plan !== null) {
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
    } else {
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values));
      } catch {
        /* ignore */
      }
      setLocked(values);
      return;
    }

    // The server checks the plan and opens an audit session before anything runs.
    const begun = await post<{ auditId: string; providers: { id: string; label: string }[] }>("/api/audit/start", values);
    if (!begun.ok) {
      setStartError(begun.error);
      return;
    }
    const { auditId, providers } = begun.data;
    setInput(values);
    setStarted(true);

    // 1. Website checks and the speed test run alongside everything else.
    setSiteStep("running");
    setSpeedStep("running");
    const sitePromise = post<{ result: SiteAuditResult }>("/api/audit/site", { auditId }).then((r) => {
      if (r.ok) {
        setSite(r.data.result);
        setSiteStep("done");
      } else {
        setSiteError(r.error);
        setSiteStep("error");
      }
    });
    const speedPromise = post<{ result: SpeedResult }>("/api/audit/speed", { auditId }).then((r) => {
      if (r.ok) {
        setSpeed(r.data.result);
        setSpeedStep("done");
      } else {
        setSpeedStep("error");
      }
    });

    // 2. Ask each AI platform each question a few times.
    const tasks = providers.flatMap((p) =>
      values.questions.flatMap((question, questionIndex) =>
        Array.from({ length: RUNS_PER_QUESTION }, (_, i) => ({ provider: p, question, questionIndex, run: i + 1 }))
      )
    );
    setTotalRuns(tasks.length);
    setVisStep("running");
    const collected: VisibilityRun[] = [];
    await runPool(tasks, CONCURRENCY, async (t) => {
      const r = await post<{ run: VisibilityRun }>("/api/audit/visibility", {
        auditId,
        provider: t.provider.id,
        questionIndex: t.questionIndex,
        run: t.run,
      });
      const run: VisibilityRun = r.ok
        ? r.data.run
        : {
            provider: t.provider.id,
            providerLabel: t.provider.label,
            question: t.question,
            run: t.run,
            ok: false,
            error: r.error,
            text: "",
            sources: [],
            brands: [],
          };
      collected.push(run);
      setRuns((prev) => [...prev, run]);
    });
    setVisStep("done");

    // 3. Backlinks for you and the companies AI recommended most.
    if (config.backlinks) {
      const final = analyze(collected, { companyName: values.companyName, clientDomain: cleanDomain(values.website) });
      const domains = Array.from(
        new Set(final.topBrands.filter((b) => !b.isClient).slice(0, 5).map((b) => b.domain).filter((d): d is string => !!d))
      );
      setBackStep("running");
      const b = await post<{ results: BacklinkRow[] }>("/api/audit/backlinks", { auditId, domains });
      if (b.ok) {
        setBacklinks(b.data.results);
        setBackStep("done");
      } else {
        setBackStep("error");
      }
    } else {
      setBackStep("skipped");
    }

    await Promise.all([sitePromise, speedPromise]);
  }

  if (configError) {
    return (
      <Panel>
        <p className="p-6 text-sm text-navy-500">The audit tool is temporarily unavailable. Please try again in a few minutes.</p>
      </Panel>
    );
  }
  if (!config) {
    return (
      <Panel>
        <p className="flex items-center gap-2 p-6 text-sm text-navy-500">
          <Loader2 size={16} className="animate-spin" /> Loading the audit tool
        </p>
      </Panel>
    );
  }
  if (config.providers.length === 0) {
    return (
      <Panel>
        <p className="p-6 text-sm text-navy-500">No AI platforms are connected right now. Please check back soon.</p>
      </Panel>
    );
  }

  if (plan === null) {
    return (
      <Panel>
        <p className="flex items-center gap-2 p-6 text-sm text-navy-500">
          <Loader2 size={16} className="animate-spin" /> Loading the audit tool
        </p>
      </Panel>
    );
  }

  if (locked) {
    const n = locked.questions.length;
    return (
      <Panel eyebrow="AI visibility audit" meta={locked.companyName}>
        <div className="space-y-5 p-6">
          <p className="font-display text-xl font-semibold text-navy-800">Your audit for {locked.companyName} is ready to run</p>
          <p className="text-sm leading-relaxed text-navy-500">
            We will ask {config.providers.map((p) => p.label).join(" and ")} {n === 1 ? "your question" : `your ${n} questions`}, show who
            gets recommended instead of you and which websites those answers rely on, then check your website against 12 points
            and compare your backlinks with your competitors.
          </p>
          <ul className="space-y-1.5 text-sm text-navy-600">
            {["Who AI recommends for your questions", "The sources behind each recommendation", "Your 12 point website check", "Backlinks versus your competitors"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check size={15} className="text-brass-500" />
                {t}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <ButtonLink href="/pricing" size="lg">
              Reveal AI visibility audit
            </ButtonLink>
            <button
              type="button"
              onClick={() => setLocked(null)}
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-navy-500 underline-offset-4 hover:underline"
            >
              Edit my details
            </button>
          </div>
          <p className="text-xs text-navy-400">
            Included with every paid plan. Your details are saved on this device, so you can run it as soon as you subscribe.
            {plan === "none" && (
              <>
                {" "}
                Already subscribed?{" "}
                <Link href={`/auth?next=${encodeURIComponent("/ai-seo/audit")}`} className="underline underline-offset-2">
                  Log in
                </Link>
                .
              </>
            )}
          </p>
        </div>
      </Panel>
    );
  }

  const running = started && (siteStep === "running" || speedStep === "running" || visStep === "running" || backStep === "running");
  const finished = started && !running;
  const checks = site ? [...site.checks, ...(speed ? [speedCheckRow(speed)] : [])] : [];
  const done = runs.length;
  const visErrors = runs.filter((r) => !r.ok && r.error).map((r) => `${r.providerLabel}: ${r.error}`);
  const leaders = analysis ? analysis.topBrands.filter((b) => !b.isClient).slice(0, 5) : [];

  return (
    <div className="space-y-8">
      {!started && (
        <>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy-400">
            AI platforms checked: {config.providers.map((p) => p.label).join(", ")}
          </p>
          {startError && (
            <div className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
              {startError}{" "}
              <Link href="/pricing" className="font-medium underline underline-offset-2">
                See plans
              </Link>
            </div>
          )}
          <AuditForm
            key={draft ? "draft" : "new"}
            initial={draft}
            providerCount={config.providers.length}
            runsPerQuestion={RUNS_PER_QUESTION}
            disabled={false}
            submitLabel={plan === "none" || plan === "free" ? "Continue" : "Run my audit"}
            onSubmit={(v) => void start(v)}
          />
        </>
      )}

      {started && input && (
        <>
          <Panel eyebrow="Audit" meta={input.companyName}>
            <ul className="divide-y divide-navy-300/60">
              <li className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span className="text-navy-800">Website checks</span>
                <StepIcon step={siteStep} />
              </li>
              <li className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span className="text-navy-800">Speed test</span>
                <StepIcon step={speedStep} />
              </li>
              <li className="px-5 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-navy-800">
                    Asking AI platforms ({done} of {totalRuns})
                  </span>
                  <StepIcon step={visStep} />
                </div>
                <div className="mt-2 h-1.5 w-full bg-navy-100">
                  <div
                    className="h-full bg-brass-400 transition-all duration-500"
                    style={{ width: `${totalRuns ? Math.round((done / totalRuns) * 100) : 0}%` }}
                  />
                </div>
              </li>
              <li className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span className="text-navy-800">Backlinks</span>
                <StepIcon step={backStep} />
              </li>
            </ul>
            {running && (
              <p className="border-t border-navy-300/60 px-5 py-3 font-mono text-[11px] uppercase tracking-wide text-brass-600">
                Working. Please keep this tab open.
              </p>
            )}
          </Panel>

          {siteError && <p className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">{siteError}</p>}
          {site && <SiteChecksPanel checks={checks} note={site.note} />}

          {visStep === "done" && analysis && analysis.answers === 0 && (
            <p className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
              No AI answers could be read. {Array.from(new Set(visErrors))[0] ?? "Please try again."}
            </p>
          )}
          {analysis && analysis.answers > 0 && (
            <VisibilityPanel analysis={analysis} errors={visErrors} runsPerQuestion={RUNS_PER_QUESTION} />
          )}

          {backStep === "done" && backlinks.length > 0 && <BacklinksPanel rows={backlinks} clientDomain={clientDomain} />}
          {backStep === "skipped" && finished && (
            <p className="text-xs text-navy-400">Backlink data is not switched on for this tool yet.</p>
          )}

          {finished && analysis && (
            <AdLibraryPanel
              companies={[{ name: input.companyName, domain: clientDomain }, ...leaders.map((b) => ({ name: b.name, domain: b.domain }))]}
            />
          )}

          {finished && (
            <div>
              <Button variant="secondary" onClick={reset}>
                <RotateCcw size={14} />
                Run another audit
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
