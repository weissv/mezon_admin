// src/components/ui/Card.tsx
import { HTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

export type CardVariant = "default" | "flat" | "elevated" | "glass" | "interactive";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variants: Record<CardVariant, string> = {
  default: [
    "bg-surface-primary border border-black/[0.06]",
    "shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)]",
  ].join(" "),
  flat: [
    "bg-fill-quaternary/60 border border-separator/40",
  ].join(" "),
  elevated: [
    "bg-surface-primary border border-black/[0.08]",
    "shadow-[0_8px_24px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.9)]",
  ].join(" "),
  glass: [
    "bg-white/70 backdrop-blur-xl border border-white/80",
    "shadow-[0_4px_20px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.9)]",
  ].join(" "),
  interactive: [
    "bg-surface-primary border border-black/[0.06] cursor-pointer",
    "shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)]",
    "transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
    "hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.03)] hover:border-text-tertiary/30",
    "active:translate-y-0 active:scale-[0.995]",
  ].join(" "),
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        "rounded-2xl relative overflow-hidden",
        variants[variant],
        className
      )}
      {...props}
    />
  )
);

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx("flex flex-col space-y-1.5 p-5 lg:p-6", className)}
      {...props}
    />
  )
);

export const CardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={clsx(
        "text-[15px] lg:text-[16px] font-semibold tracking-[-0.015em] text-text-primary",
        className
      )}
      {...props}
    />
  )
);

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={clsx("text-[13px] text-text-tertiary leading-relaxed", className)}
      {...props}
    />
  )
);

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx("p-5 lg:p-6 pt-0 lg:pt-0", className)} {...props} />
  )
);

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx("flex items-center p-5 lg:p-6 pt-0 lg:pt-0 border-t border-separator/40 mt-4", className)}
      {...props}
    />
  )
);

Card.displayName = "Card";
CardHeader.displayName = "CardHeader";
CardTitle.displayName = "CardTitle";
CardDescription.displayName = "CardDescription";
CardContent.displayName = "CardContent";
CardFooter.displayName = "CardFooter";

