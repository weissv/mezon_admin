// mezon_admin/frontend/src/layouts/AuthLayout.tsx
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";

export default function AuthLayout() {
  return (
    <div className="relative min-h-screen bg-[#F5F5F7] pb-16 pt-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,122,255,0.05),transparent_60%)]" />
      <Toaster position="top-right" richColors />
      <Outlet />
    </div>
  );
}