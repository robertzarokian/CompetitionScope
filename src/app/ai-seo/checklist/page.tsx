import type { Metadata } from "next";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/SectionHeading";
import { CtaBand } from "@/components/site/CtaBand";
import { AiSeoNav } from "@/components/aiseo/AiSeoNav";
import { AI_SEO_CHECKS } from "@/lib/aiseo";

export const metadata: Metadata = {
  title: "The 12 Website Checks for AI SEO and Search Visibility",
  description:
    "What each of the 12 checks in the CompetitionScope audit measures, why it matters for AI recommendations and search, and how to fix it.",
  alternates: { canonical: "/ai-seo/checklist" },
};

export default function ChecklistPage() {
  return (
    <PageShell>
      <AiSeoNav />
      <PageHero
        eyebrow="The checklist"
        title="The 12 checks, and how to fix each one"
        intro="Every audit looks at your website and your competitors against these points. Here is what each means and what to do about it, whether or not you run the audit."
      />
      <section className="mx-auto w-full max-w-4xl px-6 pb-14 sm:px-10">
        <ol className="space-y-4">
          {AI_SEO_CHECKS.map((c) => (
            <li key={c.n} className="paper-panel border border-navy-600 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-navy-800 font-mono text-xs text-brass-300">{c.n}</span>
                <h2 className="font-display text-lg font-semibold text-navy-800">{c.title}</h2>
              </div>
              <p className="mt-3 text-[14.5px] leading-relaxed text-navy-500">
                <span className="font-semibold text-navy-800">Why it matters: </span>
                {c.why}
              </p>
              <p className="mt-2 text-[14.5px] leading-relaxed text-navy-500">
                <span className="font-semibold text-navy-800">What to do: </span>
                {c.fix}
              </p>
            </li>
          ))}
        </ol>
      </section>
      <CtaBand
        title="See how your site scores."
        body="Run the free audit and get all 12 checks for your own website."
        ctaHref="/ai-seo/audit"
        ctaLabel="Run the free audit"
        linkHref="/ai-seo/what-is-ai-seo"
        linkLabel="What is AI SEO?"
      />
    </PageShell>
  );
}
