import Link from "next/link";
import { ArrowRight, Bell, Bot, Check, Telescope } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { CornerFrame } from "@/components/decor/CornerFrame";
import { SectionHeading } from "@/components/site/SectionHeading";
import { STARTING_PRICE_LABEL } from "@/lib/plans";

const MAIN_POINTS = [
  "Your closest rivals, ranked by how closely they match you",
  "How each one sells, where they advertise, and how big they are",
  "What they all have in common, and why they are winning",
  "A prioritized 3 step plan to beat them",
];

// What the visitor might be looking for, in plain words. Competitor analysis
// is the main service; tracking and AI SEO are options beside it.
export function ServicePicker() {
  return (
    <div>
      <SectionHeading
        label="What we do"
        title="What are you looking for?"
        body="Most customers start with a competitor analysis. Tracking and AI SEO are options you can add."
      />
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="instrument-panel card-glow relative overflow-hidden p-6 sm:p-8">
          <div className="blueprint-grid absolute inset-0 opacity-50" aria-hidden="true" />
          <CornerFrame size={14} />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 border border-brass-500/50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-brass-300">
                <Telescope size={13} />
                Our main service
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cream-300">Free preview</span>
            </div>
            <p className="mt-5 font-display text-sm italic text-brass-300">&ldquo;Who am I really up against?&rdquo;</p>
            <h3 className="mt-1 font-display text-3xl font-semibold text-cream-50">Competitor Analysis</h3>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-cream-200">
              Answer 10 short questions. We research the live web, find the companies winning your customers, and show you
              exactly how to beat them. Ready in about a minute.
            </p>
            <ul className="mt-5 space-y-2.5">
              {MAIN_POINTS.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-[14px] text-cream-100">
                  <Check size={16} className="mt-0.5 shrink-0 text-brass-400" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <ButtonLink href="/onboarding/1" size="lg">
                Begin your scope
                <ArrowRight size={16} />
              </ButtonLink>
              <Link
                href="/sample-report"
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream-300 underline-offset-4 transition-colors hover:text-brass-300 hover:underline"
              >
                See a sample report
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="paper-panel flex-1 border border-navy-600 p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-brass-600">
                <Bell size={13} />
                Option: stay informed
              </span>
            </div>
            <p className="mt-3 font-display text-sm italic text-navy-500">&ldquo;What if my competition changes?&rdquo;</p>
            <h3 className="mt-1 font-display text-xl font-semibold text-navy-800">Ongoing tracking</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-navy-500">
              Automatic re-checks, trend lines, and email alerts when something changes, so you never fall behind. From{" "}
              {STARTING_PRICE_LABEL}/month.
            </p>
            <Link
              href="/pricing"
              className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-brass-600 underline-offset-4 hover:underline"
            >
              See plans
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="paper-panel flex-1 border border-navy-600 p-5">
            <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-brass-600">
              <Bot size={13} />
              Option: AI SEO
            </span>
            <p className="mt-3 font-display text-sm italic text-navy-500">&ldquo;Does AI recommend my business?&rdquo;</p>
            <h3 className="mt-1 font-display text-xl font-semibold text-navy-800">AI SEO audit</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-navy-500">
              See whether AI assistants name you when customers ask for recommendations, and which websites they trust.
              Included with every paid plan.
            </p>
            <Link
              href="/ai-seo"
              className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-brass-600 underline-offset-4 hover:underline"
            >
              Learn about AI SEO
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
