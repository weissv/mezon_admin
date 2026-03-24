// src/components/dashboard/DashboardOverview.tsx
// Верхняя обзорная полоса дашборда: ключевые метрики + алерты

import { useNavigate } from 'react-router-dom';
import { TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';
import type { DashboardOverview as OverviewData } from '../../types/dashboard';

const TONE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  primary: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  success: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  danger: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  neutral: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
};

interface DashboardOverviewProps {
  overview: OverviewData;
}

export default function DashboardOverview({ overview }: DashboardOverviewProps) {
  const navigate = useNavigate();

  if (!overview.metrics.length && !overview.alerts.length) return null;

  const activeAlerts = overview.alerts.filter(a => a.value > 0);

  return (
    <div className="dashboard-overview">
      {/* Metrics strip */}
      <div className="dashboard-overview__metrics">
        {overview.metrics.map(metric => {
          const tone = TONE_STYLES[metric.tone] ?? TONE_STYLES.primary;
          return (
            <div
              key={metric.id}
              className={`dashboard-overview__metric ${tone.bg} ${tone.border}`}
            >
              <p className={`dashboard-overview__metric-value ${tone.text}`}>
                {typeof metric.value === 'number'
                  ? metric.value.toLocaleString('ru-RU')
                  : metric.value}
              </p>
              <p className="dashboard-overview__metric-label">{metric.label}</p>
              {metric.hint && (
                <p className="dashboard-overview__metric-hint">{metric.hint}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Alerts strip */}
      {activeAlerts.length > 0 && (
        <div className="dashboard-overview__alerts">
          {activeAlerts.map(alert => {
            const tone = TONE_STYLES[alert.tone] ?? TONE_STYLES.neutral;
            return (
              <button
                key={alert.id}
                className={`dashboard-overview__alert ${tone.bg} ${tone.border}`}
                onClick={() => navigate(alert.path)}
              >
                <AlertTriangle className={`h-3.5 w-3.5 ${tone.text}`} />
                <span className="dashboard-overview__alert-label">{alert.label}</span>
                <span className={`dashboard-overview__alert-value ${tone.text}`}>{alert.value}</span>
                <ChevronRight className="h-3 w-3 text-gray-400" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
