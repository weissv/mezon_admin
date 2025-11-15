// src/components/ui/FormError.tsx
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-2 text-sm font-medium text-[var(--mezon-accent)]">{message}</p>;
}
