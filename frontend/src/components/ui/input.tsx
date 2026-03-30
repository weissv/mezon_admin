// src/components/ui/input.tsx
import { InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={clsx(
          "flex h-9 w-full rounded-md border border-field bg-surface-primary px-3 py-1",
          "text-[14px] text-primary shadow-subtle",
          "placeholder:text-tertiary",
          "focus-visible:border-macos-blue focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-macos-blue",
          "disabled:cursor-not-allowed disabled:bg-inset disabled:opacity-50",
          "macos-transition touch-manipulation",
          className
        )}
        {...props}
      />
    );
  }
);
