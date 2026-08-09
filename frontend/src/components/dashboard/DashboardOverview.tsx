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
  accent: { bg: 'bg-tint-blue/80', text: 'text-macos-blue', border: 'border-macos-blue/20' },
  success: { bg: 'bg-tint-green/80', text: 'text-[#1B7A3D]', border: 'border-macos-green/20' },
  warning: { bg: 'bg-tint-orange/80', text: 'text-[#B25E00]', border: 'border-macos-orange/20' },
  danger: { bg: 'bg-tint-red/80', text: 'text-macos-red', border: 'border-macos-red/20' },
  neutral: { bg: 'bg-fill-quaternary', text: 'text-text-primary', border: 'border-separator/40' },
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
    <div className="space-y-4">
      {/* Metrics Bento Row */}
      {overview.metrics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {overview.metrics.map(metric => {
            const style = toneStyles[metric.tone] ?? toneStyles.neutral;
            return (
              <div
                key={metric.id}
                className={clsx(
                  "p-4 rounded-2xl border transition-all duration-200 backdrop-blur-xl shadow-[0_2px_8px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,0.8)]",
                  "bg-surface-primary hover:shadow-card hover:-translate-y-0.5",
                  style.border
                )}
              >
                <p className={clsx("text-[24px] lg:text-[26px] font-bold tracking-[-0.03em] leading-tight tabular-nums", style.text)}>
                  {typeof metric.value === 'number'
                    ? metric.value.toLocaleString('ru-RU')
                    : metric.value}
                </p>
                <p className="text-[12px] font-semibold text-text-primary mt-1 truncate tracking-[-0.01em]">
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

      {/* Summary strip + alerts */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-primary/70 backdrop-blur-xl border border-black/[0.06] shadow-subtle">
        <div className="flex items-center gap-6 overflow-x-auto py-0.5">
          {summaryItems.map(item => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="flex items-center gap-2.5 shrink-0">
                <div className="w-7 h-7 rounded-lg bg-tint-blue/80 text-macos-blue flex items-center justify-center border border-macos-blue/15">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-text-primary leading-none tabular-nums">{item.value}</div>
                  <div className="text-[11px] text-text-tertiary mt-0.5 leading-none">{item.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {activeAlerts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {activeAlerts.map(alert => (
              <button
                key={alert.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-semibold bg-tint-red/90 text-macos-red border border-macos-red/20 shadow-subtle hover:bg-macos-red hover:text-white transition-all cursor-pointer active:scale-[0.97]"
                onClick={() => navigate(alert.path)}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{alert.label}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-white/40 text-[11px] font-bold tabular-nums">{alert.value}</span>
                <ChevronRight className="h-3 w-3 opacity-60" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

