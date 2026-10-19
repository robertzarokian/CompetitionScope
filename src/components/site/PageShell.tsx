import type { ReactNode } from "react";
import { LogoWatermark } from "@/components/decor/LogoWatermark";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <LogoWatermark className="-right-16 -top-20 hidden lg:block" size={340} />
      <SiteHeader />
      <main className="relative flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
