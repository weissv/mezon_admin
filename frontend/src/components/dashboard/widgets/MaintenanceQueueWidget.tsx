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

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-[rgba(255,59,48,0.12)] text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-[var(--fill-tertiary)] text-[var(--text-secondary)]',
};

const STATUS_ICONS: Record<string, typeof Clock> = {
  pending: Clock,
  in_progress: Wrench,
  completed: CheckCircle2,
};

export default function MaintenanceQueueWidget({ data }: { data: MaintenanceQueueData | undefined }) {
  if (!data) return null;

  const byStatus = data.byStatus ?? [];
  const recent = data.recent ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <span className="macos-text-caption">{data.totalOpen ?? 0} открытых заявок</span>
      </div>

      <div className="flex gap-2">
        {byStatus.map(s => (
          <div key={s.status} className="flex-1 text-center p-1.5 bg-[var(--fill-quaternary)] rounded text-xs">
            <p className="font-bold">{s.count}</p>
            <p className="text-[var(--text-tertiary)] capitalize">{s.status.replace('_', ' ')}</p>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        {recent.slice(0, 4).map(req => {
          const Icon = STATUS_ICONS[req.status] ?? Clock;
          return (
            <div key={req.id} className="flex items-center gap-2 text-xs">
              <Icon className="h-3 w-3 flex-shrink-0 text-[var(--text-tertiary)]" />
              <span className="truncate flex-1">{req.title}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${PRIORITY_COLORS[req.priority] ?? PRIORITY_COLORS.low}`}>
                {req.priority}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
