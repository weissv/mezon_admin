// src/components/ui/button.tsx
import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

export type ButtonVariant = "default" | "outline" | "ghost" | "secondary" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const base = [
  "inline-flex items-center justify-center gap-2 font-medium",
  "transition-all duration-150 ease-out",
  "disabled:opacity-40 disabled:cursor-not-allowed",
  "active:scale-[0.985] touch-manipulation",
  "tracking-[-0.01em] leading-none",
  "focus-visible:outline-none",
].join(" ");

const variants: Record<ButtonVariant, string> = {
  default: [
    "bg-[#007AFF] text-white rounded-[8px]",
    "shadow-[0_0.5px_1px_rgba(0,0,0,0.12),0_0_0_0.5px_rgba(0,122,255,0.12)]",
    "hover:bg-[#0A84FF] hover:shadow-[0_1px_3px_rgba(0,0,0,0.15)]",
    "active:bg-[#0066D6]",
    "focus-visible:ring-4 focus-visible:ring-[rgba(0,122,255,0.20)]",
  ].join(" "),
  outline: [
    "bg-[rgba(255,255,255,0.78)] text-[#1D1D1F] rounded-[8px]",
    "border border-[rgba(0,0,0,0.10)]",
    "shadow-[0_0_0_0.5px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.05)]",
    "backdrop-blur-sm",
    "hover:bg-white hover:border-[rgba(0,122,255,0.18)]",
    "focus-visible:ring-4 focus-visible:ring-[rgba(0,122,255,0.14)]",
  ].join(" "),
  ghost: [
    "text-[#007AFF] rounded-[8px]",
    "hover:bg-[rgba(0,122,255,0.08)]",
    "focus-visible:ring-4 focus-visible:ring-[rgba(0,122,255,0.14)]",
  ].join(" "),
  secondary: [
    "bg-[rgba(0,0,0,0.05)] text-[#1D1D1F] rounded-[8px]",
    "hover:bg-[rgba(0,0,0,0.08)]",
    "focus-visible:ring-4 focus-visible:ring-[rgba(0,122,255,0.14)]",
  ].join(" "),
  destructive: [
    "bg-[#FF3B30] text-white rounded-[8px]",
    "shadow-[0_0.5px_1px_rgba(0,0,0,0.12)]",
    "hover:bg-[#E6352B]",
    "active:bg-[#C92A21]",
    "focus-visible:ring-4 focus-visible:ring-[rgba(255,59,48,0.20)]",
  ].join(" "),
};

const sizes: Record<ButtonSize, string> = {
  sm: "text-[12px] px-3 py-1.5 min-h-[30px]",
  md: "text-[13px] px-4 py-2 min-h-[36px]",
  lg: "text-[14px] px-5 py-2.5 min-h-[42px]",
};

export function Button({ className, variant = "default", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
