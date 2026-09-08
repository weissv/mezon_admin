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

const TYPE_CFG: Record<string, { icon: typeof Bell; bg: string; color: string }> = {
  info:    { icon: Info,          bg: '#EFF6FF', color: '#3B82F6' },
  warning: { icon: AlertTriangle, bg: '#FFFBEB', color: '#D97706' },
  success: { icon: CheckCircle,   bg: '#ECFDF5', color: '#10B981' },
  error:   { icon: XCircle,       bg: '#FEF2F2', color: '#EF4444' },
  default: { icon: Bell,          bg: '#F8FAFC', color: '#64748B' },
};

export default function NotificationsFeedWidget({ data }: { data: NotificationsFeedData | undefined }) {
  if (!data) return null;

  const notifications = data.notifications ?? [];

  return (
    <div className="flex flex-col gap-2 h-full">
      {(data.unreadCount ?? 0) > 0 && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-tint-blue/80 dark:bg-blue-950/40 text-macos-blue text-[11px] font-semibold self-start border border-macos-blue/15">
          <Bell className="h-3 w-3" />
          <span>{data.unreadCount} непрочитанных</span>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="p-4 text-center text-text-tertiary text-[12px] my-auto">
          Новых уведомлений нет
        </div>
      ) : (
        notifications.map(n => {
          const cfg = TYPE_CFG[n.type] ?? TYPE_CFG.default;
          const Icon = cfg.icon;
          return (
            <div
              key={n.id}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-[12px] ${
                !n.read
                  ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-900/40'
                  : 'bg-surface-primary/70 dark:bg-slate-800/40 border-separator/30 hover:bg-surface-primary'
              }`}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-black/[0.04] dark:border-white/[0.06]"
                style={{ background: cfg.bg }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-macos-blue shrink-0" />}
                  <p className={`truncate leading-tight text-text-primary ${!n.read ? 'font-bold' : 'font-medium'}`}>
                    {n.title}
                  </p>
                </div>
                {n.body && (
                  <p className="text-[10px] text-text-tertiary truncate mt-0.5 leading-tight">
                    {n.body}
                  </p>
                )}
              </div>
              <span className="text-[10px] text-text-tertiary tabular-nums whitespace-nowrap shrink-0">
                {new Date(n.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
