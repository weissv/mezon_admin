// src/components/ui/Badge.tsx
import { HTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "purple" | "neutral" | "outline" | "glass";

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const base = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-[-0.01em] leading-normal transition-all duration-150";

const variants: Record<BadgeVariant, string> = {
  default: "bg-tint-blue text-macos-blue border border-macos-blue/15 shadow-[0_1px_2px_rgba(0,122,255,0.05)]",
  success: "bg-tint-green text-[#1B7A3D] border border-macos-green/20 shadow-[0_1px_2px_rgba(52,199,89,0.05)]",
  warning: "bg-tint-orange text-[#B25E00] border border-macos-orange/20 shadow-[0_1px_2px_rgba(255,149,0,0.05)]",
  danger:  "bg-tint-red text-macos-red border border-macos-red/20 shadow-[0_1px_2px_rgba(255,59,48,0.05)]",
  purple:  "bg-tint-purple text-macos-purple border border-macos-purple/20 shadow-[0_1px_2px_rgba(175,82,222,0.05)]",
  neutral: "bg-fill-quaternary text-text-secondary border border-separator/50",
  outline: "border border-separator text-text-primary bg-surface-primary/80 backdrop-blur-md shadow-subtle",
  glass:   "bg-white/60 backdrop-blur-md text-text-primary border border-white/80 shadow-subtle",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-macos-blue shadow-[0_0_0_2px_rgba(0,122,255,0.2)]",
  success: "bg-macos-green shadow-[0_0_0_2px_rgba(52,199,89,0.2)]",
  warning: "bg-macos-orange shadow-[0_0_0_2px_rgba(255,149,0,0.2)]",
  danger:  "bg-macos-red shadow-[0_0_0_2px_rgba(255,59,48,0.2)]",
  purple:  "bg-macos-purple shadow-[0_0_0_2px_rgba(175,82,222,0.2)]",
  neutral: "bg-gray-4 shadow-[0_0_0_2px_rgba(142,142,147,0.2)]",
  outline: "bg-text-tertiary",
  glass:   "bg-macos-blue",
};

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", dot = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(base, variants[variant], className)}
        {...props}
      >
        {dot && <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} />}
        {children}
      </div>
    );
  }
);
Badge.displayName = "Badge";

