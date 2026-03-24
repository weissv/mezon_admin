// src/components/dashboard/widgets/ProcurementStatusWidget.tsx
import { ShoppingCart, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';

interface ProcurementData {
  byStatus: { status: string; count: number }[];
  recentOrders: { id: string; supplier: string; status: string; total: number; date: string }[];
  totalActive: number;
}

const STATUS_ICONS: Record<string, { icon: typeof Clock; color: string }> = {
  pending: { icon: Clock, color: 'text-amber-500' },
  approved: { icon: CheckCircle, color: 'text-blue-500' },
  ordered: { icon: ShoppingCart, color: 'text-indigo-500' },
  delivered: { icon: Truck, color: 'text-green-500' },
  cancelled: { icon: XCircle, color: 'text-red-400' },
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидание',
  approved: 'Одобрено',
  ordered: 'Заказано',
  delivered: 'Доставлено',
  cancelled: 'Отменено',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(n);

export default function ProcurementStatusWidget({ data }: { data: ProcurementData | undefined }) {
  if (!data) return null;

  const byStatus = data.byStatus ?? [];
  const recentOrders = data.recentOrders ?? [];

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {byStatus.map(s => {
          const cfg = STATUS_ICONS[s.status] ?? STATUS_ICONS.pending;
          const Icon = cfg.icon;
          return (
            <div key={s.status} className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-md text-xs">
              <Icon className={`h-3 w-3 ${cfg.color}`} />
              <span>{STATUS_LABELS[s.status] ?? s.status}</span>
              <span className="font-semibold">{s.count}</span>
            </div>
          );
        })}
      </div>

      <div className="space-y-1.5">
        {recentOrders.slice(0, 4).map(order => (
          <div key={order.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0">
            <div className="truncate flex-1">
              <p className="font-medium">{order.supplier}</p>
              <p className="text-gray-400">{new Date(order.date).toLocaleDateString('ru-RU')}</p>
            </div>
            <span className="font-medium">{fmt(order.total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
