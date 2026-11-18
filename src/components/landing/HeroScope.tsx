"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { CornerFrame } from "@/components/decor/CornerFrame";

interface Scenario {
  id: string;
  label: string;
  rivals: { name: string; match: number; wins: string }[];
  flag: string;
}

// Made-up rivals that show the kind of answer you get. A real report names real companies.
const SCENARIOS: Scenario[] = [
  {
    id: "local",
    label: "Local service",
    rivals: [
      { name: "The well-reviewed local favorite", match: 94, wins: "Hundreds of Google reviews and a page for every neighborhood" },
      { name: "The big franchise", match: 88, wins: "Heavy local ads and same-day booking" },
      { name: "The newcomer", match: 79, wins: "Low intro prices and a slick website" },
    ],
    flag: "Rivals with more reviews get the first call, even when you are better.",
  },
  {
    id: "restaurant",
    label: "Restaurant",
    rivals: [
      { name: "The neighborhood institution", match: 93, wins: "Loyal regulars and constant press mentions" },
      { name: "The delivery-first brand", match: 86, wins: "Top spots on delivery apps with strong photos" },
      { name: "The trendy new place", match: 78, wins: "A big Instagram following and event nights" },
    ],
    flag: "Your closest rivals fill slow nights with events while you rely on walk-ins.",
  },
  {
    id: "store",
    label: "Online store",
    rivals: [
      { name: "The marketplace giant", match: 92, wins: "Free shipping and thousands of reviews" },
      { name: "The social-media brand", match: 86, wins: "Fresh video ads every week" },
      { name: "The subscription specialist", match: 77, wins: "Bundles that turn one sale into repeat orders" },
    ],
    flag: "Rivals win repeat customers with bundles while you compete on one-time price.",
  },
  {
    id: "software",
    label: "Software",
    rivals: [
      { name: "The category leader", match: 94, wins: "A free plan and dozens of comparison pages" },
      { name: "The fast-growing challenger", match: 88, wins: "Simple pricing and founder-led content" },
      { name: "The niche specialist", match: 79, wins: "Owns one customer type completely" },
    ],
    flag: "Buyers build their shortlist from comparison pages you have not written yet.",
  },
  {
    id: "agency",
    label: "Agency",
    rivals: [
      { name: "The established name", match: 93, wins: "Case studies in your niche and referrals" },
      { name: "The fixed-price package", match: 85, wins: "Public prices that remove buyer doubt" },
      { name: "The solo expert", match: 76, wins: "A personal brand that brings inbound leads" },
    ],
    flag: "Rivals publish their prices, so prospects arrive already comparing you on terms you hide.",
  },
];

export function HeroScope() {
  const [activeId, setActiveId] = useState(SCENARIOS[0].id);
  const [scanning, setScanning] = useState(false);
  const timer = useRef<number | null>(null);
  const scenario = SCENARIOS.find((s) => s.id === activeId) ?? SCENARIOS[0];

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  function pick(id: string) {
    if (id === activeId) return;
    setActiveId(id);
    setScanning(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setScanning(false), 650);
  }

  return (
    <div className="instrument-panel card-glow relative overflow-hidden p-5 sm:p-7">
      <div className="blueprint-grid absolute inset-0 opacity-50" aria-hidden="true" />
      <CornerFrame size={14} />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-brass-300">
            <span className="h-1.5 w-1.5 scope-pulse rounded-full bg-brass-400" />
            Try it now
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cream-300">Example results</span>
        </div>

        <p className="mt-4 font-display text-lg font-semibold text-cream-50">What kind of business do you run?</p>
        <div role="group" aria-label="Choose a business type" className="mt-3 flex flex-wrap gap-2">
          {SCENARIOS.map((s) => {
            const active = s.id === activeId;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={active}
                onClick={() => pick(s.id)}
                className={`border px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-400 ${
                  active
                    ? "border-brass-400 bg-brass-400 text-navy-950"
                    : "border-cream-300/30 text-cream-200 hover:border-brass-300 hover:text-brass-300"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 min-h-[17.5rem]" aria-live="polite">
          <AnimatePresence mode="wait">
            {scanning ? (
              <motion.div
                key="scan"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-[17.5rem] flex-col items-center justify-center gap-3"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-brass-300">Scanning the web for rivals</p>
                <div className="h-1 w-48 overflow-hidden bg-navy-600">
                  <motion.div
                    className="h-full bg-brass-400"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream-300">Your closest competitors</p>
                <ul className="mt-3 space-y-3.5">
                  {scenario.rivals.map((r, i) => (
                    <li key={r.name}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[14.5px] font-semibold text-cream-50">{r.name}</span>
                        <span className="shrink-0 font-mono text-[11px] text-brass-300">{r.match}% match</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full bg-navy-600">
                        <motion.div
                          className="h-full bg-brass-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${r.match}%` }}
                          transition={{ duration: 0.55, delay: i * 0.08, ease: "easeOut" }}
                        />
                      </div>
                      <p className="mt-1.5 text-[12.5px] leading-snug text-cream-300">Wins with: {r.wins}</p>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 border-t border-cream-300/20 pt-3 text-[13px] leading-snug text-cream-100">
                  <span className="font-semibold text-brass-300">We would flag first: </span>
                  {scenario.flag}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
          <ButtonLink href="/onboarding/1" size="md">
            Get this for my business
            <ArrowRight size={15} />
          </ButtonLink>
          <span className="text-[11.5px] text-cream-300">Made-up examples. Your report names real companies.</span>
        </div>
      </div>
    </div>
  );
}
