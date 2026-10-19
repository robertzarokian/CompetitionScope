import type { Metadata } from "next";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/SectionHeading";
import { FaqList } from "@/components/site/FaqList";
import { CtaBand } from "@/components/site/CtaBand";
import { JsonLd } from "@/components/site/JsonLd";
import { FAQS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers about how CompetitionScope finds your competitors, how long it takes, what is free, what the full report includes, and how much it costs.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <PageShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }}
      />
      <PageHero
        eyebrow="FAQ"
        title="Frequently asked questions"
        intro="Everything you might want to know before you start. If something is missing, run a free preview and see for yourself."
      />
      <section className="mx-auto w-full max-w-3xl px-6 pb-14 sm:px-10">
        <FaqList items={FAQS} />
      </section>
      <CtaBand />
    </PageShell>
  );
}
