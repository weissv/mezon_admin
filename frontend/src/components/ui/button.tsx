// src/components/ui/button.tsx
import { ButtonHTMLAttributes} from"react";
import clsx from"clsx";

export type ButtonVariant ="default"|"outline"|"ghost"|"secondary"|"destructive";
export type ButtonSize ="sm"|"md"|"lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
 variant?: ButtonVariant;
 size?: ButtonSize;
}

const base = [
"inline-flex items-center justify-center gap-2 font-medium",
"macos-macos-transition",
"disabled:opacity-40 disabled:cursor-not-allowed",
"active:scale-[0.985] touch-manipulation",
"tracking-[-0.01em] leading-none",
"focus-visible:outline-none",
].join("");

const variants: Record<ButtonVariant, string> = {
 default: [
"bg-[var(--color-blue)] text-white rounded-[6px]",
"shadow-[0_0.5px_1px_rgba(0,0,0,0.12)] border border-[rgba(0,0,0,0.04)]",
"hover:brightness-110",
"active:brightness-95",
"focus-visible:ring-4 focus-visible:ring-[rgba(0,122,255,0.3)]",
 ].join(""),
 outline: [
"bg-[rgba(255,255,255,0.78)] text-[var(--text-primary)] rounded-[6px]",
"border border-[rgba(0,0,0,0.10)]",
"shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
"backdrop-blur-sm",
"hover:bg-[rgba(255,255,255,0.95)] hover:border-[rgba(0,0,0,0.15)]",
"focus-visible:ring-4 focus-visible:ring-[rgba(0,122,255,0.3)]",
 ].join(""),
 ghost: [
"text-[var(--color-blue)] rounded-[6px]",
"hover:bg-[var(--fill-tertiary)]",
"focus-visible:ring-4 focus-visible:ring-[rgba(0,122,255,0.3)]",
 ].join(""),
 secondary: [
"bg-[var(--fill-tertiary)] text-[var(--text-primary)] rounded-[6px]",
"hover:bg-[var(--fill-secondary)]",
"focus-visible:ring-4 focus-visible:ring-[rgba(0,122,255,0.3)]",
 ].join(""),
 destructive: [
"bg-[var(--color-red)] text-white rounded-[6px]",
"shadow-[0_0.5px_1px_rgba(0,0,0,0.12)]",
"hover:brightness-110",
"active:brightness-95",
"focus-visible:ring-4 focus-visible:ring-[rgba(255,59,48,0.3)]",
 ].join(""),
};

const sizes: Record<ButtonSize, string> = {
 sm:"text-[12px] px-2 py-1 min-h-[24px]",
 md:"text-[13px] px-3 py-1.5 min-h-[28px]",
 lg:"text-[14px] px-4 py-2 min-h-[32px]",
};

export function Button({ className, variant ="default", size ="md", ...props}: ButtonProps) {
 return (
 <button
 className={clsx(base, variants[variant], sizes[size], className)}
 {...props}
 />
 );
}
