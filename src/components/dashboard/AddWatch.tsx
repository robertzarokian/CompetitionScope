"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuditForm } from "@/components/audit/AuditForm";
import type { AuditInput } from "@/lib/audit/schema";

export function AddWatch({
  maxQuestions,
  maxCompetitors,
  reports,
  defaultReportId,
}: {
  maxQuestions: number;
  maxCompetitors: number;
  reports: { id: string; name: string }[];
  defaultReportId: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportId, setReportId] = useState(defaultReportId ?? "");

  async function submit(input: AuditInput) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/watches", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input, reportId: reportId || null }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setBusy(false);
      return;
    }
    router.push(`/dashboard/watch/${data.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && <p className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p>}
      <AuditForm
        providerCount={1}
        runsPerQuestion={2}
        disabled={busy}
        onSubmit={(v) => void submit(v)}
        maxQuestions={maxQuestions}
        maxCompetitors={maxCompetitors}
        submitLabel={busy ? "Starting" : "Start tracking"}
        eyebrow="Track a company"
        note="The first check starts right away and takes a few minutes. After that it repeats automatically."
      >
        {reports.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-navy-800" htmlFor="report">
              Refresh a competitor report too (optional)
            </label>
            <select
              id="report"
              value={reportId}
              onChange={(e) => setReportId(e.target.value)}
              className="mt-1.5 w-full border border-navy-600 bg-cream-50 px-3.5 py-2.5 text-sm text-navy-800"
            >
              <option value="">No report</option>
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </AuditForm>
    </div>
  );
}
