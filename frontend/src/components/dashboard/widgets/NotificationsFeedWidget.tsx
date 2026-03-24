// src/components/dashboard/widgets/NotificationsFeedWidget.tsx
import { Bell, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  body?: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsFeedData {
  notifications: Notification[];
  unreadCount: number;
}

const TYPE_ICONS: Record<string, { icon: typeof Bell; color: string }> = {
  info: { icon: Info, color: 'text-blue-500' },
  warning: { icon: AlertTriangle, color: 'text-amber-500' },
  success: { icon: CheckCircle, color: 'text-green-500' },
  error: { icon: XCircle, color: 'text-red-500' },
  default: { icon: Bell, color: 'text-gray-500' },
};

export default function NotificationsFeedWidget({ data }: { data: NotificationsFeedData | undefined }) {
  if (!data) return null;

  const notifications = data.notifications ?? [];

  return (
    <div className="space-y-2">
      {(data.unreadCount ?? 0) > 0 && (
        <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
          <Bell className="h-3 w-3" />
          {data.unreadCount} непрочитанных
        </div>
      )}

      {notifications.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">Нет уведомлений</p>
      )}

      {notifications.slice(0, 6).map(n => {
        const cfg = TYPE_ICONS[n.type] ?? TYPE_ICONS.default;
        const Icon = cfg.icon;
        return (
          <div
            key={n.id}
            className={`flex items-start gap-2 text-xs py-1.5 border-b border-gray-50 last:border-0 ${
              !n.read ? 'bg-blue-50/30 -mx-1 px-1 rounded' : ''
            }`}
          >
            <Icon className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${cfg.color}`} />
            <div className="flex-1 min-w-0">
              <p className={`truncate ${!n.read ? 'font-semibold' : ''}`}>{n.title}</p>
              {n.body && <p className="text-gray-400 truncate">{n.body}</p>}
            </div>
            <span className="text-gray-400 whitespace-nowrap">
              {new Date(n.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
