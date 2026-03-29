// src/components/dashboard/DashboardOverview.tsx
// Верхняя обзорная полоса дашборда: ключевые метрики + алерты

import { useNavigate} from 'react-router-dom';
import { AlertTriangle, ChevronRight, Clock3, LayoutGrid, Sparkles, Zap} from 'lucide-react';
import type { DashboardOverview as OverviewData} from '../../types/dashboard';

interface DashboardOverviewProps {
 overview: OverviewData;
}

const generatedAtFormatter = new Intl.DateTimeFormat('ru-RU', {
 day: '2-digit',
 month: 'short',
 hour: '2-digit',
 minute: '2-digit',
});

export default function DashboardOverview({ overview}: DashboardOverviewProps) {
 const navigate = useNavigate();

 if (!overview.metrics.length && !overview.alerts.length) return null;

 const activeAlerts = overview.alerts.filter(a => a.value > 0);
 const summaryItems = [
 {
 id: 'widgets',
 label: 'Виджетов на экране',
 value: overview.visibleWidgetCount,
 icon: LayoutGrid,
},
 {
 id: 'actions',
 label: 'Быстрых действий',
 value: overview.quickActionCount,
 icon: Zap,
},
 {
 id: 'updated',
 label: 'Обновлено',
 value: generatedAtFormatter.format(new Date(overview.generatedAt)),
 icon: Clock3,
},
 ];

 return (
 <div className="dashboard-overview">
 <div className="dashboard-overview__hero">
 <div className="dashboard-overview__hero-copy">
 <span className="dashboard-overview__eyebrow">
 <Sparkles className="h-3.5 w-3.5"/>
 Операционная сводка
 </span>
 <h2 className="dashboard-overview__headline">Картина дня по школе и операциям</h2>
 <p className="dashboard-overview__description">
 Сверху собраны ключевые метрики, активные сигналы и быстрые переходы по текущему состоянию системы.
 </p>
 </div>

 <div className="dashboard-overview__summary">
 {summaryItems.map(item => {
 const Icon = item.icon;
 return (
 <div key={item.id} className="dashboard-overview__summary-item">
 <div className="dashboard-overview__summary-icon">
 <Icon className="h-4 w-4"/>
 </div>
 <div>
 <div className="dashboard-overview__summary-value">{item.value}</div>
 <div className="dashboard-overview__summary-label">{item.label}</div>
 </div>
 </div>
 );
})}
 </div>
 </div>

 <div className="dashboard-overview__metrics">
 {overview.metrics.map(metric => {
 return (
 <div
 key={metric.id}
 className={`dashboard-overview__metric dashboard-overview__metric--${metric.tone}`}
 >
 <p className="dashboard-overview__metric-value">
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
 return (
 <button
 key={alert.id}
 className={`dashboard-overview__alert dashboard-overview__alert--${alert.tone}`}
 onClick={() => navigate(alert.path)}
 >
 <AlertTriangle className="h-3.5 w-3.5 dashboard-overview__alert-icon"/>
 <span className="dashboard-overview__alert-label">{alert.label}</span>
 <span className="dashboard-overview__alert-value">{alert.value}</span>
 <ChevronRight className="h-3 w-3 dashboard-overview__alert-chevron"/>
 </button>
 );
})}
 </div>
 )}
 </div>
 );
}
