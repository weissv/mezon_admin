// src/components/ui/button.tsx
import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

export function Button({ className, variant = "default", size = "md", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "ghost" | "secondary" | "destructive"; size?: "sm" | "md" | "lg" }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-panel border border-transparent font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.985] touch-manipulation tracking-[-0.01em] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(10,132,255,0.14)]";
  const variants = {
    default: "bg-macos-blue text-white shadow-macos-btn hover:bg-[#0A84FF] hover:shadow-macos-card active:bg-[#0066D6]",
    outline: "border-black/10 bg-[rgba(255,255,255,0.78)] text-[var(--mezon-dark)] shadow-macos-input backdrop-blur-sm hover:bg-white hover:border-[rgba(10,132,255,0.18)]",
    ghost: "text-macos-blue hover:bg-[rgba(10,132,255,0.08)] hover:text-[#0066D6]",
    secondary: "bg-[rgba(15,23,42,0.05)] text-[var(--mezon-dark)] shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.6)] hover:bg-[rgba(15,23,42,0.08)]",
    destructive: "bg-macos-red text-white shadow-macos-btn hover:bg-[#E6352B] active:bg-[#C92A21]",
  } as const;
  const sizes = {
    sm: "text-xs px-3 py-1.5 min-h-[30px]",
    md: "text-[13px] px-4 py-2 min-h-[36px]",
    lg: "text-sm px-5 py-2.5 min-h-[42px]",
  } as const;
  return <button className={clsx(base, variants[variant], sizes[size], className)} {...props} />;
}
