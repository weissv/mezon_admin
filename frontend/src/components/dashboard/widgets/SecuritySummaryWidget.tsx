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

const EVENT_ICONS: Record<string, { icon: typeof Eye; color: string }> = {
  entry: { icon: DoorOpen, color: 'text-green-500' },
  exit: { icon: DoorOpen, color: 'text-blue-500' },
  alert: { icon: AlertTriangle, color: 'text-red-500' },
  visitor: { icon: Eye, color: 'text-amber-500' },
};

export default function SecuritySummaryWidget({ data }: { data: SecuritySummaryData | undefined }) {
  if (!data) return null;

  const last30Days = data.last30Days ?? [];
  const recentEvents = data.recentEvents ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-teal-600" />
          <span className="text-sm font-medium">Сегодня: {data.todayCount ?? 0} событий</span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {last30Days.map(s => (
          <div key={s.type} className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded text-xs">
            <span className="capitalize">{s.type}</span>
            <span className="font-bold">{s.count}</span>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        {recentEvents.slice(0, 5).map(ev => {
          const cfg = EVENT_ICONS[ev.type] ?? EVENT_ICONS.entry;
          const Icon = cfg.icon;
          return (
            <div key={ev.id} className="flex items-center gap-2 text-xs">
              <Icon className={`h-3 w-3 flex-shrink-0 ${cfg.color}`} />
              <span className="truncate flex-1">{ev.description}</span>
              <span className="text-gray-400 whitespace-nowrap">
                {new Date(ev.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
