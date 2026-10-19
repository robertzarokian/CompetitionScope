import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { AdminLogout } from "./AdminClient";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Accounts" },
  { href: "/admin/reports", label: "Responses" },
  { href: "/admin/leads", label: "Discount signups" },
  { href: "/admin/admins", label: "Admins" },
  { href: "/admin/activity", label: "Activity" },
];

export function AdminShell({ username, title, children }: { username: string; title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-navy-300/60 bg-cream-50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="border border-brass-500/40 bg-navy-800 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-brass-300">
              Admin
            </span>
          </div>
          <nav className="flex flex-wrap items-center gap-5 font-mono text-[11px] uppercase tracking-[0.12em]">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-navy-600 hover:text-brass-600">
                {l.label}
              </Link>
            ))}
            <span className="text-navy-400">{username}</span>
            <AdminLogout />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="font-display text-3xl font-semibold text-navy-800">{title}</h1>
        <div className="mt-6 space-y-6">{children}</div>
      </main>
    </div>
  );
}

export function Card({ title, children, right }: { title?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="paper-panel border border-navy-600">
      {title && (
        <div className="flex items-center justify-between border-b border-navy-600 px-5 py-2.5">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-navy-500">{title}</h2>
          {right}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export const fmtDate = (d: Date | null | undefined) =>
  d ? d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "n/a";
