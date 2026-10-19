import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { CornerFrame } from "@/components/decor/CornerFrame";
import { REPORT_PRICE_LABEL } from "@/lib/pricing";

export function CtaBand({
  title = "Find out who you are really up against.",
  body = "Answer 10 short questions and preview your report for free.",
}: {
  title?: string;
  body?: string;
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
            <ButtonLink href="/onboarding/1" size="lg">
              Begin your scope
              <ArrowRight size={16} />
            </ButtonLink>
            <Link
              href="/sample-report"
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream-300 underline-offset-4 transition-colors hover:text-brass-300 hover:underline"
            >
              See a sample report
            </Link>
          </div>
          <p className="mt-5 font-mono text-[11px] uppercase tracking-wide text-cream-300">
            Free preview. {REPORT_PRICE_LABEL} one time to unlock. No subscription.
          </p>
        </div>
      </div>
    </section>
  );
}
