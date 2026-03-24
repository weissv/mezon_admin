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
  create: { icon: Plus, color: 'text-green-500' },
  update: { icon: FileEdit, color: 'text-blue-500' },
  delete: { icon: Trash2, color: 'text-red-500' },
  settings: { icon: Settings, color: 'text-gray-500' },
};

const ACTION_LABELS: Record<string, string> = {
  create: 'создал(а)',
  update: 'изменил(а)',
  delete: 'удалил(а)',
};

export default function ActivityStreamWidget({ data }: { data: ActivityStreamData | undefined }) {
  if (!data) return null;

  return (
    <div className="space-y-1.5">
      {data.entries.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">Нет активности</p>
      )}

      {data.entries.slice(0, 8).map(entry => {
        const cfg = ACTION_ICONS[entry.action] ?? ACTION_ICONS.update;
        const Icon = cfg.icon;
        return (
          <div key={entry.id} className="flex items-start gap-2 text-xs py-1 border-b border-gray-50 last:border-0">
            <Icon className={`h-3 w-3 mt-0.5 flex-shrink-0 ${cfg.color}`} />
            <div className="flex-1 min-w-0">
              <p>
                <span className="font-medium">{entry.userName}</span>{' '}
                <span className="text-gray-500">{ACTION_LABELS[entry.action] ?? entry.action}</span>{' '}
                <span className="text-gray-600">{entry.entityName}</span>
              </p>
              <p className="text-gray-400 flex items-center gap-1">
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
