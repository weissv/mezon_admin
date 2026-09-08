// src/components/dashboard/widgets/MaintenanceQueueWidget.tsx
import { Wrench, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface MaintRequest {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface MaintenanceQueueData {
  byStatus: { status: string; count: number }[];
  recent: MaintRequest[];
  totalOpen: number;
}

const PRIORITY_CLS: Record<string, string> = {
  urgent: 'bento-badge--red',
  high:   'bento-badge--amber',
  medium: 'bento-badge--amber',
  low:    'bento-badge--gray',
};

const STATUS_ICONS: Record<string, typeof Clock> = {
  pending:     Clock,
  in_progress: Wrench,
  completed:   CheckCircle2,
};

export default function MaintenanceQueueWidget({ data }: { data: MaintenanceQueueData | undefined }) {
  if (!data) return null;

  const byStatus = data.byStatus ?? [];
  const recent = data.recent ?? [];

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Hero count + status pills */}
      <div className="p-3.5 rounded-xl bg-surface-primary dark:bg-slate-800/60 border border-separator/40 shadow-subtle flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-tint-blue/80 dark:bg-blue-950/40 text-macos-blue flex items-center justify-center shrink-0">
            <Wrench className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[20px] font-black text-text-primary leading-none tabular-nums">
              {data.totalOpen ?? 0}
            </span>
            <p className="text-[11px] font-medium text-text-tertiary">
              активных заявок на ремонт
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {byStatus.map(s => (
            <span
              key={s.status}
              className="px-2 py-0.5 rounded-md bg-fill-quaternary text-[10px] font-medium text-text-secondary"
            >
              {s.status === 'in_progress' ? 'В работе' : s.status === 'pending' ? 'Ожидает' : s.status}: <strong className="tabular-nums font-bold text-text-primary">{s.count}</strong>
            </span>
          ))}
        </div>
      </div>

      {/* Recent requests list */}
      <div className="flex flex-col gap-1.5 flex-1">
        {recent.length === 0 ? (
          <div className="p-4 text-center text-text-tertiary text-[12px] my-auto">
            Открытых заявок на обслуживание нет
          </div>
        ) : (
          recent.slice(0, 5).map(req => {
            const Icon = STATUS_ICONS[req.status] ?? Clock;
            return (
              <div
                key={req.id}
                className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-primary/70 dark:bg-slate-800/40 border border-separator/30 text-[12px]"
              >
                <div className="w-7 h-7 rounded-lg bg-fill-quaternary flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5 text-text-secondary" />
                </div>
                <p className="flex-1 font-medium text-text-primary truncate text-[11px]">
                  {req.title}
                </p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                  req.priority === 'urgent'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    : req.priority === 'high'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-fill-quaternary text-text-tertiary'
                }`}>
                  {req.priority === 'urgent' ? 'Срочно' : req.priority === 'high' ? 'Высокий' : req.priority}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
