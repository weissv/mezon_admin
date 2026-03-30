// src/components/Modal.tsx
import { ReactNode, useEffect } from "react";
import clsx from "clsx";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[6px] macos-animate-fade-in" />

      {/* Sheet */}
      <div
        className={clsx(
          "relative w-full max-h-[85vh] overflow-y-auto",
          "rounded-[var(--radius-sheet)] bg-[var(--surface-overlay)]",
          "border border-[var(--border-card)]",
          "shadow-[var(--shadow-floating)]",
          "p-6 macos-animate-scale-in",
          sizeClasses[size]
        )}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between pb-3 border-b border-[var(--separator)]">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[var(--fill-quaternary)] hover:bg-[var(--fill-tertiary)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] macos-transition text-sm leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
