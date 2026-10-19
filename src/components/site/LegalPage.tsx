import type { ReactNode } from "react";
import { PageShell } from "./PageShell";
import { PageHero } from "./SectionHeading";

export interface LegalSection {
  heading: string;
  body: ReactNode[];
}

// Shared layout for the Privacy Policy, Terms of Service, and Refund Policy.
export function LegalPage({
  eyebrow,
  title,
  intro,
  updated,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <PageShell>
      <PageHero eyebrow={eyebrow} title={title} intro={intro} />
      <article className="mx-auto w-full max-w-3xl px-6 pb-16 sm:px-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-navy-400">Last updated {updated}</p>
        {sections.map((s) => (
          <section key={s.heading} className="mt-8">
            <h2 className="font-display text-xl font-semibold text-navy-800">{s.heading}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="mt-3 text-[15px] leading-relaxed text-navy-500">
                {p}
              </p>
            ))}
          </section>
        ))}
      </article>
    </PageShell>
  );
}
