import Link from "next/link";
import { Telescope } from "lucide-react";

export function LogoMark({ size = 20 }: { size?: number }) {
  const box = size + 22;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full bg-navy-800"
      style={{ width: box, height: box }}
    >
      <svg
        viewBox="0 0 44 44"
        width={box}
        height={box}
        className="absolute inset-0"
        aria-hidden="true"
      >
        <circle cx="22" cy="22" r="20.5" fill="none" stroke="#7d5b2a" strokeWidth="1" />
        <circle cx="22" cy="22" r="17.5" fill="none" stroke="#cc9f52" strokeWidth="1.25" />
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const long = i % 3 === 0;
          const r1 = long ? 14.5 : 15.5;
          const r2 = 17.5;
          // Rounded to 3 decimals: raw Math.sin/cos output can differ in the
          // last bit between the server and client JS engines, which fails
          // React's hydration string comparison on these SVG attributes.
          const round = (n: number) => Math.round(n * 1000) / 1000;
          const x1 = round(22 + r1 * Math.sin(angle));
          const y1 = round(22 - r1 * Math.cos(angle));
          const x2 = round(22 + r2 * Math.sin(angle));
          const y2 = round(22 - r2 * Math.cos(angle));
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#cc9f52"
              strokeWidth={long ? 1.4 : 0.9}
              opacity={long ? 0.95 : 0.6}
            />
          );
        })}
      </svg>
      <Telescope
        size={size}
        strokeWidth={1.9}
        className="relative text-brass-300"
      />
    </span>
  );
}

export function Logo({
  className = "",
  tagline = false,
}: {
  className?: string;
  tagline?: boolean;
}) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-3 ${className}`}
    >
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-semibold tracking-tight text-navy-800">
          Competition<span className="brass-underline">Scope</span>
        </span>
        {tagline && (
          <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-navy-400">
            Est. for the far-sighted
          </span>
        )}
      </span>
    </Link>
  );
}
