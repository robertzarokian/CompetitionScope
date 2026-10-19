"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ButtonLink";
import { NAV_LINKS } from "@/lib/site";

const isActive = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { user: unknown }) => setSignedIn(!!d.user))
      .catch(() => undefined);
  }, [pathname]);

  return (
    <header className="relative z-20 mx-auto w-full max-w-6xl px-6 py-5 sm:px-10">
      <div className="flex items-center justify-between gap-6">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-7 whitespace-nowrap lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(pathname, link.href) ? "page" : undefined}
              className={`font-mono text-[11px] uppercase tracking-[0.14em] transition-colors hover:text-brass-600 ${
                isActive(pathname, link.href) ? "text-brass-600" : "text-navy-500"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={signedIn ? "/dashboard" : "/auth?next=/dashboard"}
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy-500 transition-colors hover:text-brass-600"
          >
            {signedIn ? "Dashboard" : "Log in"}
          </Link>
          <ButtonLink href="/onboarding/1" size="sm">
            Begin your scope
          </ButtonLink>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex h-10 w-10 items-center justify-center border border-navy-600 bg-cream-50 text-navy-800 lg:hidden"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="paper-panel mt-4 flex flex-col gap-1 p-4 lg:hidden"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(pathname, link.href) ? "page" : undefined}
              className="py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-navy-700"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={signedIn ? "/dashboard" : "/auth?next=/dashboard"}
            onClick={() => setOpen(false)}
            className="py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-navy-700"
          >
            {signedIn ? "Dashboard" : "Log in"}
          </Link>
          <ButtonLink
            href="/onboarding/1"
            size="md"
            className="mt-2"
            onClick={() => setOpen(false)}
          >
            Begin your scope
          </ButtonLink>
        </nav>
      )}
    </header>
  );
}
