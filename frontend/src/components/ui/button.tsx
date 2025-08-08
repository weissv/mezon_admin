// src/components/ui/button.tsx
import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

export function Button({ className, variant = "default", size = "md", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "ghost"; size?: "sm" | "md" | "lg" }) {
  const base = "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50";
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 text-gray-800 hover:bg-gray-50",
    ghost: "text-gray-800 hover:bg-gray-100",
  };
  const sizes = { sm: "h-8 px-3 text-sm", md: "h-10 px-4", lg: "h-12 px-6 text-lg" };
  return <button className={clsx(base, variants[variant], sizes[size], className)} {...props} />;
}
