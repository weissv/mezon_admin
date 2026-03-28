// src/components/ui/button.tsx
import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

export function Button({ className, variant = "default", size = "md", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "ghost" | "secondary" | "destructive"; size?: "sm" | "md" | "lg" }) {
  const base = "inline-flex items-center justify-center rounded-[8px] font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] touch-manipulation tracking-[-0.01em]";
  const variants = {
    default: "bg-[#007AFF] text-white shadow-[0_0.5px_1px_rgba(0,0,0,0.12)] hover:bg-[#0071EE] active:bg-[#005EC4]",
    outline: "border border-[rgba(0,0,0,0.12)] bg-white/80 backdrop-blur-sm text-[var(--mezon-dark)] shadow-[0_0.5px_1px_rgba(0,0,0,0.06)] hover:bg-[rgba(0,0,0,0.04)]",
    ghost: "text-[#007AFF] hover:bg-[rgba(0,122,255,0.08)]",
    secondary: "bg-[rgba(0,0,0,0.05)] text-[var(--mezon-dark)] hover:bg-[rgba(0,0,0,0.08)]",
    destructive: "bg-[#FF3B30] text-white shadow-[0_0.5px_1px_rgba(0,0,0,0.12)] hover:bg-[#E6352B]",
  } as const;
  const sizes = {
    sm: "text-xs px-2.5 py-1.5 min-h-[28px]",
    md: "text-[13px] px-3.5 py-[7px] min-h-[34px]",
    lg: "text-sm px-5 py-2.5 min-h-[40px]",
  } as const;
  return <button className={clsx(base, variants[variant], sizes[size], className)} {...props} />;
}
