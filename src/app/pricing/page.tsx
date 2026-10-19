import type { Metadata } from "next";
import { Check } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageShell } from "@/components/site/PageShell";
import { PageHero, SectionHeading } from "@/components/site/SectionHeading";
import { FaqList } from "@/components/site/FaqList";
import { CtaBand } from "@/components/site/CtaBand";
import { REPORT_PRICE_LABEL } from "@/lib/pricing";
import { FAQS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing: One Report, One-Time Payment",
  description: `Preview your competitor report free, then unlock the full report and PDF for ${REPORT_PRICE_LABEL}, one time. No subscription.`,
  alternates: { canonical: "/pricing" },
};

const FREE_FEATURES = [
  "Executive summary of your situation",
  "The first insight we noticed",
  "Your closest competitor in full detail",
  "A look at what the rest of the report holds",
];

const PAID_FEATURES = [
  "All three closest competitors in full detail",
  "The three success factors they share",
  "A three-step prioritized roadmap",
  "Impact and effort rating for every step",
  "A branded PDF export to keep and share",
];

const COMPARISON = [
  {
    row: "Time to first results",
    us: "About a minute or two",
    diy: "Hours of your own searching",
    agency: "Varies by agency",
  },
  {
    row: "Cost",
    us: `${REPORT_PRICE_LABEL} one time`,
    diy: "Free, but it costs your time",
    agency: "Varies by agency",
  },
  {
    row: "What you get",
    us: "Ranked competitors and a prioritized plan",
    diy: "As deep as you make it",
    agency: "Custom depth from human analysts",
  },
];

const PRICING_FAQ_IDS = ["cost", "free", "included", "pdf"];

export default function PricingPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Pricing"
        title="One report. One payment."
        intro="Start with a free preview. If it is useful, unlock the full report and PDF with a single payment. No subscription, nothing renews."
      />

      <section className="mx-auto grid w-full max-w-6xl gap-5 px-6 pb-14 sm:px-10 md:grid-cols-2">
        <div className="paper-panel flex flex-col border border-navy-600 p-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-navy-400">
            Free preview
          </p>
          <p className="mt-3 font-display text-4xl font-semibold text-navy-800">$0</p>
          <p className="mt-1 text-sm text-navy-500">See what we find before you pay anything.</p>
          <ul className="mt-6 flex-1 space-y-3">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex gap-3 text-sm text-navy-700">
                <Check size={16} className="mt-0.5 shrink-0 text-brass-500" />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-7">
            <ButtonLink href="/onboarding/1" variant="secondary" size="lg">
              Start free preview
            </ButtonLink>
          </div>
        </div>

        <div className="instrument-panel card-glow flex flex-col p-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brass-400">
            Full report
          </p>
          <p className="mt-3 font-display text-4xl font-semibold text-cream-50">
            {REPORT_PRICE_LABEL}
            <span className="ml-2 font-sans text-sm font-normal text-cream-300">
              one time
            </span>
          </p>
          <p className="mt-1 text-sm text-cream-200">Everything in the preview, plus the rest.</p>
          <ul className="mt-6 flex-1 space-y-3">
            {PAID_FEATURES.map((f) => (
              <li key={f} className="flex gap-3 text-sm text-cream-100">
                <Check size={16} className="mt-0.5 shrink-0 text-brass-300" />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-7">
            <ButtonLink href="/onboarding/1" size="lg">
              Begin your scope
            </ButtonLink>
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-cream-300">
            Preview first. Pay only if you want the full report.
          </p>
        </div>
      </section>

      <section className="border-t border-navy-300/60 py-14">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <SectionHeading
            label="How it compares"
            title="Faster than doing it yourself, lighter than an agency"
          />
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-navy-600">
                  <th className="py-3 pr-4 font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-navy-400" />
                  <th className="py-3 pr-4 font-display text-base font-semibold text-brass-600">
                    CompetitionScope
                  </th>
                  <th className="py-3 pr-4 font-display text-base font-semibold text-navy-800">
                    Doing it yourself
                  </th>
                  <th className="py-3 font-display text-base font-semibold text-navy-800">
                    Hiring an agency
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((r) => (
                  <tr key={r.row} className="border-b border-navy-300/60 align-top">
                    <th
                      scope="row"
                      className="py-4 pr-4 font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-navy-400"
                    >
                      {r.row}
                    </th>
                    <td className="py-4 pr-4 font-medium text-navy-800">{r.us}</td>
                    <td className="py-4 pr-4 text-navy-500">{r.diy}</td>
                    <td className="py-4 text-navy-500">{r.agency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-t border-navy-300/60 py-14">
        <div className="mx-auto w-full max-w-3xl px-6 sm:px-10">
          <SectionHeading label="Questions" title="Pricing questions" className="mb-8" />
          <FaqList items={FAQS.filter((f) => PRICING_FAQ_IDS.includes(f.id))} />
        </div>
      </section>

      <CtaBand />
    </PageShell>
  );
}
