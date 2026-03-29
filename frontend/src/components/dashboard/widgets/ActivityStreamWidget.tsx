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

const ACTION_ICONS: Record<string, { icon: typeof Activity; color: string }> = {
  create: { icon: Plus, color: 'text-[var(--color-green)]' },
  update: { icon: FileEdit, color: 'text-blue-500' },
  delete: { icon: Trash2, color: 'text-[var(--color-red)]' },
  settings: { icon: Settings, color: 'text-[var(--text-secondary)]' },
};

const ACTION_LABELS: Record<string, string> = {
  create: 'создал(а)',
  update: 'изменил(а)',
  delete: 'удалил(а)',
};

export default function ActivityStreamWidget({ data }: { data: ActivityStreamData | undefined }) {
  if (!data) return null;

  const entries = data.entries ?? [];

  return (
    <div className="space-y-1.5">
      {entries.length === 0 && (
        <p className="text-sm text-[var(--text-tertiary)] text-center py-4">Нет активности</p>
      )}

      {entries.slice(0, 8).map(entry => {
        const cfg = ACTION_ICONS[entry.action] ?? ACTION_ICONS.update;
        const Icon = cfg.icon;
        return (
          <div key={entry.id} className="flex items-start gap-2 text-xs py-1 border-b border-gray-50 last:border-0">
            <Icon className={`h-3 w-3 mt-0.5 flex-shrink-0 ${cfg.color}`} />
            <div className="flex-1 min-w-0">
              <p>
                <span className="font-medium">{entry.userName}</span>{' '}
                <span className="text-[var(--text-secondary)]">{ACTION_LABELS[entry.action] ?? entry.action}</span>{' '}
                <span className="text-[var(--text-secondary)]">{entry.entityName}</span>
              </p>
              <p className="text-[var(--text-tertiary)] flex items-center gap-1">
                <User className="h-2.5 w-2.5 inline" />
                {entry.entity} · {new Date(entry.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
