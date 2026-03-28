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
        "w-full rounded-[8px] border border-[rgba(0,0,0,0.12)] bg-white/90 backdrop-blur-sm px-3 py-2 text-[var(--mezon-dark)] text-[13px] shadow-[0_0_0_0.5px_rgba(0,0,0,0.04)] transition-all focus:border-[#007AFF] focus:outline-none focus:ring-2 focus:ring-[rgba(0,122,255,0.2)] focus:shadow-[0_0_0_3px_rgba(0,122,255,0.12)] min-h-[34px] touch-manipulation placeholder:text-[#86868B]",
        className
      )}
      {...props}
    />
  );
});
