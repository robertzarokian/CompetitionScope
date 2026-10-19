import { Plus } from "lucide-react";
import type { FaqItem } from "@/lib/site";

export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-navy-300/60 border-y border-navy-300/60">
      {items.map((item) => (
        <details key={item.id} className="group py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base font-semibold text-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500/60 [&::-webkit-details-marker]:hidden">
            {item.question}
            <Plus
              size={18}
              className="shrink-0 text-brass-500 transition-transform duration-200 group-open:rotate-45"
            />
          </summary>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-navy-500">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
