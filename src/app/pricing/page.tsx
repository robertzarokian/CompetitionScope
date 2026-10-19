import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { PageHero, SectionHeading } from "@/components/site/SectionHeading";
import { FaqList } from "@/components/site/FaqList";
import { CtaBand } from "@/components/site/CtaBand";
import { PlanGrid } from "@/components/pricing/PlanGrid";
import { getUserIdFromSession } from "@/lib/auth";
import { getPlan } from "@/lib/account";
import { syncUserFromStripe } from "@/lib/billing";
import { PLANS, STARTING_PRICE_LABEL, isPlanId, type BillingInterval, type PlanId } from "@/lib/plans";
import { FAQS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing: Plans for Ongoing Competitor Tracking",
  description: `Start free, then track your competitors and AI visibility with plans from ${STARTING_PRICE_LABEL} a month. Yearly billing gets 2 months free. Cancel anytime.`,
  alternates: { canonical: "/pricing" },
};

type Cell = boolean | string;

const MATRIX: { label: string; values: [Cell, Cell, Cell, Cell] }[] = [
  { label: "Preview report", values: [true, true, true, true] },
  { label: "Full competitor reports", values: [false, true, true, true] },
  { label: "AI visibility audit", values: [false, true, true, true] },
  { label: "Companies tracked", values: [false, "1", "1", "Up to 10"] },
  { label: "AI questions tracked", values: [false, "3", "10", "50 total"] },
  { label: "Competitors tracked per company", values: [false, "3", "5", "5"] },
  { label: "Automatic checks", values: [false, "Monthly", "Weekly", "Weekly"] },
  { label: "Trend lines and history", values: [false, true, true, true] },
  { label: "Email alerts on changes", values: [false, true, true, true] },
  { label: "Progress checklist", values: [false, true, true, true] },
  { label: "Website and backlink monitoring", values: [false, false, true, true] },
  { label: "PDF reports", values: [false, false, true, true] },
  { label: "White-label PDF reports", values: [false, false, false, true] },
];

const PRICING_FAQ_IDS = ["cost", "free", "included", "cancel", "alerts-scope"];

function CellValue({ value }: { value: Cell }) {
  if (value === true) return <Check size={16} className="text-brass-500" aria-label="Included" />;
  if (value === false) return <Minus size={16} className="text-navy-300" aria-label="Not included" />;
  return <span className="text-navy-800">{value}</span>;
}

export default async function PricingPage({ searchParams }: PageProps<"/pricing">) {
  const sp = await searchParams;
  const userId = await getUserIdFromSession();
  if (userId) await syncUserFromStripe(userId);
  const currentPlan = (await getPlan(userId)).id;

  const wanted = typeof sp.plan === "string" && isPlanId(sp.plan) && sp.plan !== "free" ? (sp.plan as PlanId) : null;
  const interval: BillingInterval = sp.interval === "year" ? "year" : "month";

  return (
    <PageShell>
      <PageHero
        eyebrow="Pricing"
        title="Stay ahead, not just informed."
        intro="Competitors and AI answers change every week. Start with a free preview, then pick a plan that keeps watching for you. Cancel anytime."
      />

      <section className="mx-auto w-full max-w-6xl px-6 pb-14 sm:px-10">
        <PlanGrid
          currentPlan={currentPlan}
          loggedIn={!!userId}
          autoPlan={wanted ? { plan: wanted, interval } : null}
        />
      </section>

      <section className="border-t border-navy-300/60 py-14">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <SectionHeading label="Compare plans" title="Everything side by side" />
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-navy-600">
                  <th className="py-3 pr-4" />
                  {(["free", "starter", "growth", "agency"] as PlanId[]).map((id) => (
                    <th key={id} className="px-3 py-3 font-display text-base font-semibold text-navy-800">
                      {PLANS[id].name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX.map((row) => (
                  <tr key={row.label} className="border-b border-navy-300/60">
                    <th scope="row" className="py-3 pr-4 text-[13.5px] font-normal text-navy-600">
                      {row.label}
                    </th>
                    {row.values.map((v, i) => (
                      <td key={i} className="px-3 py-3">
                        <CellValue value={v} />
                      </td>
                    ))}
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
