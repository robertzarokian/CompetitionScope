import Link from "next/link";
import {
  ArrowRight,
  Target,
  Megaphone,
  TrendingUp,
  FileDown,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/Button";
import { TelescopeSchematic } from "@/components/landing/TelescopeSchematic";
import { LogoWatermark } from "@/components/decor/LogoWatermark";

const PROVIDES = [
  {
    title: "Competitor rankings",
    description: "See who's closest to you and who's winning, ranked and scored.",
    Icon: Target,
  },
  {
    title: "Sales & channel breakdown",
    description: "Exactly how they sell, price, and where they advertise.",
    Icon: Megaphone,
  },
  {
    title: "Shared success factors",
    description: "The specific, repeatable habits your top competitors all share.",
    Icon: TrendingUp,
  },
  {
    title: "Prioritized roadmap + PDF",
    description: "A step-by-step plan, packaged as a branded report to keep.",
    Icon: FileDown,
  },
];

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <LogoWatermark className="-right-16 -top-20 hidden lg:block" size={340} />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
        <Logo />
      </header>

      <main className="relative flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 pb-12 pt-4 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <div>
            <span className="inline-flex items-center gap-2 border border-brass-500/40 bg-navy-800 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-brass-300">
              <span className="h-1.5 w-1.5 scope-pulse rounded-full bg-brass-400" />
              Welcome aboard
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
              Point CompetitionScope at your closest rivals and we&rsquo;ll do
              the deep, unglamorous work of finding them — their strategy,
              their edge, their ad spend — and hand you a specific plan to
              beat them. Just a few questions to start.
            </p>
            <div className="mt-7">
              <Link href="/onboarding/1">
                <Button size="lg">
                  Begin your scope
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </div>
          <TelescopeSchematic />
        </section>

        <section className="relative border-t border-navy-300/60 py-12">
          <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
            <p className="rule-brass mb-6 font-mono text-[11px] uppercase tracking-[0.18em] text-brass-500">
              What you&rsquo;ll get
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PROVIDES.map((f) => (
                <div key={f.title} className="paper-panel border border-navy-600 p-5">
                  <f.Icon size={18} className="text-brass-500" strokeWidth={1.75} />
                  <h3 className="mt-3 font-display text-base font-semibold text-navy-800">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-navy-500">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-navy-300/60 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 text-center sm:flex-row sm:px-10 sm:text-left">
          <Logo />
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-navy-400">
            © {new Date().getFullYear()} CompetitionScope — See the competition clearly
          </p>
        </div>
      </footer>
    </div>
  );
}
