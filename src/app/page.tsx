import Link from "next/link";
import { ArrowRight, Briefcase, Check, Megaphone, Target, Users } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { TelescopeSchematic } from "@/components/landing/TelescopeSchematic";
import { ScopePreview } from "@/components/landing/ScopePreview";
import { ReportExplorer } from "@/components/landing/ReportExplorer";
import { BlindSpotCalculator } from "@/components/landing/BlindSpotCalculator";
import { PageShell } from "@/components/site/PageShell";
import { SectionHeading } from "@/components/site/SectionHeading";
import { FaqList } from "@/components/site/FaqList";
import { CtaBand } from "@/components/site/CtaBand";
import { JsonLd } from "@/components/site/JsonLd";
import { Reveal } from "@/components/site/Reveal";
import { REPORT_PRICE_LABEL } from "@/lib/pricing";
import { FAQS, LINKEDIN_URL, SITE_URL, STEPS } from "@/lib/site";

const AUDIENCES = [
  {
    title: "Founders and owners",
    description:
      "Know who you are really up against before you set pricing, positioning, or your next hire.",
    Icon: Briefcase,
  },
  {
    title: "Marketing leads",
    description:
      "See which channels your rivals lean on and where they are winning attention you are not.",
    Icon: Megaphone,
  },
  {
    title: "Sales teams",
    description:
      "Understand why deals go to a competitor and what to say when they show up late in the cycle.",
    Icon: Target,
  },
  {
    title: "Agencies and consultants",
    description:
      "Brief a new client on their competitive landscape with a ranked, specific starting point.",
    Icon: Users,
  },
];

const HERO_FACTS = [
  "10 short questions",
  "Researched on the live web",
  `Free preview, then ${REPORT_PRICE_LABEL} one time`,
];

const HOME_FAQ_IDS = ["what", "time", "free", "accuracy"];

export default function Home() {
  return (
    <PageShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${SITE_URL}/#organization`,
              name: "CompetitionScope",
              url: SITE_URL,
              sameAs: [LINKEDIN_URL],
            },
            {
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              name: "CompetitionScope",
              url: SITE_URL,
              publisher: { "@id": `${SITE_URL}/#organization` },
            },
          ],
        }}
      />

      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 pb-14 pt-4 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        <div>
          <span className="inline-flex items-center gap-2 border border-brass-500/40 bg-navy-800 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-brass-300">
            <span className="h-1.5 w-1.5 scope-pulse rounded-full bg-brass-400" />
            Competitor research in minutes
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] text-navy-800 sm:text-5xl lg:text-[3.15rem]">
            See your competition{" "}
            <span className="relative inline-block">
              <span className="brass-underline">clearly</span>
              <svg
                className="absolute -bottom-1 left-0 w-full"
                height="8"
                viewBox="0 0 200 8"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M1 5.5C40 2 90 1 130 4C155 6 175 5 199 2.5"
                  stroke="#cc9f52"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            .
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-navy-500 sm:text-[17px]">
            Point CompetitionScope at your closest rivals and we do the deep,
            unglamorous work of finding them. You get their strategy, their
            edge, and where they advertise, plus a specific plan to beat them.
            Answer a few questions to start.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <ButtonLink href="/onboarding/1" size="lg">
              Begin your scope
              <ArrowRight size={16} />
            </ButtonLink>
            <ButtonLink href="/sample-report" variant="secondary" size="lg">
              See a sample report
            </ButtonLink>
          </div>
          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2">
            {HERO_FACTS.map((fact) => (
              <li
                key={fact}
                className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-navy-500"
              >
                <Check size={14} className="text-brass-500" />
                {fact}
              </li>
            ))}
          </ul>
        </div>
        <TelescopeSchematic />
      </section>

      <section id="preview" className="relative border-t border-navy-300/60 py-14">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <Reveal>
            <ScopePreview />
          </Reveal>
        </div>
      </section>

      <section id="inside" className="relative border-t border-navy-300/60 py-14">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <Reveal>
            <ReportExplorer />
          </Reveal>
        </div>
      </section>

      <section id="how" className="relative border-t border-navy-300/60 py-14">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading
                label="How it works"
                title="From a few answers to a full competitive picture"
              />
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-brass-600 underline-offset-4 hover:underline"
              >
                See the full process
                <ArrowRight size={13} />
              </Link>
            </div>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.06}>
                <div className="paper-panel h-full border border-navy-600 p-5">
                  <span className="flex h-8 w-8 items-center justify-center bg-navy-800 font-mono text-xs text-brass-300">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-display text-base font-semibold text-navy-800">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-navy-500">
                    {step.short}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative border-t border-navy-300/60 py-14">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <Reveal>
            <SectionHeading
              label="Who it is for"
              title="Built for anyone who needs to know the competition"
            />
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCES.map((a, i) => (
              <Reveal key={a.title} delay={i * 0.06}>
                <div className="paper-panel h-full border border-navy-600 p-5">
                  <a.Icon size={18} className="text-brass-500" strokeWidth={1.75} />
                  <h3 className="mt-3 font-display text-base font-semibold text-navy-800">
                    {a.title}
                  </h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-navy-500">
                    {a.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="calculator" className="relative border-t border-navy-300/60 py-14">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <Reveal>
            <BlindSpotCalculator />
          </Reveal>
        </div>
      </section>

      <section id="faq" className="relative border-t border-navy-300/60 py-14">
        <div className="mx-auto w-full max-w-3xl px-6 sm:px-10">
          <Reveal>
            <SectionHeading
              label="Questions"
              title="Quick answers before you start"
              className="mb-8"
            />
            <FaqList items={FAQS.filter((f) => HOME_FAQ_IDS.includes(f.id))} />
            <p className="mt-6">
              <Link
                href="/faq"
                className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-brass-600 underline-offset-4 hover:underline"
              >
                Read all questions
                <ArrowRight size={13} />
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </PageShell>
  );
}
