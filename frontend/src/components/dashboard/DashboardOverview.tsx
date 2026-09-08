// src/components/dashboard/DashboardOverview.tsx
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight, Clock3, LayoutGrid, Zap } from 'lucide-react';
import type { DashboardOverview as OverviewData } from '../../types/dashboard';
import clsx from 'clsx';

interface DashboardOverviewProps {
  overview: OverviewData;
}

const generatedAtFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const toneStyles: Record<string, { bg: string; text: string; border: string }> = {
  primary: { bg: 'bg-tint-blue/70 dark:bg-blue-950/30', text: 'text-macos-blue dark:text-blue-400', border: 'border-macos-blue/25' },
  accent: { bg: 'bg-tint-blue/70 dark:bg-blue-950/30', text: 'text-macos-blue dark:text-blue-400', border: 'border-macos-blue/25' },
  success: { bg: 'bg-tint-green/70 dark:bg-emerald-950/30', text: 'text-[#1B7A3D] dark:text-emerald-400', border: 'border-macos-green/25' },
  warning: { bg: 'bg-tint-orange/70 dark:bg-amber-950/30', text: 'text-[#B25E00] dark:text-amber-400', border: 'border-macos-orange/25' },
  danger: { bg: 'bg-tint-red/70 dark:bg-rose-950/30', text: 'text-macos-red dark:text-rose-400', border: 'border-macos-red/25' },
  neutral: { bg: 'bg-fill-quaternary/40 dark:bg-slate-800/40', text: 'text-text-primary', border: 'border-separator/40' },
};

export default function DashboardOverview({ overview }: DashboardOverviewProps) {
  const navigate = useNavigate();

  if (!overview.metrics.length && !overview.alerts.length) return null;

  const activeAlerts = overview.alerts.filter(a => a.value > 0);

  const summaryItems = [
    { id: 'widgets', label: 'Виджетов', value: overview.visibleWidgetCount, icon: LayoutGrid },
    { id: 'actions', label: 'Действий', value: overview.quickActionCount, icon: Zap },
    {
      id: 'updated',
      label: 'Обновлено',
      value: generatedAtFormatter.format(new Date(overview.generatedAt)),
      icon: Clock3,
    },
  ];

  return (
    <div className="space-y-3.5">
      {/* Executive Metrics Bento Row — adaptive 3-col on 13" laptops, 6-col on larger screens */}
      {overview.metrics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3">
          {overview.metrics.map(metric => {
            const style = toneStyles[metric.tone] ?? toneStyles.neutral;
            return (
              <div
                key={metric.id}
                className={clsx(
                  "p-4 rounded-2xl border transition-all duration-200 backdrop-blur-xl",
                  "bg-surface-primary/90 dark:bg-slate-900/90 shadow-[0_2px_10px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)]",
                  "hover:shadow-card hover:-translate-y-0.5",
                  style.border
                )}
              >
                <div className="flex items-baseline justify-between gap-1">
                  <p className={clsx("text-[26px] lg:text-[28px] font-extrabold tracking-[-0.03em] leading-none tabular-nums", style.text)}>
                    {typeof metric.value === 'number'
                      ? metric.value.toLocaleString('ru-RU')
                      : metric.value}
                  </p>
                </div>
                <p className="text-[12px] font-bold text-text-primary mt-2 truncate tracking-[-0.01em]">
                  {metric.label}
                </p>
                {metric.hint && (
                  <p className="text-[11px] text-text-tertiary mt-0.5 truncate">
                    {metric.hint}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Signals & Summary Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-surface-primary/80 dark:bg-slate-900/80 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-subtle">
        {/* Signals / Alerts */}
        <div className="flex flex-wrap items-center gap-2">
          {activeAlerts.length > 0 ? (
            activeAlerts.map(alert => (
              <button
                key={alert.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-bold bg-tint-red/90 dark:bg-rose-950/60 text-macos-red dark:text-rose-400 border border-macos-red/25 shadow-subtle hover:bg-macos-red hover:text-white dark:hover:bg-macos-red dark:hover:text-white transition-all cursor-pointer active:scale-[0.97]"
                onClick={() => navigate(alert.path)}
                title={`Перейти: ${alert.label}`}
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>{alert.label}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-white/50 dark:bg-black/40 text-[11px] font-bold tabular-nums">{alert.value}</span>
                <ChevronRight className="h-3 w-3 opacity-60 shrink-0" />
              </button>
            ))
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-medium bg-tint-green/60 text-[#1B7A3D] dark:text-emerald-400 border border-macos-green/20">
              <span className="w-2 h-2 rounded-full bg-macos-green animate-pulse" />
              <span>Все системы в норме · Критичных сигналов нет</span>
            </div>
          )}
        </div>

        {/* Context chips */}
        <div className="flex items-center gap-5 overflow-x-auto py-0.5 shrink-0">
          {summaryItems.map(item => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="flex items-center gap-2 shrink-0">
                <div className="w-6 h-6 rounded-lg bg-tint-blue/80 dark:bg-blue-950/60 text-macos-blue flex items-center justify-center border border-macos-blue/15">
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[12px] font-bold text-text-primary leading-none tabular-nums">{item.value}</span>
                  <span className="text-[11px] text-text-tertiary leading-none">{item.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

