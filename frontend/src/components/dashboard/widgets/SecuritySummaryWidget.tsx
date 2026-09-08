// src/components/dashboard/widgets/SecuritySummaryWidget.tsx
import { Shield, Eye, AlertTriangle, DoorOpen } from 'lucide-react';

interface SecurityEvent {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

interface SecuritySummaryData {
  last30Days: { type: string; count: number }[];
  recentEvents: SecurityEvent[];
  todayCount: number;
}

const EVENT_CFG: Record<string, { icon: typeof Eye; bg: string; color: string }> = {
  entry:   { icon: DoorOpen,       bg: '#ECFDF5', color: '#10B981' },
  exit:    { icon: DoorOpen,       bg: '#EFF6FF', color: '#3B82F6' },
  alert:   { icon: AlertTriangle,  bg: '#FEF2F2', color: '#EF4444' },
  visitor: { icon: Eye,            bg: '#FFFBEB', color: '#D97706' },
};

export default function SecuritySummaryWidget({ data }: { data: SecuritySummaryData | undefined }) {
  if (!data) return null;

  const last30Days = data.last30Days ?? [];
  const recentEvents = data.recentEvents ?? [];

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Today count header */}
      <div className="p-3.5 rounded-xl bg-surface-primary dark:bg-slate-800/60 border border-separator/40 shadow-subtle flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-tint-blue/80 dark:bg-blue-950/40 text-macos-blue flex items-center justify-center shrink-0">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[20px] font-black text-text-primary leading-none tabular-nums">
              {data.todayCount ?? 0}
            </span>
            <p className="text-[11px] font-medium text-text-tertiary">
              событий СКУД сегодня
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {last30Days.slice(0, 3).map(s => (
            <span
              key={s.type}
              className="px-2 py-0.5 rounded-md bg-fill-quaternary text-[10px] font-medium text-text-secondary capitalize"
            >
              {s.type}: <strong className="tabular-nums font-bold text-text-primary">{s.count}</strong>
            </span>
          ))}
        </div>
      </div>

      {/* Events list */}
      <div className="flex flex-col gap-1.5 flex-1">
        {recentEvents.length === 0 ? (
          <div className="p-4 text-center text-text-tertiary text-[12px] my-auto">
            Инцидентов и тревог безопасности нет
          </div>
        ) : (
          recentEvents.slice(0, 5).map(ev => {
            const cfg = EVENT_CFG[ev.type] ?? EVENT_CFG.entry;
            const Icon = cfg.icon;
            return (
              <div
                key={ev.id}
                className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-primary/70 dark:bg-slate-800/40 border border-separator/30 text-[12px]"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: cfg.bg }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
                </div>
                <p className="flex-1 font-medium text-text-primary truncate text-[11px]">
                  {ev.description}
                </p>
                <span className="text-[10px] text-text-tertiary tabular-nums whitespace-nowrap shrink-0">
                  {new Date(ev.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
