import type { ReactNode } from "react";
import { CornerFrame } from "./CornerFrame";

export function Panel({
  eyebrow,
  meta,
  className = "",
  children,
  frame = true,
}: {
  eyebrow?: string;
  meta?: string;
  className?: string;
  children: ReactNode;
  frame?: boolean;
}) {
  return (
    <div className={`paper-panel relative border border-navy-600 ${className}`}>
      {frame && <CornerFrame size={12} />}
      {(eyebrow || meta) && (
        <div className="relative flex items-center justify-between border-b border-navy-600 px-5 py-2.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy-400">
            {eyebrow}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass-400">
            {meta}
          </span>
        </div>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
