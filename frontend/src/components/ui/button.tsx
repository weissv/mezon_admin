// src/components/ui/button.tsx
import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

export function Button({ className, variant = "default", size = "md", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "ghost" | "secondary" | "destructive"; size?: "sm" | "md" | "lg" }) {
  const base = "inline-flex items-center justify-center rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    default: "bg-[var(--mezon-accent)] text-white shadow-mezon hover:bg-[var(--mezon-accent-dark)]",
    outline: "border-2 border-[var(--mezon-accent)] text-[var(--mezon-accent)] hover:bg-[var(--mezon-accent)] hover:text-white",
    ghost: "text-[var(--mezon-accent)] hover:bg-[rgba(160,74,132,0.08)]",
    secondary: "bg-[var(--mezon-sand)] text-[var(--mezon-dark)] hover:bg-[#f8c387]",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  } as const;
  const sizes = {
    sm: "text-sm px-4 py-2",
    md: "px-6 py-3",
    lg: "px-8 py-4 text-lg",
  } as const;
  return <button className={clsx(base, variants[variant], sizes[size], className)} {...props} />;
}
