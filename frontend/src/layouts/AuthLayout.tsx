// mezon_admin/frontend/src/layouts/AuthLayout.tsx
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import LanguageSelector from "../components/LanguageSelector";

export default function AuthLayout() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#fef3e6] via-[#f9e2f0] to-[#f0f6ff] pb-16 pt-8">
      <Toaster position="top-right" richColors />
      <div className="absolute top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      <Outlet /> {/* Этот компонент будет отображать LoginPage */}
    </div>
  );
}