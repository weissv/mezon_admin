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
      className={clsx("w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200", className)}
      {...props}
    />
  );
});
