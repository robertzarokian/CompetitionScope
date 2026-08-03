import Link from "next/link";
import { Lock } from "lucide-react";

export function LockedSection({
  reportId,
  children,
  label = "Unlock to see this",
}: {
  reportId: string;
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <div className="relative overflow-hidden">
      <div className="blur-lock">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-navy-950/5 via-navy-950/80 to-navy-950/95 px-6 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-brass-400/40 bg-brass-400/10">
          <Lock size={18} className="text-brass-300" />
        </div>
        <p className="text-sm font-medium text-cream-50">{label}</p>
        <Link
          href={`/checkout/${reportId}`}
          className="inline-flex items-center gap-2 rounded-sm border border-brass-300 bg-brass-400 px-5 py-2.5 font-medium uppercase tracking-[0.04em] text-navy-950 text-xs shadow-[0_4px_0_0_rgba(90,66,32,0.9)] transition hover:bg-brass-300"
        >
          Unlock Full Report
        </Link>
      </div>
    </div>
  );
}
