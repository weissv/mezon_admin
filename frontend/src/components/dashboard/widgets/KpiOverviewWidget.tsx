// src/components/dashboard/widgets/KpiOverviewWidget.tsx
import { Users, Briefcase, School, TrendingUp, TrendingDown } from 'lucide-react';

interface KpiData {
  childrenCount: number;
  employeesCount: number;
  activeClubs: number;
  income: number;
  expense: number;
}

const currency = new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 });

function KpiCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="dashboard-kpi-card">
      <div className="dashboard-kpi-card__icon" style={{ background: color }}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="dashboard-kpi-card__value">{value}</p>
        <p className="dashboard-kpi-card__label">{label}</p>
      </div>
    </div>
  );
}

export default function KpiOverviewWidget({ data }: { data: KpiData | undefined }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <KpiCard label="Детей" value={data.childrenCount} icon={Users} color="var(--mezon-teal)" />
      <KpiCard label="Сотрудников" value={data.employeesCount} icon={Briefcase} color="#F1AE3D" />
      <KpiCard label="Кружков" value={data.activeClubs} icon={School} color="#8F93C0" />
      <KpiCard label="Доход (30д)" value={currency.format(data.income)} icon={TrendingUp} color="#00A26A" />
      <KpiCard label="Расход (30д)" value={currency.format(data.expense)} icon={TrendingDown} color="#F75C4C" />
    </div>
  );
}
