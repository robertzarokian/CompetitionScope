import type { Metadata } from "next";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/SectionHeading";
import { AuditTool } from "@/components/audit/AuditTool";
import { AiSeoNav } from "@/components/aiseo/AiSeoNav";
import { JsonLd } from "@/components/site/JsonLd";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI Visibility Audit: Does AI Recommend Your Business?",
  description:
    "Find out whether AI assistants recommend your company, which competitors they name instead, and which websites those answers rely on. Includes a free website SEO check.",
  alternates: { canonical: "/ai-seo/audit" },
};

export default function AiSeoAuditPage() {
  return (
    <PageShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "CompetitionScope AI Visibility Audit",
          url: `${SITE_URL}/ai-seo/audit`,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Any",
        }}
      />
      <AiSeoNav />
      <PageHero
        eyebrow="AI visibility audit"
        title="Does AI recommend your business?"
        intro="People now ask AI assistants for recommendations instead of searching. This audit asks them the questions your customers ask, shows who gets recommended instead of you, and traces the websites those answers rely on."
      />
      <section className="mx-auto w-full max-w-4xl px-6 pb-16 sm:px-10">
        <AuditTool />
      </section>
    </PageShell>
  );
}
