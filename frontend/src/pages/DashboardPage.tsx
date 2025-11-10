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

function KPICard({ title, value, icon: Icon, colorClass }: { title: string; value: string | number; icon: React.ElementType, colorClass: string }) {
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
                <div className={`p-3 rounded-full ${colorClass}`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [metrics, setMetrics] = useState<MetricsData | null>(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div>Загрузка...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Дашборд</h1>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <KPICard title="Детей (активных)" value={summary?.kpi.childrenCount ?? 0} icon={Users} colorClass="bg-blue-500" />
                <KPICard title="Сотрудников" value={summary?.kpi.employeesCount ?? 0} icon={Briefcase} colorClass="bg-orange-500" />
                <KPICard title="Кружков (активных)" value={summary?.kpi.activeClubs ?? 0} icon={School} colorClass="bg-purple-500" />
                <KPICard title="Доход (30 дн.)" value={`${income} ₽`} icon={TrendingUp} colorClass="bg-green-500" />
                <KPICard title="Расход (30 дн.)" value={`${expense} ₽`} icon={TrendingDown} colorClass="bg-red-500" />
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Low Inventory Alert */}
                {metrics && metrics.lowInventory.length > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center mb-4">
                            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                            <h3 className="font-semibold">Низкие запасы</h3>
                        </div>
                        <ul className="space-y-2">
                            {metrics.lowInventory.map(item => (
                                <li key={item.id} className="text-sm flex justify-between">
                                    <span>{item.name}</span>
                                    <span className="text-red-600 font-medium">
                                        {item.quantity} {item.unit}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Attendance Today */}
                {metrics && (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center mb-4">
                            <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                            <h3 className="font-semibold">Посещаемость сегодня</h3>
                        </div>
                        <p className="text-3xl font-bold">{metrics.attendance.today}</p>
                        <p className="text-sm text-gray-500 mt-1">детей присутствует</p>
                    </div>
                )}

                {/* Maintenance Alerts */}
                {metrics && metrics.maintenance.activeRequests > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center mb-4">
                            <Wrench className="h-5 w-5 text-yellow-500 mr-2" />
                            <h3 className="font-semibold">Активные заявки</h3>
                        </div>
                        <p className="text-3xl font-bold text-yellow-600">
                            {metrics.maintenance.activeRequests}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">требуют внимания</p>
                    </div>
                )}

                {/* Medical Checkup Reminders */}
                {metrics && metrics.employees.needingMedicalCheckup > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center mb-4">
                            <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                            <h3 className="font-semibold">Медосмотры</h3>
                        </div>
                        <p className="text-3xl font-bold text-orange-600">
                            {metrics.employees.needingMedicalCheckup}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">сотрудников нужны медосмотры</p>
                    </div>
                )}
            </div>
        </div>
    );
}