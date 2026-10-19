import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LINKEDIN_URL, NAV_LINKS } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-navy-300/60 py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 sm:px-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo tagline />
          <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-navy-500">
            Competitor research that shows you who you are really up against, and
            what to do about it.
          </p>
        </div>

        <nav aria-label="Footer">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brass-500">
            Explore
          </p>
          <ul className="mt-3 space-y-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-navy-500 transition-colors hover:text-navy-800"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brass-500">
            Get started
          </p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link
                href="/onboarding/1"
                className="text-sm text-navy-500 transition-colors hover:text-navy-800"
              >
                Begin your scope
              </Link>
            </li>
            <li>
              <Link
                href="/sample-report"
                className="text-sm text-navy-500 transition-colors hover:text-navy-800"
              >
                See a sample report
              </Link>
            </li>
            <li>
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer me"
                className="text-sm text-navy-500 transition-colors hover:text-navy-800"
              >
                LinkedIn
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-8 w-full max-w-6xl border-t border-navy-300/60 px-6 pt-5 sm:px-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-navy-400">
          © {new Date().getFullYear()} CompetitionScope. See the competition clearly.
        </p>
        <p className="mt-2">
          <Link
            href="/admin/login"
            className="font-mono text-[11px] uppercase tracking-[0.1em] text-navy-300 transition-colors hover:text-navy-600"
          >
            Admin login
          </Link>
        </p>
      </div>
    </footer>
  );
}
