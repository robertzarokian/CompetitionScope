"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AI_SEO_LINKS } from "@/lib/aiseo";

// Sub navigation shown at the top of every page in the AI SEO section.
export function AiSeoNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="AI SEO section"
      className="mx-auto mb-6 flex w-full max-w-6xl flex-wrap items-center gap-x-1 gap-y-2 px-6 sm:px-10"
    >
      <span className="mr-3 font-mono text-[11px] uppercase tracking-[0.18em] text-brass-500">AI SEO</span>
      {AI_SEO_LINKS.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors ${
              active
                ? "border-navy-800 bg-navy-800 text-brass-300"
                : "border-navy-300/60 text-navy-500 hover:border-navy-600 hover:text-navy-800"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
