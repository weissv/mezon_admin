// src/components/ui/button.tsx
import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "default" | "outline" | "ghost" | "secondary" | "destructive" | "glass";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const base = [
  "relative inline-flex items-center justify-center gap-2 font-medium select-none",
  "transition-all duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] rounded-lg outline-none",
  "disabled:opacity-40 disabled:pointer-events-none",
  "active:scale-[0.97] touch-manipulation",
  "tracking-[-0.01em] leading-none cursor-pointer",
].join(" ");

const variants: Record<ButtonVariant, string> = {
  default: [
    "bg-gradient-to-b from-[#0084FF] to-[#007AFF] text-white",
    "shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.25)]",
    "hover:from-[#007AEE] hover:to-[#006DE0] hover:shadow-[0_2px_8px_rgba(0,122,255,0.35)]",
    "active:from-[#0064D1] active:to-[#0058B8]",
    "focus-visible:ring-2 focus-visible:ring-macos-blue/50 focus-visible:ring-offset-1",
  ].join(" "),
  outline: [
    "bg-surface-primary/80 backdrop-blur-md text-text-primary",
    "border border-separator/80",
    "shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)]",
    "hover:bg-surface-primary hover:border-text-tertiary/40 hover:shadow-subtle",
    "active:bg-fill-quaternary",
    "focus-visible:ring-2 focus-visible:ring-macos-blue/50",
  ].join(" "),
  glass: [
    "bg-white/40 backdrop-blur-xl text-text-primary",
    "border border-white/60",
    "shadow-[0_4px_12px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.9)]",
    "hover:bg-white/60 hover:border-white/80",
    "active:bg-white/30",
    "focus-visible:ring-2 focus-visible:ring-macos-blue/50",
  ].join(" "),
  ghost: [
    "text-macos-blue bg-transparent",
    "hover:bg-macos-blue/10 hover:text-macos-blue-hover",
    "active:bg-macos-blue/15",
    "focus-visible:ring-2 focus-visible:ring-macos-blue/50",
  ].join(" "),
  secondary: [
    "bg-fill-tertiary text-text-primary",
    "hover:bg-fill-secondary hover:text-text-primary",
    "active:bg-fill-primary",
    "focus-visible:ring-2 focus-visible:ring-macos-blue/50",
  ].join(" "),
  destructive: [
    "bg-gradient-to-b from-[#FF453A] to-[#FF3B30] text-white",
    "shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.25)]",
    "hover:from-[#E8342A] hover:to-[#D92C23] hover:shadow-[0_2px_8px_rgba(255,59,48,0.35)]",
    "active:from-[#C5221F] active:to-[#B41B18]",
    "focus-visible:ring-2 focus-visible:ring-macos-red/50",
  ].join(" "),
};

const sizes: Record<ButtonSize, string> = {
  sm: "text-[12px] px-2.5 py-1 min-h-[28px] rounded-md",
  md: "text-[13px] px-3.5 py-1.5 min-h-[32px] rounded-lg",
  lg: "text-[14px] px-5 py-2.5 min-h-[40px] rounded-xl font-semibold",
  icon: "h-8 w-8 px-0 rounded-lg flex items-center justify-center",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", isLoading = false, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

