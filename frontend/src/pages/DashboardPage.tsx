import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { Users, Briefcase, School, TrendingUp, TrendingDown } from 'lucide-react';

type SummaryData = {
  kpi: {
    childrenCount: number;
    employeesCount: number;
    activeClubs: number;
    financeLast30d: { type: 'INCOME' | 'EXPENSE', _sum: { amount: number | null } }[];
  }
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await api.get('/api/dashboard/summary');
                setSummary(data);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Детей (активных)" value={summary?.kpi.childrenCount ?? 0} icon={Users} colorClass="bg-blue-500" />
                <KPICard title="Сотрудников" value={summary?.kpi.employeesCount ?? 0} icon={Briefcase} colorClass="bg-orange-500" />
                <KPICard title="Кружков (активных)" value={summary?.kpi.activeClubs ?? 0} icon={School} colorClass="bg-purple-500" />
                <KPICard title="Доход (30 дн.)" value={`${income} ₽`} icon={TrendingUp} colorClass="bg-green-500" />
                <KPICard title="Расход (30 дн.)" value={`${expense} ₽`} icon={TrendingDown} colorClass="bg-red-500" />
            </div>
        </div>
    );
}