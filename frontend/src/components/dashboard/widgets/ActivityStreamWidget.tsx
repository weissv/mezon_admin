// src/components/dashboard/widgets/ActivityStreamWidget.tsx
import { Activity, User, FileEdit, Trash2, Plus, Settings } from 'lucide-react';

interface ActivityEntry {
  id: string;
  action: string;
  entity: string;
  entityName: string;
  userName: string;
  timestamp: string;
}

interface ActivityStreamData {
  entries: ActivityEntry[];
}

const ACTION_ICONS: Record<string, { icon: typeof Activity; bg: string; color: string }> = {
  create:   { icon: Plus,     bg: '#ECFDF5', color: '#059669' },
  update:   { icon: FileEdit, bg: '#EFF6FF', color: '#3B82F6' },
  delete:   { icon: Trash2,   bg: '#FEF2F2', color: '#DC2626' },
  settings: { icon: Settings, bg: '#F8FAFC', color: '#64748B' },
};

const ACTION_LABELS: Record<string, string> = {
  create:   'создал(а)',
  update:   'изменил(а)',
  delete:   'удалил(а)',
};

export default function ActivityStreamWidget({ data }: { data: ActivityStreamData | undefined }) {
  if (!data) return null;

  const entries = data.entries ?? [];

  return (
    <div className="flex flex-col gap-1.5 h-full">
      {entries.length === 0 ? (
        <div className="p-4 text-center text-text-tertiary text-[12px] my-auto">
          Лента активности пуста
        </div>
      ) : (
        entries.map(entry => {
          const cfg = ACTION_ICONS[entry.action] ?? ACTION_ICONS.update;
          const Icon = cfg.icon;
          return (
            <div
              key={entry.id}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-primary/70 dark:bg-slate-800/40 border border-separator/30 hover:bg-surface-primary transition-all text-[12px]"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-black/[0.04] dark:border-white/[0.06]"
                style={{ background: cfg.bg }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary truncate leading-tight">
                  <span className="font-bold">{entry.userName}</span>{' '}
                  <span className="text-text-tertiary">{ACTION_LABELS[entry.action] ?? entry.action}</span>{' '}
                  <span className="font-semibold text-text-primary">{entry.entityName}</span>
                </p>
                <p className="text-[10px] text-text-tertiary truncate mt-0.5 leading-tight">
                  <User className="h-2.5 w-2.5 inline mr-1 opacity-70" />
                  {entry.entity}
                </p>
              </div>
              <span className="text-[10px] text-text-tertiary tabular-nums whitespace-nowrap shrink-0">
                {new Date(entry.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
