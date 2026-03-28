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
          "w-full min-h-[36px] rounded-panel border border-black/10 bg-[rgba(255,255,255,0.82)] px-3.5 py-2 text-[13px] text-[var(--mezon-dark)] shadow-macos-input backdrop-blur-sm transition-all duration-200 placeholder:text-[var(--mezon-text-soft)] focus-visible:border-[rgba(10,132,255,0.3)] focus-visible:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(10,132,255,0.14)] disabled:cursor-not-allowed disabled:opacity-60 touch-manipulation",
          className
        )}
        {...props}
      />
  );
});
