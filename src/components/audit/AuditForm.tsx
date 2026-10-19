"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/Button";
import { Panel } from "@/components/decor/Panel";
import { COUNTRIES } from "@/lib/audit/countries";
import { auditInputSchema, SCOPES, type AuditInput, type Scope } from "@/lib/audit/schema";

const SCOPE_LABELS: Record<Scope, { label: string; hint: string }> = {
  local: { label: "Local", hint: "A city or area" },
  national: { label: "National", hint: "One country" },
  worldwide: { label: "Worldwide", hint: "Anywhere" },
};

const inputClass =
  "w-full border border-navy-600 bg-cream-50 px-3.5 py-2.5 text-sm text-navy-800 placeholder:text-navy-300 focus:border-brass-500 focus:outline-none focus:ring-2 focus:ring-brass-500/30";

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-navy-800">{label}</label>
      {hint && <p className="mt-0.5 text-xs text-navy-400">{hint}</p>}
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}

export function AuditForm({
  providerCount,
  runsPerQuestion,
  disabled,
  onSubmit,
  maxQuestions = 3,
  maxCompetitors = 5,
  submitLabel = "Run my audit",
  eyebrow = "Audit details",
  note,
  children,
}: {
  providerCount: number;
  runsPerQuestion: number;
  disabled: boolean;
  onSubmit: (input: AuditInput) => void;
  maxQuestions?: number;
  maxCompetitors?: number;
  submitLabel?: string;
  eyebrow?: string;
  // Replaces the default "we will ask..." estimate under the form.
  note?: string;
  // Extra fields shown above the submit row (for example a report picker).
  children?: ReactNode;
}) {
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [services, setServices] = useState("");
  const [competitors, setCompetitors] = useState<string[]>(Array(maxCompetitors).fill(""));
  const [scope, setScope] = useState<Scope>("local");
  const [countryCode, setCountryCode] = useState("US");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  // A handful of questions get their own boxes; larger limits use one line per question.
  const lineMode = maxQuestions > 5;
  const [questions, setQuestions] = useState<string[]>(Array(lineMode ? 1 : maxQuestions).fill(""));
  const [questionLines, setQuestionLines] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const questionList = lineMode ? questionLines.split("\n") : questions;
  const filledQuestions = questionList.filter((q) => q.trim()).length;
  const checks = providerCount * Math.max(filledQuestions, 1) * runsPerQuestion;
  const minutes = Math.max(1, Math.ceil((checks / 3) * 0.5));

  function submit(e: FormEvent) {
    e.preventDefault();
    const candidate = {
      companyName,
      website,
      services,
      competitors: competitors.map((c) => c.trim()).filter(Boolean),
      scope,
      city: scope === "local" ? city : "",
      region: scope === "local" ? region : "",
      countryCode: scope === "worldwide" ? "" : countryCode,
      questions: questionList.map((q) => q.trim()).filter(Boolean),
    };
    if (candidate.questions.length > maxQuestions) {
      setErrors({ questions: `Your plan allows up to ${maxQuestions} questions.` });
      return;
    }
    const parsed = auditInputSchema.safeParse(candidate);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    onSubmit(parsed.data);
  }

  return (
    <Panel eyebrow={eyebrow} meta="Step 1 of 1">
      <form onSubmit={submit} className="space-y-6 p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Company name" error={errors.companyName}>
            <input className={inputClass} value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Buttonwood Property Management" maxLength={120} />
          </Field>
          <Field label="Website" error={errors.website}>
            <input className={inputClass} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourcompany.com" maxLength={300} />
          </Field>
        </div>

        <Field label="Your main services" hint="Separate with commas." error={errors.services}>
          <input className={inputClass} value={services} onChange={(e) => setServices(e.target.value)} placeholder="e.g. property management, rental management, condo management" maxLength={400} />
        </Field>

        <Field label="Your competitors" hint={`Up to ${maxCompetitors} company names. Optional, but it lets us show how you compare.`}>
          <div className="grid gap-2 sm:grid-cols-2">
            {competitors.map((c, i) => (
              <input
                key={i}
                className={inputClass}
                value={c}
                onChange={(e) => setCompetitors((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))}
                placeholder={`Competitor ${i + 1}`}
                maxLength={100}
                aria-label={`Competitor ${i + 1}`}
              />
            ))}
          </div>
        </Field>

        <div>
          <p className="text-sm font-medium text-navy-800">Where do you serve customers?</p>
          <div role="radiogroup" aria-label="Service area" className="mt-2 grid gap-2 sm:grid-cols-3">
            {SCOPES.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={scope === s}
                onClick={() => setScope(s)}
                className={`border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500/60 ${
                  scope === s ? "border-navy-800 bg-navy-800 text-cream-50" : "border-navy-600 bg-cream-50 text-navy-700 hover:border-brass-500"
                }`}
              >
                <span className="block font-display text-sm font-semibold">{SCOPE_LABELS[s].label}</span>
                <span className={`block text-xs ${scope === s ? "text-cream-300" : "text-navy-400"}`}>{SCOPE_LABELS[s].hint}</span>
              </button>
            ))}
          </div>
          {scope !== "worldwide" && (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field label="Country" error={errors.countryCode}>
                <select className={inputClass} value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              {scope === "local" && (
                <>
                  <Field label="City" error={errors.city}>
                    <input className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Toronto" maxLength={80} />
                  </Field>
                  <Field label="State or province" hint="Optional">
                    <input className={inputClass} value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. Ontario" maxLength={80} />
                  </Field>
                </>
              )}
            </div>
          )}
        </div>

        <Field
          label="Questions you want AI to recommend you for"
          hint={`Write them the way a customer would ask. Up to ${maxQuestions}${lineMode ? ", one per line" : ""}.`}
          error={errors.questions}
        >
          {lineMode ? (
            <textarea
              className={`${inputClass} min-h-[140px]`}
              value={questionLines}
              onChange={(e) => setQuestionLines(e.target.value)}
              placeholder={"Top property management companies in Toronto\nBest condo managers in Toronto"}
              aria-label="Questions, one per line"
            />
          ) : (
            <div className="space-y-2">
              {questions.map((q, i) => (
                <input
                  key={i}
                  className={inputClass}
                  value={q}
                  onChange={(e) => setQuestions((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))}
                  placeholder={i === 0 ? "e.g. Top property management companies in Toronto" : "Optional"}
                  maxLength={200}
                  aria-label={`Question ${i + 1}`}
                />
              ))}
            </div>
          )}
        </Field>

        {children}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-navy-600 pt-5">
          <p className="max-w-md text-xs leading-relaxed text-navy-400">
            {note ??
              `We will ask ${providerCount} AI platform${providerCount === 1 ? "" : "s"} your question${filledQuestions > 1 ? "s" : ""} ${runsPerQuestion} times each (${checks} checks), plus check your website. It takes about ${minutes} minute${minutes === 1 ? "" : "s"}. Keep this tab open.`}
          </p>
          <Button type="submit" size="lg" disabled={disabled}>
            {submitLabel}
            <ArrowRight size={16} />
          </Button>
        </div>
      </form>
    </Panel>
  );
}
