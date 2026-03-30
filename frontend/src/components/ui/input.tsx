// src/components/ui/input.tsx
import { InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={clsx(
          "mezon-field touch-manipulation placeholder:text-[var(--text-tertiary)]",
          className
        )}
        {...props}
      />
    );
  }
);
