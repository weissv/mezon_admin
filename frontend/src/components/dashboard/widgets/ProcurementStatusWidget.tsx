// src/components/dashboard/widgets/ProcurementStatusWidget.tsx
import { ShoppingCart, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';

interface ProcurementData {
  byStatus: { status: string; count: number }[];
  recentOrders: { id: string; supplier: string; status: string; total: number; date: string }[];
  totalActive: number;
}

const STATUS_CFG: Record<string, { icon: typeof Clock; color: string }> = {
  pending:   { icon: Clock,        color: '#D97706' },
  approved:  { icon: CheckCircle,  color: '#3B82F6' },
  ordered:   { icon: ShoppingCart, color: '#6366F1' },
  delivered: { icon: Truck,        color: '#10B981' },
  cancelled: { icon: XCircle,      color: '#EF4444' },
};

const STATUS_LABELS: Record<string, string> = {
  pending:   'Ожидание',
  approved:  'Одобрено',
  ordered:   'Заказано',
  delivered: 'Доставлено',
  cancelled: 'Отменено',
};

const formatCompact = (n: number) =>
  new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

export default function ProcurementStatusWidget({ data }: { data: ProcurementData | undefined }) {
  if (!data) return null;

  const byStatus = data.byStatus ?? [];
  const recentOrders = data.recentOrders ?? [];

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Statuses bar */}
      <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-surface-primary dark:bg-slate-800/60 border border-separator/40">
        {byStatus.map(s => {
          const cfg = STATUS_CFG[s.status] ?? STATUS_CFG.pending;
          const Icon = cfg.icon;
          return (
            <div
              key={s.status}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-fill-quaternary text-[11px] font-medium text-text-secondary"
            >
              <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: cfg.color }} />
              <span>{STATUS_LABELS[s.status] ?? s.status}:</span>
              <span className="font-bold text-text-primary tabular-nums">{s.count}</span>
            </div>
          );
        })}
      </div>

      {/* Recent orders */}
      <div className="flex flex-col gap-1.5 flex-1">
        {recentOrders.length === 0 ? (
          <div className="p-4 text-center text-text-tertiary text-[12px] my-auto">
            Активных заказов на закупку нет
          </div>
        ) : (
          recentOrders.slice(0, 5).map(order => (
            <div
              key={order.id}
              className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-surface-primary/70 dark:bg-slate-800/40 border border-separator/30 text-[12px]"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-text-primary truncate text-[11px]">
                  {order.supplier}
                </p>
                <p className="text-[10px] text-text-tertiary mt-0.5 tabular-nums">
                  {new Date(order.date).toLocaleDateString('ru-RU')}
                </p>
              </div>
              <span className="text-[12px] font-bold text-text-primary tabular-nums shrink-0">
                {formatCompact(order.total)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
