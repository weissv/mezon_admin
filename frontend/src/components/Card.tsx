import React from "react";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/72 backdrop-blur-[40px] saturate-[1.8] border border-white/50 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)] rounded-[14px] p-5 ${className}`}>
      {children}
    </div>
  );
}