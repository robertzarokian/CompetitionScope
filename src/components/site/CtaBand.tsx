import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { CornerFrame } from "@/components/decor/CornerFrame";
import { STARTING_PRICE_LABEL } from "@/lib/plans";

export function CtaBand({
  title = "Find out who you are really up against.",
  body = "Answer 10 short questions and preview your report for free.",
  ctaHref = "/onboarding/1",
  ctaLabel = "Begin your scope",
  linkHref = "/sample-report",
  linkLabel = "See a sample report",
}: {
  title?: string;
  body?: string;
  ctaHref?: string;
  ctaLabel?: string;
  linkHref?: string;
  linkLabel?: string;
}) {
  return (
    <section className="relative px-6 pb-16 pt-6 sm:px-10">
      <div className="instrument-panel card-glow relative mx-auto max-w-6xl overflow-hidden p-8 text-center sm:p-12">
        <div className="blueprint-grid absolute inset-0 opacity-60" aria-hidden="true" />
        <CornerFrame size={14} />
        <div className="relative">
          <h2 className="font-display text-2xl font-semibold text-cream-50 sm:text-3xl">
            {title}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-cream-200 sm:text-base">
            {body}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
            <ButtonLink href={ctaHref} size="lg">
              {ctaLabel}
              <ArrowRight size={16} />
            </ButtonLink>
            <Link
              href={linkHref}
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream-300 underline-offset-4 transition-colors hover:text-brass-300 hover:underline"
            >
              {linkLabel}
            </Link>
          </div>
          <p className="mt-5 font-mono text-[11px] uppercase tracking-wide text-cream-300">
            Free preview. Plans from {STARTING_PRICE_LABEL}/month. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
