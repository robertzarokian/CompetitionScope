import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm font-medium uppercase tracking-[0.05em] transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-100";

const variants: Record<Variant, string> = {
  primary:
    "bg-brass-400 text-navy-950 border border-brass-300 hover:bg-brass-300 shadow-[0_4px_0_0_rgba(90,66,32,0.9)] hover:shadow-[0_2px_0_0_rgba(90,66,32,0.9)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]",
  secondary:
    "bg-cream-50 text-navy-800 border border-navy-600 hover:border-brass-500 hover:bg-navy-800 hover:text-cream-50",
  ghost:
    "text-navy-500 hover:text-navy-800 hover:bg-navy-900/5 normal-case tracking-normal",
};

const sizes = {
  sm: "text-xs px-4 py-2",
  md: "text-[13px] px-6 py-3",
  lg: "text-sm px-8 py-3.5",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: keyof typeof sizes;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
