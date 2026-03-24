// src/components/dashboard/widgets/KpiOverviewWidget.tsx
import { Users, Briefcase, School, TrendingUp, TrendingDown } from 'lucide-react';

interface KpiData {
  childrenCount: number;
  employeesCount: number;
  activeClubs: number;
  income: number;
  expense: number;
}

function formatCompactCurrency(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

function KpiCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="dashboard-kpi-card">
      <div className="dashboard-kpi-card__icon" style={{ background: color }}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="dashboard-kpi-card__content">
        <p className="dashboard-kpi-card__value">{value}</p>
        <p className="dashboard-kpi-card__label">{label}</p>
      </div>
    </div>
  );
}

export default function KpiOverviewWidget({ data }: { data: KpiData | undefined }) {
  if (!data) return null;

  return (
    <div className="dashboard-kpi-strip">
      <KpiCard label="Детей" value={data.childrenCount} icon={Users} color="var(--mezon-teal)" />
      <KpiCard label="Сотрудников" value={data.employeesCount} icon={Briefcase} color="#F1AE3D" />
      <KpiCard label="Кружков" value={data.activeClubs} icon={School} color="#8F93C0" />
      <KpiCard label="Доход за 30 дней" value={formatCompactCurrency(data.income)} icon={TrendingUp} color="#00A26A" />
      <KpiCard label="Расход за 30 дней" value={formatCompactCurrency(data.expense)} icon={TrendingDown} color="#F75C4C" />
    </div>
  );
}
