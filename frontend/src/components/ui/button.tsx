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
  "macos-transition",
  "disabled:opacity-40 disabled:cursor-not-allowed",
  "active:scale-[0.97] touch-manipulation",
  "tracking-[-0.01em] leading-none",
  "focus-visible:outline-none",
].join(" ");

const variants: Record<ButtonVariant, string> = {
  default: [
    "bg-[var(--color-blue)] text-white rounded-[8px]",
    "shadow-[var(--shadow-subtle)]",
    "hover:bg-[var(--color-blue-hover)]",
    "active:bg-[var(--color-blue-active)]",
    "focus-visible:shadow-[var(--ring-accent)]",
  ].join(" "),
  outline: [
    "bg-[var(--surface-primary)] text-[var(--text-primary)] rounded-[8px]",
    "border border-[var(--separator)]",
    "shadow-[var(--shadow-subtle)]",
    "hover:bg-[var(--fill-quaternary)] hover:border-[rgba(0,0,0,0.15)]",
    "focus-visible:shadow-[var(--ring-accent)]",
  ].join(" "),
  ghost: [
    "text-[var(--color-blue)] rounded-[8px]",
    "hover:bg-[var(--fill-quaternary)]",
    "focus-visible:shadow-[var(--ring-accent)]",
  ].join(" "),
  secondary: [
    "bg-[var(--fill-tertiary)] text-[var(--text-primary)] rounded-[8px]",
    "hover:bg-[var(--fill-secondary)]",
    "focus-visible:shadow-[var(--ring-accent)]",
  ].join(" "),
  destructive: [
    "bg-[var(--color-red)] text-white rounded-[8px]",
    "shadow-[var(--shadow-subtle)]",
    "hover:bg-[var(--color-red-hover)]",
    "active:bg-[var(--color-red-active)]",
    "focus-visible:shadow-[var(--ring-danger)]",
  ].join(" "),
};

const sizes: Record<ButtonSize, string> = {
  sm: "text-[12px] px-2.5 py-1.5 min-h-[28px]",
  md: "text-[13px] px-3.5 py-2 min-h-[32px]",
  lg: "text-[14px] px-5 py-2.5 min-h-[38px]",
};

export function Button({ className, variant = "default", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
