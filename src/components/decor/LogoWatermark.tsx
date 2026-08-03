import { LogoMark } from "@/components/Logo";

export function LogoWatermark({
  className = "",
  size = 280,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={`pointer-events-none absolute opacity-[0.05] ${className}`}
      aria-hidden="true"
    >
      <LogoMark size={size} />
    </div>
  );
}
