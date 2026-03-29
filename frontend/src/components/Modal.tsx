// src/components/Modal.tsx
import { ReactNode, useEffect } from "react";

export function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
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
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[6px]" />

      {/* Sheet */}
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-[14px] bg-white/92 backdrop-blur-[40px] saturate-[1.8] border border-white/50 shadow-[0_24px_80px_rgba(0,0,0,0.14),0_0_0_0.5px_rgba(0,0,0,0.06)] p-6">
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-[14px] pointer-events-none bg-gradient-to-b from-white/30 to-transparent" style={{ height: '40%' }} />

        <div className="relative mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[#1D1D1F]">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[rgba(0,0,0,0.06)] hover:bg-[rgba(0,0,0,0.10)] flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] transition-colors text-sm leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
