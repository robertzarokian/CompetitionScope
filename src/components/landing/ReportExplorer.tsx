"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileDown, Megaphone, Target, TrendingUp, type LucideIcon } from "lucide-react";
import { Panel } from "@/components/decor/Panel";
import { SectionHeading } from "@/components/site/SectionHeading";

function RankingsVisual() {
  const rows = [
    { rank: "01", name: "Category leader", match: 94 },
    { rank: "02", name: "Fast-growing challenger", match: 88 },
    { rank: "03", name: "Niche specialist", match: 79 },
  ];
  return (
    <div className="space-y-3 p-5">
      {rows.map((r) => (
        <div key={r.rank} className="flex items-center gap-4 border border-navy-600 bg-cream-50 px-4 py-3">
          <span className="font-display text-2xl font-bold text-brass-500">{r.rank}</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-navy-800">{r.name}</p>
            <div className="mt-1.5 h-1 w-full bg-navy-100">
              <div className="h-full bg-brass-400" style={{ width: `${r.match}%` }} />
            </div>
          </div>
          <span className="font-mono text-[11px] font-semibold text-brass-600">
            {r.match}% match
          </span>
        </div>
      ))}
    </div>
  );
}

function ChannelsVisual() {
  const channels = [
    "SEO and comparison pages",
    "Paid search",
    "Review sites",
    "LinkedIn",
    "Partner referrals",
    "Webinars",
  ];
  return (
    <div className="space-y-4 p-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">
          Estimated scale
        </p>
        <p className="mt-1 text-sm text-navy-800">$20M-$40M ARR (estimated)</p>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">
          Advertising channels
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {channels.map((c) => (
            <span
              key={c}
              className="border border-navy-300 bg-cream-50 px-2.5 py-1 font-mono text-[11px] text-navy-700"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">
          Sales strategy
        </p>
        <p className="mt-1 text-sm leading-relaxed text-navy-500">
          Free trial for small teams, with sales-assisted upgrades once usage grows.
        </p>
      </div>
    </div>
  );
}

function FactorsVisual() {
  const factors = [
    { title: "They win the comparison search", shared: "3 of 3 competitors" },
    { title: "Transparent, low-friction pricing", shared: "2 of 3 competitors" },
    { title: "Proof beats product specs", shared: "3 of 3 competitors" },
  ];
  return (
    <div className="space-y-3 p-5">
      {factors.map((f) => (
        <div key={f.title} className="border border-navy-600 bg-cream-50 px-4 py-3">
          <p className="text-sm font-semibold text-navy-800">{f.title}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-brass-600">
            {f.shared}
          </p>
        </div>
      ))}
    </div>
  );
}

function RoadmapVisual() {
  const items = [
    { n: 1, title: "Publish comparison pages", impact: "High impact", effort: "Medium effort" },
    { n: 2, title: "Reposition around outcomes", impact: "High impact", effort: "Medium effort" },
    { n: 3, title: "Publish clear pricing", impact: "Medium impact", effort: "Low effort" },
  ];
  return (
    <div className="space-y-3 p-5">
      {items.map((it) => (
        <div key={it.n} className="flex items-center gap-4 border border-navy-600 bg-cream-50 px-4 py-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-navy-800 font-mono text-xs text-brass-300">
            {it.n}
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-navy-800">{it.title}</p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-navy-400">
              {it.impact} · {it.effort}
            </p>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-brass-600">
        <FileDown size={14} />
        Branded PDF included
      </div>
    </div>
  );
}

interface Tab {
  id: string;
  label: string;
  Icon: LucideIcon;
  title: string;
  body: string;
  points: string[];
  visual: ReactNode;
}

const TABS: Tab[] = [
  {
    id: "rankings",
    label: "Competitor rankings",
    Icon: Target,
    title: "Know exactly who you are up against",
    body: "We find the companies closest to you and score how well each one matches your business, then rank them by how strongly they are performing.",
    points: [
      "A match score for every competitor",
      "A ranking by overall strength",
      "A plain-English summary of who they are",
    ],
    visual: <RankingsVisual />,
  },
  {
    id: "channels",
    label: "Sales and channels",
    Icon: Megaphone,
    title: "See how they sell and where they advertise",
    body: "For each rival you get a read on how they go to market, which channels they use to find customers, and how big they appear to be.",
    points: [
      "Visible advertising and marketing channels",
      "Their go-to-market and sales approach",
      "A labeled estimate of their scale",
    ],
    visual: <ChannelsVisual />,
  },
  {
    id: "factors",
    label: "Success factors",
    Icon: TrendingUp,
    title: "Learn the habits your top rivals share",
    body: "When several competitors do the same thing, it is usually working. We surface the repeatable patterns behind their success so you can act on them.",
    points: [
      "Patterns shared across your competitors",
      "How many rivals show each trait",
      "Why each one drives results",
    ],
    visual: <FactorsVisual />,
  },
  {
    id: "roadmap",
    label: "Roadmap and PDF",
    Icon: FileDown,
    title: "Leave with a plan, not just a list",
    body: "Every report ends with a prioritized roadmap tied to your situation, with each step rated by impact and effort, plus a branded PDF to share with your team.",
    points: [
      "Steps ordered by priority",
      "Impact and effort for each step",
      "A branded PDF you can keep and share",
    ],
    visual: <RoadmapVisual />,
  },
];

export function ReportExplorer() {
  const [activeId, setActiveId] = useState(TABS[0].id);
  const active = TABS.find((t) => t.id === activeId) ?? TABS[0];

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next =
      (index + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
    setActiveId(TABS[next].id);
    document.getElementById(`tab-${TABS[next].id}`)?.focus();
  }

  return (
    <div>
      <SectionHeading
        label="What's inside your report"
        title="Four sections that turn research into action"
        body="Click through each part of the report to see what you get."
      />

      <div
        role="tablist"
        aria-label="Report sections"
        className="no-scrollbar mt-7 flex gap-2 overflow-x-auto"
      >
        {TABS.map((t, i) => {
          const selected = t.id === activeId;
          return (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveId(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`inline-flex shrink-0 items-center gap-2 border px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500/60 ${
                selected
                  ? "border-navy-800 bg-navy-800 text-cream-50"
                  : "border-navy-600 bg-cream-50 text-navy-700 hover:border-brass-500"
              }`}
            >
              <t.Icon size={14} className={selected ? "text-brass-300" : "text-brass-500"} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`panel-${active.id}`}
        aria-labelledby={`tab-${active.id}`}
        className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-center"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="contents"
          >
            <div>
              <h3 className="font-display text-xl font-semibold text-navy-800 sm:text-2xl">
                {active.title}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-navy-500">{active.body}</p>
              <ul className="mt-5 space-y-2.5">
                {active.points.map((p) => (
                  <li key={p} className="flex gap-3 text-sm text-navy-700">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-brass-500" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <Panel eyebrow={active.label} meta="Example">
              {active.visual}
            </Panel>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
