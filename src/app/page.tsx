import Link from "next/link";
import { ArrowRight, Check, ClipboardList, FileText, Search } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { HeroScope } from "@/components/landing/HeroScope";
import { ServicePicker } from "@/components/landing/ServicePicker";
import { ReportExplorer } from "@/components/landing/ReportExplorer";
import { PromoPopup } from "@/components/landing/PromoPopup";
import { PageShell } from "@/components/site/PageShell";
import { SectionHeading } from "@/components/site/SectionHeading";
import { FaqList } from "@/components/site/FaqList";
import { CtaBand } from "@/components/site/CtaBand";
import { JsonLd } from "@/components/site/JsonLd";
import { Reveal } from "@/components/site/Reveal";
import { PAID_PLANS, PLANS, STARTING_PRICE_LABEL, formatPrice } from "@/lib/plans";
import { FAQS, LINKEDIN_URL, SITE_URL } from "@/lib/site";

const HERO_FACTS = ["10 quick questions", "About a minute", "Free preview, no card"];

const THREE_STEPS = [
  {
    Icon: ClipboardList,
    title: "Tell us about your business",
    body: "Answer 10 quick questions: what you sell, who you sell to, and what has been hard lately.",
  },
  {
    Icon: Search,
    title: "We search the web for rivals",
    body: "We find the companies you are most likely losing customers to and study how each one wins.",
  },
  {
    Icon: FileText,
    title: "You get a clear report",
    body: "See who they are, how they sell, where they advertise, and a step-by-step plan to beat them.",
  },
];

const PLAN_BLURBS: Record<string, string> = {
  starter: "Keep an eye on one company, with monthly re-checks.",
  growth: "Weekly re-checks, website tracking, and PDF reports.",
  agency: "Run it for up to 10 clients, with your own branding.",
};

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

      <PromoPopup />

      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 pb-14 pt-4 sm:px-10 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
        <div>
          <span className="inline-flex items-center gap-2 border border-brass-500/40 bg-navy-800 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-brass-300">
            <span className="h-1.5 w-1.5 scope-pulse rounded-full bg-brass-400" />
            Competitor research for business owners
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] text-navy-800 sm:text-5xl lg:text-[3.1rem]">
            Find out who you are <span className="brass-underline">really</span> up against.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-navy-500 sm:text-[17px]">
            CompetitionScope finds your competitors for you. Tell us about your business and we show you who is winning
            your customers, how they do it, and what to do about it.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <ButtonLink href="/onboarding/1" size="lg">
              Start free
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
        <HeroScope />
      </section>

      <section id="how" className="relative border-t border-navy-300/60 py-14">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading label="How it works" title="Three steps, about a minute" />
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-brass-600 underline-offset-4 hover:underline"
              >
                More detail
                <ArrowRight size={13} />
              </Link>
            </div>
          </Reveal>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {THREE_STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.07}>
                <li className="paper-panel group relative h-full border border-navy-600 p-6 transition-shadow hover:shadow-[0_6px_0_0_rgba(171,127,60,0.35)]">
                  <span className="absolute right-4 top-3 font-display text-5xl font-bold text-navy-100">{i + 1}</span>
                  <step.Icon size={22} className="relative text-brass-500" strokeWidth={1.75} />
                  <h3 className="relative mt-4 font-display text-lg font-semibold text-navy-800">{step.title}</h3>
                  <p className="relative mt-2 text-[14px] leading-relaxed text-navy-500">{step.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section id="services" className="relative border-t border-navy-300/60 py-14">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <Reveal>
            <ServicePicker />
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

      <section id="pricing" className="relative border-t border-navy-300/60 py-14">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <Reveal>
            <SectionHeading
              label="Pricing"
              title="Start free. Pay when you want more."
              body={`Your first report preview costs nothing. Plans start at ${STARTING_PRICE_LABEL} a month and you can cancel anytime.`}
            />
          </Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {PAID_PLANS.map((id, i) => (
              <Reveal key={id} delay={i * 0.07}>
                <Link
                  href="/pricing"
                  className="paper-panel group block h-full border border-navy-600 p-6 transition-shadow hover:shadow-[0_6px_0_0_rgba(171,127,60,0.35)]"
                >
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-navy-400">{PLANS[id].name}</p>
                  <p className="mt-2 font-display text-3xl font-semibold text-navy-800">
                    {formatPrice(PLANS[id].monthlyCents)}
                    <span className="ml-1 font-sans text-sm font-normal text-navy-400">/month</span>
                  </p>
                  <p className="mt-2 text-[14px] leading-relaxed text-navy-500">{PLAN_BLURBS[id]}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-brass-600 group-hover:underline">
                    See what is included
                    <ArrowRight size={13} />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="relative border-t border-navy-300/60 py-14">
        <div className="mx-auto w-full max-w-3xl px-6 sm:px-10">
          <Reveal>
            <SectionHeading label="Questions" title="Quick answers" className="mb-8" />
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
