// src/components/Modal.tsx
import { ReactNode } from "react";

export function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: ReactNode; }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-[14px] bg-white/92 backdrop-blur-[40px] saturate-[1.8] border border-white/50 shadow-[0_24px_80px_rgba(0,0,0,0.12),0_0_0_0.5px_rgba(0,0,0,0.06)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[#1D1D1F]">{title}</h2>
          <button 
            onClick={onClose} 
            className="w-7 h-7 rounded-full bg-[rgba(0,0,0,0.06)] hover:bg-[rgba(0,0,0,0.1)] flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] transition-colors text-sm leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
