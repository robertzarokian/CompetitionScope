"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";

// An illustration, not live data. Made-up businesses show how an AI answer
// is broken into who gets named and which websites sit behind each name.
const DEMOS = [
  {
    question: "Top 5 solar companies in Los Angeles, California",
    rows: [
      { brand: "Example Solar Co", sources: ["Yelp reviews", "Local news feature", "Industry directory"] },
      { brand: "Sample Sun Energy", sources: ["Google reviews", "Trade association", "Own blog guides"] },
      { brand: "Demo Roofing and Solar", sources: ["Angi", "Own city pages", "Local news feature"] },
    ],
    summary: "Directory and review sites appear behind almost every name. Companies with their own city pages get named more often.",
  },
  {
    question: "Best accounting software for small business",
    rows: [
      { brand: "Sample Books", sources: ["Software review sites", "Comparison articles", "Own help center"] },
      { brand: "Example Ledger", sources: ["Review sites", "YouTube tutorials", "Reddit threads"] },
      { brand: "Demo Accounts", sources: ["Comparison articles", "Own pricing page", "Review sites"] },
    ],
    summary: "Comparison articles and review sites drive recommendations. Being listed and reviewed there matters more than your own page.",
  },
  {
    question: "Best family dentist in Austin, Texas",
    rows: [
      { brand: "Sample Family Dental", sources: ["Google reviews", "Healthgrades", "Own FAQ page"] },
      { brand: "Example Smiles", sources: ["Yelp reviews", "Local directory", "Own location page"] },
      { brand: "Demo Dental Group", sources: ["Healthgrades", "Google reviews", "Local news feature"] },
    ],
    summary: "Review volume and clear location pages decide who is named. FAQ content on the dentist's own site is quoted often.",
  },
];

export function AiAnswerDemo() {
  const [i, setI] = useState(0);
  const d = DEMOS[i];

  return (
    <div className="instrument-panel card-glow relative overflow-hidden p-5 sm:p-7">
      <div className="blueprint-grid absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="relative">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass-300">
          Example: pick a question customers ask AI
        </p>
        <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Example questions">
          {DEMOS.map((x, n) => (
            <button
              key={x.question}
              type="button"
              role="tab"
              aria-selected={n === i}
              onClick={() => setI(n)}
              className={`border px-3 py-1.5 text-left text-[12.5px] transition-colors ${
                n === i
                  ? "border-brass-400 bg-brass-400 text-navy-950"
                  : "border-cream-300/30 text-cream-200 hover:border-brass-300"
              }`}
            >
              {x.question}
            </button>
          ))}
        </div>

        <ol className="mt-5 space-y-3" aria-live="polite">
          {d.rows.map((r, n) => (
            <li key={r.brand} className="border border-cream-300/20 bg-navy-900/60 p-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center bg-brass-400 font-mono text-xs font-semibold text-navy-950">
                  {n + 1}
                </span>
                <span className="font-display text-base font-semibold text-cream-50">{r.brand}</span>
              </div>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-cream-300">Sources behind this name</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {r.sources.map((s) => (
                  <span key={s} className="border border-cream-300/25 px-2 py-0.5 text-[12px] text-cream-200">
                    {s}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-4 text-[13.5px] leading-relaxed text-cream-200">
          <span className="font-semibold text-brass-300">What it tells you:</span> {d.summary}
        </p>
        <p className="mt-2 text-[11px] text-cream-300">Illustration with made-up businesses. Your audit uses real answers.</p>

        <div className="mt-5">
          <ButtonLink href="/ai-seo/audit" size="md">
            Run this for your business
            <ArrowRight size={15} />
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
