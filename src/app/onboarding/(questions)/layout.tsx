import { Logo } from "@/components/Logo";
import { LogoWatermark } from "@/components/decor/LogoWatermark";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <LogoWatermark className="-right-24 -top-24" size={320} />
      <LogoWatermark className="-bottom-32 -left-24" size={280} />

      <header className="relative flex items-center justify-between px-6 py-6 sm:px-10">
        <Logo />
      </header>
      <main className="relative flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-xl">{children}</div>
      </main>
      <footer className="relative pb-8 text-center">
        <p className="rule-brass mx-auto w-fit font-mono text-[10px] uppercase tracking-[0.2em] text-navy-300">
          Est. for the far-sighted
        </p>
      </footer>
    </div>
  );
}
