// mezon_admin/frontend/src/layouts/AuthLayout.tsx
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <Toaster position="top-right" richColors />
      <Outlet /> {/* Этот компонент будет отображать LoginPage */}
    </div>
  );
}