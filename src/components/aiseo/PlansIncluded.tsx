import { Check } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { SectionHeading } from "@/components/site/SectionHeading";
import { PAID_PLANS, PLANS, formatPrice, type PlanId } from "@/lib/plans";

// What each plan includes for AI SEO, built from the same plan data the
// pricing page uses so the two can never disagree.
function lines(id: PlanId): string[] {
  const p = PLANS[id];
  if (id === "free") return ["1 AI visibility audit", "12 point website check", "Preview report"];
  const out = [
    `Re-checked ${p.limits.checkEveryDays === 7 ? "every week" : "every month"}`,
    `${p.limits.questions} AI question${p.limits.questions === 1 ? "" : "s"} tracked${p.limits.clients > 1 ? " across your clients" : ""}`,
    p.limits.clients > 1 ? `Up to ${p.limits.clients} clients` : "1 company tracked",
    "Email alerts when your visibility changes",
  ];
  if (p.limits.websiteMonitoring) out.push("Website and backlink monitoring");
  if (p.limits.pdf) out.push(p.limits.whiteLabel ? "White-label PDF reports" : "PDF reports");
  return out;
}

export function PlansIncluded() {
  const ids: PlanId[] = ["free", ...PAID_PLANS];
  return (
    <section className="border-t border-navy-300/60 py-14">
      <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
        <SectionHeading
          label="Plans"
          title="What is included in each plan"
          body="Start free with one audit. Paid plans keep watching, so you see whether your changes are working."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ids.map((id) => {
            const p = PLANS[id];
            return (
              <div key={id} className="paper-panel flex h-full flex-col border border-navy-600 p-5">
                <h3 className="font-display text-lg font-semibold text-navy-800">{p.name}</h3>
                <p className="mt-1 font-display text-2xl font-semibold text-navy-800">
                  {id === "free" ? "Free" : formatPrice(p.monthlyCents)}
                  {id !== "free" && <span className="text-sm font-normal text-navy-400"> /month</span>}
                </p>
                <p className="mt-1 text-[13px] text-navy-500">{p.tagline}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {lines(id).map((l) => (
                    <li key={l} className="flex items-start gap-2 text-[13.5px] text-navy-600">
                      <Check size={15} className="mt-0.5 shrink-0 text-brass-500" />
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <ButtonLink href="/pricing" variant="secondary" size="md">
            Compare plans in full
          </ButtonLink>
          <p className="text-[13px] text-navy-500">Yearly billing gets 2 months free. Cancel anytime. 7 day money-back guarantee.</p>
        </div>
      </div>
    </section>
  );
}
