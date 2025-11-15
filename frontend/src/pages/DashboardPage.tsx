import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { Users, Briefcase, School, TrendingUp, TrendingDown, AlertTriangle, Calendar, Wrench } from 'lucide-react';

type SummaryData = {
  kpi: {
    childrenCount: number;
    employeesCount: number;
    activeClubs: number;
    financeLast30d: { type: 'INCOME' | 'EXPENSE', _sum: { amount: number | null } }[];
  }
};

type MetricsData = {
  childrenCount: number;
  employeesCount: number;
  activeClubs: number;
  lowInventory: Array<{ id: number; name: string; quantity: number; unit: string }>;
  attendance: { today: number; date?: string };
  maintenance: { activeRequests: number };
  employees: { needingMedicalCheckup: number };
};

function KPICard({ title, value, icon: Icon, accent = "var(--mezon-accent)" }: { title: string; value: string | number; icon: React.ElementType; accent?: string }) {
    return (
        <div className="mezon-card">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--mezon-text-soft)]">{title}</p>
                    <p className="text-3xl font-bold text-[var(--mezon-dark)]">{value}</p>
                </div>
                <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl text-white"
                    style={{ background: accent }}
                >
                    <Icon className="h-7 w-7" />
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [metrics, setMetrics] = useState<MetricsData | null>(null);
    const [loading, setLoading] = useState(true);
    const currency = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [summaryData, metricsData] = await Promise.all([
                    api.get('/api/dashboard/summary'),
                    api.get('/api/dashboard/metrics'),
                ]);
                setSummary(summaryData);
                setMetrics(metricsData);
            } catch (error: any) {
                toast.error('Ошибка загрузки данных', { description: error?.message });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const income = summary?.kpi.financeLast30d.find(f => f.type === 'INCOME')?._sum.amount || 0;
    const expense = summary?.kpi.financeLast30d.find(f => f.type === 'EXPENSE')?._sum.amount || 0;

    if (loading) {
      return <div className="mezon-card">Загружаем метрики...</div>;
    }

    return (
        <div className="space-y-10">
            <section className="mezon-hero-panel mezon-shine">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <span className="mezon-badge">Mezon ERP</span>
                        <h1 className="mezon-section-title text-4xl">
                            Оцифрованная забота <span>о школе</span>
                        </h1>
                        <p className="mezon-subtitle">
                            Данные по детям, сотрудникам, финансам и хозяйственным задачам в едином пространстве с эстетикой главного сайта.
                        </p>
                    </div>
                    <div className="grid gap-4 text-sm text-[var(--mezon-dark)] sm:grid-cols-2">
                        <div className="mezon-card">
                            <p className="text-xs uppercase tracking-[0.3em] text-[var(--mezon-text-soft)]">Активные дети</p>
                            <p className="text-3xl font-bold">{metrics?.childrenCount ?? 0}</p>
                        </div>
                        <div className="mezon-card">
                            <p className="text-xs uppercase tracking-[0.3em] text-[var(--mezon-text-soft)]">Команда</p>
                            <p className="text-3xl font-bold">{metrics?.employeesCount ?? 0}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-2xl font-semibold text-[var(--mezon-dark)]">Ключевые показатели</h2>
                    <span className="mezon-chip mezon-chip--teal">За последние 30 дней</span>
                </div>
                <div className="mezon-grid md:grid-cols-2 xl:grid-cols-4">
                    <KPICard title="Детей (активных)" value={summary?.kpi.childrenCount ?? 0} icon={Users} accent="var(--mezon-teal)" />
                    <KPICard title="Сотрудников" value={summary?.kpi.employeesCount ?? 0} icon={Briefcase} accent="#F1AE3D" />
                    <KPICard title="Кружков" value={summary?.kpi.activeClubs ?? 0} icon={School} accent="#8F93C0" />
                    <KPICard title="Доход" value={currency.format(income)} icon={TrendingUp} accent="#00A26A" />
                    <KPICard title="Расход" value={currency.format(expense)} icon={TrendingDown} accent="#F75C4C" />
                </div>
            </section>

            <section className="mezon-grid md:grid-cols-2 xl:grid-cols-3">
                {metrics && metrics.lowInventory.length > 0 && (
                    <div className="mezon-card">
                        <div className="mb-4 flex items-center gap-3 text-[var(--mezon-dark)]">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            <h3 className="text-lg font-semibold">Низкие запасы</h3>
                        </div>
                        <ul className="space-y-3 text-sm">
                            {metrics.lowInventory.map(item => (
                                <li key={item.id} className="flex justify-between font-medium">
                                    <span>{item.name}</span>
                                    <span className="text-red-600">
                                        {item.quantity} {item.unit}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {metrics && (
                    <div className="mezon-card">
                        <div className="mb-4 flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-[var(--mezon-teal)]" />
                            <h3 className="text-lg font-semibold">Посещаемость сегодня</h3>
                        </div>
                        <p className="text-4xl font-bold text-[var(--mezon-dark)]">{metrics.attendance.today}</p>
                        <p className="text-sm text-[var(--mezon-text-soft)]">детей присутствуют</p>
                    </div>
                )}

                {metrics && metrics.maintenance.activeRequests > 0 && (
                    <div className="mezon-card">
                        <div className="mb-4 flex items-center gap-3">
                            <Wrench className="h-5 w-5 text-[#F1AE3D]" />
                            <h3 className="text-lg font-semibold">Активные заявки</h3>
                        </div>
                        <p className="text-4xl font-bold text-[#F1AE3D]">
                            {metrics.maintenance.activeRequests}
                        </p>
                        <p className="text-sm text-[var(--mezon-text-soft)]">требуют внимания</p>
                    </div>
                )}

                {metrics && metrics.employees.needingMedicalCheckup > 0 && (
                    <div className="mezon-card">
                        <div className="mb-4 flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-[#F75C4C]" />
                            <h3 className="text-lg font-semibold">Медосмотры</h3>
                        </div>
                        <p className="text-4xl font-bold text-[#F75C4C]">
                            {metrics.employees.needingMedicalCheckup}
                        </p>
                        <p className="text-sm text-[var(--mezon-text-soft)]">сотрудникам нужна проверка</p>
                    </div>
                )}
            </section>
        </div>
    );
}