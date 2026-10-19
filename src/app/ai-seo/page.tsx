import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageShell } from "@/components/site/PageShell";
import { PageHero, SectionHeading } from "@/components/site/SectionHeading";
import { FaqList } from "@/components/site/FaqList";
import { CtaBand } from "@/components/site/CtaBand";
import { JsonLd } from "@/components/site/JsonLd";
import { Reveal } from "@/components/site/Reveal";
import { AiSeoNav } from "@/components/aiseo/AiSeoNav";
import { AiAnswerDemo } from "@/components/aiseo/AiAnswerDemo";
import { PlansIncluded } from "@/components/aiseo/PlansIncluded";
import { AI_SEO_CHECKS, AI_SEO_FAQS, AI_SEO_STEPS } from "@/lib/aiseo";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI SEO: Get Recommended by ChatGPT, Claude, Gemini and More",
  description:
    "AI SEO shows whether AI assistants recommend your business, why your competitors are named instead, and which websites those answers rely on. Free audit included.",
  alternates: { canonical: "/ai-seo" },
};

export default function AiSeoPage() {
  return (
    <PageShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Service",
              name: "AI SEO and AI Visibility Audit",
              provider: { "@id": `${SITE_URL}/#organization` },
              url: `${SITE_URL}/ai-seo`,
              serviceType: "AI search optimization",
            },
            {
              "@type": "FAQPage",
              mainEntity: AI_SEO_FAQS.map((f) => ({
                "@type": "Question",
                name: f.question,
                acceptedAnswer: { "@type": "Answer", text: f.answer },
              })),
            },
          ],
        }}
      />
      <AiSeoNav />
      <PageHero
        eyebrow="AI SEO, GEO and AEO"
        title="Get your business recommended by AI"
        intro="Customers now ask AI assistants who to hire and what to buy. CompetitionScope reverse engineers those answers: who gets named, why, and which websites the AI trusts, so you know exactly what to do to be on the list."
      />
      <section className="mx-auto -mt-2 flex w-full max-w-6xl flex-wrap items-center gap-3 px-6 pb-12 sm:px-10">
        <ButtonLink href="/ai-seo/audit" size="lg">
          Run your free audit
          <ArrowRight size={16} />
        </ButtonLink>
        <ButtonLink href="/ai-seo/what-is-ai-seo" variant="secondary" size="lg">
          What is AI SEO?
        </ButtonLink>
      </section>

      <section className="border-t border-navy-300/60 py-14">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <Reveal>
            <SectionHeading
              label="See it work"
              title="One question, the companies named, and the sources behind them"
              body="This is the core of the audit. Choose a question to see how an answer breaks down."
            />
          </Reveal>
          <div className="mt-8 max-w-3xl">
            <AiAnswerDemo />
          </div>
        </div>
      </section>

      <section className="border-t border-navy-300/60 py-14">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <Reveal>
            <SectionHeading label="How it works" title="From your questions to a plan" />
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AI_SEO_STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.06}>
                <div className="paper-panel h-full border border-navy-600 p-5">
                  <span className="flex h-8 w-8 items-center justify-center bg-navy-800 font-mono text-xs text-brass-300">{i + 1}</span>
                  <h3 className="mt-4 font-display text-base font-semibold text-navy-800">{s.title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-navy-500">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-[13.5px] leading-relaxed text-navy-500">
            The audit starts with Claude and adds ChatGPT, Perplexity, Gemini, and Grok as each is connected. Your results
            always show which assistants were actually asked.
          </p>
        </div>
      </section>

      <section className="border-t border-navy-300/60 py-14">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading
                label="Your website, checked"
                title="12 checks that decide how visible you are"
                body="Each audit also inspects your own site and your backlinks, then compares them with your competitors."
              />
              <Link
                href="/ai-seo/checklist"
                className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-brass-600 underline-offset-4 hover:underline"
              >
                See what each check means
                <ArrowRight size={13} />
              </Link>
            </div>
          </Reveal>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AI_SEO_CHECKS.map((c) => (
              <div key={c.n} className="paper-panel border border-navy-600 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass-500">Check {c.n}</p>
                <h3 className="mt-1 font-display text-[15px] font-semibold text-navy-800">{c.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-navy-500">{c.short}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PlansIncluded />

      <section className="border-t border-navy-300/60 py-14">
        <div className="mx-auto w-full max-w-3xl px-6 sm:px-10">
          <Reveal>
            <SectionHeading label="Questions" title="AI SEO, answered" className="mb-8" />
            <FaqList items={AI_SEO_FAQS} />
          </Reveal>
        </div>
      </section>

      <CtaBand
        title="Find out if AI recommends you."
        body="Create a free account and run your first AI visibility audit."
        ctaHref="/ai-seo/audit"
        ctaLabel="Run the free audit"
        linkHref="/ai-seo/what-is-ai-seo"
        linkLabel="What is AI SEO?"
      />
    </PageShell>
  );
}
