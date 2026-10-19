import type { Metadata } from "next";
import { Reveal } from "@/components/site/Reveal";
import { PageShell } from "@/components/site/PageShell";
import { PageHero, SectionHeading } from "@/components/site/SectionHeading";
import { CtaBand } from "@/components/site/CtaBand";
import { STEPS } from "@/lib/site";

export const metadata: Metadata = {
  title: "How Competitor Research Works",
  description:
    "Answer 10 short questions and CompetitionScope researches your closest competitors on the live web, then delivers a ranked report with a prioritized plan.",
  alternates: { canonical: "/how-it-works" },
};

const QUESTIONS = [
  "Your email",
  "Company name",
  "Website",
  "Category",
  "What you provide",
  "What you are struggling with",
  "How sales are going",
  "Performance versus potential",
  "Rivals you already know (optional)",
  "Marketing channels you use",
];

const LOOK_AT = [
  {
    title: "Positioning",
    description: "How each rival describes itself and who it says it is for.",
  },
  {
    title: "Pricing signals",
    description: "How they package and price, and what that says about their buyers.",
  },
  {
    title: "Marketing channels",
    description: "Where they advertise and which channels appear to bring them customers.",
  },
  {
    title: "Apparent scale",
    description: "A labeled estimate of size, based on signals like funding and headcount.",
  },
  {
    title: "Sales approach",
    description: "Whether they sell self-serve, through sales teams, or through partners.",
  },
  {
    title: "Public emphasis",
    description: "What shows up in their site copy, reviews, press, and job postings.",
  },
];

const GOOD_TO_KNOW = [
  "Research is done by AI using live web search, so treat the findings as a strong starting point and verify details that matter.",
  "Revenue and scale figures are estimates and are labeled that way. We do not present non-public financials as facts.",
  "If we cannot find enough direct competitors, we use the closest real analogues instead of inventing companies.",
  "Most reports finish in about a minute and some take up to 2 minutes. Keep the tab open while we work.",
];

export default function HowItWorksPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="How it works"
        title="From a few answers to a full competitive picture"
        intro="You describe your business. We research the live web for the rivals you are most likely losing to, then turn what we find into a ranked report and a plan."
      />

      <section className="mx-auto w-full max-w-6xl px-6 pb-14 sm:px-10">
        <ol className="space-y-5">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <Reveal>
                <div className="paper-panel flex gap-5 border border-navy-600 p-6">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-navy-800 font-mono text-sm text-brass-300">
                    {i + 1}
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-navy-800">
                      {step.title}
                    </h2>
                    <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-navy-500">
                      {step.long}
                    </p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-navy-300/60 py-14">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 sm:px-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              label="What you tell us"
              title="Ten short questions"
              body="Answers are quick to give and they steer the research, so the findings are specific to you."
            />
            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {QUESTIONS.map((q, i) => (
                <li key={q} className="flex items-center gap-3 text-sm text-navy-700">
                  <span className="font-mono text-[11px] text-brass-500">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {q}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionHeading
              label="What we look at"
              title="Six things for every competitor"
            />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {LOOK_AT.map((item) => (
                <div key={item.title} className="paper-panel border border-navy-600 p-4">
                  <h3 className="font-display text-sm font-semibold text-navy-800">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-navy-500">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-navy-300/60 py-14">
        <div className="mx-auto w-full max-w-3xl px-6 sm:px-10">
          <SectionHeading label="Good to know" title="Straight answers about the research" />
          <ul className="mt-6 space-y-3">
            {GOOD_TO_KNOW.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-navy-500">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-brass-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand />
    </PageShell>
  );
}
