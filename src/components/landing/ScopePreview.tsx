"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { Panel } from "@/components/decor/Panel";
import { SectionHeading } from "@/components/site/SectionHeading";

interface Scenario {
  id: string;
  label: string;
  rivals: { type: string; match: number; edge: string }[];
  insight: string;
}

// Illustrative archetypes, not real companies. Real reports name real rivals.
const SCENARIOS: Scenario[] = [
  {
    id: "software",
    label: "Software",
    rivals: [
      {
        type: "The category leader",
        match: 94,
        edge: "Free tier, deep integrations, and a big footprint of comparison pages.",
      },
      {
        type: "The fast-growing challenger",
        match: 88,
        edge: "Aggressive pricing and founder-led content on LinkedIn.",
      },
      {
        type: "The niche specialist",
        match: 79,
        edge: "Owns one customer segment completely and wins on focus.",
      },
    ],
    insight:
      "Buyers are building their shortlist from comparison and alternatives pages you have not published yet.",
  },
  {
    id: "ecommerce",
    label: "E-commerce",
    rivals: [
      {
        type: "The marketplace giant",
        match: 92,
        edge: "Free shipping thresholds and a huge base of customer reviews.",
      },
      {
        type: "The paid-social brand",
        match: 86,
        edge: "Fresh creative every week and influencer seeding at scale.",
      },
      {
        type: "The subscription specialist",
        match: 77,
        edge: "Bundles that turn one purchase into repeat orders.",
      },
    ],
    insight:
      "Your closest rivals win repeat purchases with bundles and subscriptions while you compete on one-off price.",
  },
  {
    id: "agency",
    label: "Agency",
    rivals: [
      {
        type: "The established name",
        match: 93,
        edge: "Case studies in your niche and referrals from past clients.",
      },
      {
        type: "The productized offer",
        match: 85,
        edge: "Fixed-scope packages with public pricing that remove buyer friction.",
      },
      {
        type: "The solo expert",
        match: 76,
        edge: "A personal brand that brings in warm inbound leads every week.",
      },
    ],
    insight:
      "Competitors publish prices and packages, so prospects arrive already comparing you on terms you hide.",
  },
  {
    id: "hardware",
    label: "Hardware",
    rivals: [
      {
        type: "The incumbent brand",
        match: 95,
        edge: "Retail distribution and an installed base that buyers trust.",
      },
      {
        type: "The direct-to-consumer disruptor",
        match: 87,
        edge: "Lower prices, faster iteration, and strong video reviews.",
      },
      {
        type: "The pro-grade specialist",
        match: 78,
        edge: "Wins technical buyers with spec sheets and expert endorsements.",
      },
    ],
    insight:
      "Late-stage losses trace back to rivals who shorten the buying decision with financing and proof, not features.",
  },
];

export function ScopePreview() {
  const [activeId, setActiveId] = useState(SCENARIOS[0].id);
  const scenario = SCENARIOS.find((s) => s.id === activeId) ?? SCENARIOS[0];

  return (
    <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
      <div>
        <SectionHeading
          label="Try it"
          title="See what a scope looks like for your kind of business"
          body="Pick an industry to preview the kind of findings you get: who your closest rivals are, how closely they match you, and what they are doing right."
        />
        <div
          role="group"
          aria-label="Choose an industry"
          className="mt-6 flex flex-wrap gap-2"
        >
          {SCENARIOS.map((s) => {
            const active = s.id === activeId;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveId(s.id)}
                className={`border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500/60 ${
                  active
                    ? "border-navy-800 bg-navy-800 text-cream-50"
                    : "border-navy-600 bg-cream-50 text-navy-700 hover:border-brass-500"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <div className="mt-7">
          <ButtonLink href="/onboarding/1" size="lg">
            Run it on your business
            <ArrowRight size={16} />
          </ButtonLink>
        </div>
      </div>

      <Panel eyebrow="Example scope" meta="Illustrative">
        <div className="p-6">
          <div className="space-y-5">
            {scenario.rivals.map((r, i) => (
              <div key={`${scenario.id}-${i}`}>
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-display text-base font-semibold text-navy-800">
                    {r.type}
                  </p>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-brass-600">
                    {r.match}% match
                  </p>
                </div>
                <div className="mt-2 h-1.5 w-full bg-navy-100">
                  <motion.div
                    className="h-full bg-brass-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${r.match}%` }}
                    transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                  />
                </div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-navy-500">{r.edge}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-navy-600 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">
              What we would flag first
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-navy-800" aria-live="polite">
              {scenario.insight}
            </p>
          </div>

          <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-navy-400">
            Illustrative example. Your report names real companies, researched live.
          </p>
        </div>
      </Panel>
    </div>
  );
}
