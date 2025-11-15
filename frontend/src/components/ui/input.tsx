// src/components/ui/input.tsx
import { InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={clsx(
        "w-full rounded-2xl border border-[var(--mezon-border)] bg-white/90 px-3 py-2.5 sm:px-4 sm:py-3 text-[var(--mezon-dark)] text-base shadow-sm transition focus:border-[var(--mezon-accent)] focus:outline-none focus:ring-2 focus:ring-[rgba(0,133,158,0.25)] min-h-[44px] touch-manipulation",
        className
      )}
      {...props}
    />
  );
});
