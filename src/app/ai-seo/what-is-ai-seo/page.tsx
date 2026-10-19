import type { Metadata } from "next";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/SectionHeading";
import { CtaBand } from "@/components/site/CtaBand";
import { JsonLd } from "@/components/site/JsonLd";
import { AiSeoNav } from "@/components/aiseo/AiSeoNav";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "What Is AI SEO? A Plain Guide to GEO and AEO",
  description:
    "AI SEO, GEO, AEO, and LLM SEO explained simply: how AI assistants choose which businesses to recommend and what you can do to be one of them.",
  alternates: { canonical: "/ai-seo/what-is-ai-seo" },
};

const SECTIONS = [
  {
    h: "AI SEO in one paragraph",
    p: [
      "AI SEO is the work of getting AI assistants such as ChatGPT, Claude, Gemini, and Perplexity to name your business when someone asks for a recommendation. You will also see it called GEO (generative engine optimization), AEO (answer engine optimization), and LLM SEO. They all mean the same thing.",
    ],
  },
  {
    h: "How it differs from normal SEO",
    p: [
      "Classic SEO fights for a spot in a list of ten blue links. With AI, the assistant writes one answer and names a handful of companies. There is far less room, so being left out costs more.",
      "The two overlap. Strong websites, good reviews, and trusted links help in both. The difference is that AI answers lean heavily on third party sources: review sites, directories, comparison articles, news, and forums. What those places say about you matters as much as what you say about yourself.",
    ],
  },
  {
    h: "Why the sources matter most",
    p: [
      "When an assistant recommends a company, it is drawing on pages it has read or found. If the top companies in your market are all listed on the same directories and praised in the same articles, that is a map of where you need to be too.",
      "That is what the audit does. It asks the assistants your customers' questions, notes who is named, and lists the websites behind each name, so you can see the pattern instead of guessing.",
    ],
  },
  {
    h: "What you can do about it",
    p: [
      "Make your own site easy to understand: clear service pages, a page for each location, FAQs that answer real questions, and structured data such as sameAs and FAQ schema. Our checklist covers each one.",
      "Then earn presence where AI looks: collect reviews, get listed in the directories your competitors use, and publish helpful content that others reference. Keep your details consistent everywhere.",
    ],
  },
  {
    h: "What no one can promise",
    p: [
      "AI answers change from day to day and are not controlled by any company. No one can guarantee a recommendation. What you can do is measure how often you appear, learn what the winners have in common, and track whether your changes help. Paid plans re-run the audit on a schedule and alert you when things move.",
    ],
  },
];

export default function WhatIsAiSeoPage() {
  return (
    <PageShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "What is AI SEO?",
          mainEntityOfPage: `${SITE_URL}/ai-seo/what-is-ai-seo`,
          publisher: { "@id": `${SITE_URL}/#organization` },
        }}
      />
      <AiSeoNav />
      <PageHero
        eyebrow="Guide"
        title="What is AI SEO?"
        intro="A plain guide to getting recommended when customers ask AI instead of searching."
      />
      <article className="mx-auto w-full max-w-3xl px-6 pb-14 sm:px-10">
        {SECTIONS.map((s) => (
          <section key={s.h} className="mt-8 first:mt-0">
            <h2 className="font-display text-2xl font-semibold text-navy-800">{s.h}</h2>
            {s.p.map((t) => (
              <p key={t} className="mt-3 text-[15.5px] leading-relaxed text-navy-500">
                {t}
              </p>
            ))}
          </section>
        ))}
      </article>
      <CtaBand
        title="Want to see where you stand?"
        body="Enter your details and reveal your AI visibility audit."
        ctaHref="/ai-seo/audit"
        ctaLabel="Start your audit"
        linkHref="/ai-seo/what-is-ai-seo"
        linkLabel="What is AI SEO?"
      />
    </PageShell>
  );
}
