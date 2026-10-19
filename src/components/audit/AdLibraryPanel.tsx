import { ExternalLink } from "lucide-react";
import { Panel } from "@/components/decor/Panel";
import { adLibraryLinks } from "@/lib/audit/ads";

export function AdLibraryPanel({ companies }: { companies: { name: string; domain: string | null }[] }) {
  return (
    <Panel eyebrow="Advertising" meta="Public ad libraries">
      <p className="px-5 pt-4 text-[13.5px] leading-relaxed text-navy-500">
        No tool can reliably estimate how much a company spends on ads. The platforms do publish every active
        ad, so you can see which platforms a company advertises on. These links open each company&rsquo;s search
        in the public libraries.
      </p>
      <ul className="mt-3 divide-y divide-navy-300/60">
        {companies.map((c) => {
          const links = adLibraryLinks(c.name, c.domain);
          return (
            <li key={c.name} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <span className="font-display text-sm font-semibold text-navy-800">{c.name}</span>
              <span className="flex flex-wrap gap-4 font-mono text-[11px] uppercase tracking-[0.1em]">
                {[
                  ["Meta (Facebook, Instagram)", links.meta],
                  ["Google and YouTube", links.google],
                  ["LinkedIn", links.linkedin],
                ].map(([label, href]) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-brass-600 underline-offset-4 hover:underline"
                  >
                    {label}
                    <ExternalLink size={11} />
                  </a>
                ))}
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
