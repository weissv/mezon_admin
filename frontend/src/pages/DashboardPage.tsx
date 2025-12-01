import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Users, Briefcase, School, TrendingUp, TrendingDown, AlertTriangle, Calendar, Wrench, Calculator, Wallet, ChevronDown, ChevronUp, DollarSign, PieChart } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/ui/button';

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

type UnitEconomicsData = {
  period: { startDate: string; endDate: string; days: number; workingDays: number };
  children: { total: number; avgDaily: number };
  costs: {
    nutrition: { total: number; perChild: number; perChildDaily: number };
    salary: { total: number; perChild: number; perChildDaily: number };
    maintenance: { total: number; perChild: number; perChildDaily: number };
    clubs: { total: number; perChild: number; perChildDaily: number };
    other: { total: number; perChild: number; perChildDaily: number };
    depreciation: { total: number; perChild: number; perChildDaily: number };
  };
  totals: {
    totalCost: number;
    costPerChild: number;
    costPerChildDaily: number;
    costPerChildMonthly: number;
  };
  income: {
    total: number;
    perChild: number;
    margin: number;
    marginPercent: number;
  };
};

type CashForecastData = {
  currentBalance: number;
  forecast: Array<{
    date: string;
    dayOfWeek: number;
    dayName: string;
    expectedIncome: number;
    expectedExpense: number;
    netFlow: number;
    runningBalance: number;
    isGap: boolean;
    gapAmount?: number;
  }>;
  summary: {
    totalExpectedIncome: number;
    totalExpectedExpense: number;
    netCashFlow: number;
    daysWithGaps: number;
    maxGapAmount: number;
    minBalance: number;
    recommendations: string[];
  };
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
    const { user } = useAuth();
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [metrics, setMetrics] = useState<MetricsData | null>(null);
    const [unitEconomics, setUnitEconomics] = useState<UnitEconomicsData | null>(null);
    const [cashForecast, setCashForecast] = useState<CashForecastData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showUnitDetails, setShowUnitDetails] = useState(false);
    const [showForecastDetails, setShowForecastDetails] = useState(false);
    const [currentBalance, setCurrentBalance] = useState("50000000"); // 50 млн по умолчанию
    const currency = new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 });
    
    const isDirectorOrAdmin = user?.role === 'DIRECTOR' || user?.role === 'DEPUTY' || user?.role === 'ADMIN';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [summaryData, metricsData] = await Promise.all([
                    api.get('/api/dashboard/summary'),
                    api.get('/api/dashboard/metrics'),
                ]);
                setSummary(summaryData);
                setMetrics(metricsData);
                
                // Загружаем финансовое прогнозирование для директора/админа
                if (user?.role === 'DIRECTOR' || user?.role === 'DEPUTY' || user?.role === 'ADMIN') {
                    try {
                        const [unitData, forecastData] = await Promise.all([
                            api.get('/api/finance/unit-economics?months=3'),
                            api.get(`/api/finance/cash-forecast?days=30&currentBalance=${currentBalance}`),
                        ]);
                        setUnitEconomics(unitData);
                        setCashForecast(forecastData);
                    } catch (financeError) {
                        console.error('Finance data error:', financeError);
                    }
                }
            } catch (error: any) {
                toast.error('Ошибка загрузки данных', { description: error?.message });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.role]);

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

            {/* ======== ФИНАНСОВОЕ ПРОГНОЗИРОВАНИЕ (только для DIRECTOR/DEPUTY/ADMIN) ======== */}
            {isDirectorOrAdmin && (
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Calculator className="h-6 w-6 text-[var(--mezon-accent)]" />
                        <h2 className="text-2xl font-semibold text-[var(--mezon-dark)]">Финансовое прогнозирование</h2>
                    </div>

                    <div className="mezon-grid md:grid-cols-2">
                        {/* Unit-экономика */}
                        {unitEconomics && (
                            <div className="mezon-card">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                                            <PieChart className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-[var(--mezon-dark)]">Unit-экономика</h3>
                                            <p className="text-xs text-[var(--mezon-text-soft)]">Стоимость 1 ребёнка</p>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => setShowUnitDetails(!showUnitDetails)}
                                    >
                                        {showUnitDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                </div>

                                {/* Главные цифры */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="p-3 bg-purple-50 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-purple-700">
                                            {currency.format(unitEconomics.totals.costPerChildMonthly)}
                                        </p>
                                        <p className="text-xs text-purple-600">в месяц на ребёнка</p>
                                    </div>
                                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-blue-700">
                                            {currency.format(unitEconomics.totals.costPerChildDaily)}
                                        </p>
                                        <p className="text-xs text-blue-600">в день на ребёнка</p>
                                    </div>
                                </div>

                                {/* Маржинальность */}
                                <div className={`p-3 rounded-lg mb-4 ${unitEconomics.income.marginPercent >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Маржа:</span>
                                        <span className={`text-lg font-bold ${unitEconomics.income.marginPercent >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                            {unitEconomics.income.marginPercent}%
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">
                                        {currency.format(unitEconomics.income.margin)} за {unitEconomics.period.workingDays} раб. дней
                                    </p>
                                </div>

                                {/* Детали */}
                                {showUnitDetails && (
                                    <div className="space-y-3 pt-3 border-t">
                                        <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">Структура расходов на ребёнка:</p>
                                        {[
                                            { label: '🍽️ Питание', value: unitEconomics.costs.nutrition.perChild, color: 'bg-orange-100 text-orange-700' },
                                            { label: '💼 Зарплаты', value: unitEconomics.costs.salary.perChild, color: 'bg-blue-100 text-blue-700' },
                                            { label: '🔧 Обслуживание', value: unitEconomics.costs.maintenance.perChild, color: 'bg-yellow-100 text-yellow-700' },
                                            { label: '🎨 Кружки', value: unitEconomics.costs.clubs.perChild, color: 'bg-pink-100 text-pink-700' },
                                            { label: '📦 Амортизация', value: unitEconomics.costs.depreciation.perChild, color: 'bg-gray-100 text-gray-700' },
                                            { label: '📋 Прочее', value: unitEconomics.costs.other.perChild, color: 'bg-purple-100 text-purple-700' },
                                        ].map((item) => (
                                            <div key={item.label} className="flex items-center justify-between text-sm">
                                                <span>{item.label}</span>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${item.color}`}>
                                                    {currency.format(item.value)}
                                                </span>
                                            </div>
                                        ))}
                                        <div className="pt-2 mt-2 border-t flex justify-between text-sm font-semibold">
                                            <span>Всего детей:</span>
                                            <span>{unitEconomics.children.total}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Средняя посещаемость:</span>
                                            <span>{unitEconomics.children.avgDaily} / день</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Прогноз кассовых разрывов */}
                        {cashForecast && (
                            <div className="mezon-card">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cashForecast.summary.daysWithGaps > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                                            <Wallet className={`h-5 w-5 ${cashForecast.summary.daysWithGaps > 0 ? 'text-red-600' : 'text-green-600'}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-[var(--mezon-dark)]">Кассовый прогноз</h3>
                                            <p className="text-xs text-[var(--mezon-text-soft)]">На 30 дней</p>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => setShowForecastDetails(!showForecastDetails)}
                                    >
                                        {showForecastDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                </div>

                                {/* Рекомендации */}
                                <div className="space-y-2 mb-4">
                                    {cashForecast.summary.recommendations.map((rec, i) => (
                                        <div key={i} className={`p-2 rounded text-sm ${
                                            rec.includes('✅') ? 'bg-green-50 text-green-700' :
                                            rec.includes('🚨') ? 'bg-red-50 text-red-700' :
                                            rec.includes('⚠️') ? 'bg-yellow-50 text-yellow-700' :
                                            'bg-blue-50 text-blue-700'
                                        }`}>
                                            {rec}
                                        </div>
                                    ))}
                                </div>

                                {/* Сводка */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-green-50 rounded-lg">
                                        <p className="text-xs text-green-600">Ожидаемый доход</p>
                                        <p className="text-lg font-bold text-green-700">
                                            {currency.format(cashForecast.summary.totalExpectedIncome)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-red-50 rounded-lg">
                                        <p className="text-xs text-red-600">Ожидаемый расход</p>
                                        <p className="text-lg font-bold text-red-700">
                                            {currency.format(cashForecast.summary.totalExpectedExpense)}
                                        </p>
                                    </div>
                                </div>

                                {/* Детальный прогноз */}
                                {showForecastDetails && (
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-3">
                                            Прогноз по дням (ближайшие 14 дней):
                                        </p>
                                        <div className="max-h-64 overflow-y-auto space-y-1">
                                            {cashForecast.forecast.slice(0, 14).map((day) => (
                                                <div 
                                                    key={day.date} 
                                                    className={`flex items-center justify-between p-2 rounded text-sm ${
                                                        day.isGap ? 'bg-red-50' : 
                                                        day.dayOfWeek === 0 || day.dayOfWeek === 6 ? 'bg-gray-50' : ''
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-6 text-center text-xs font-medium ${
                                                            day.dayOfWeek === 0 || day.dayOfWeek === 6 ? 'text-gray-400' : ''
                                                        }`}>
                                                            {day.dayName}
                                                        </span>
                                                        <span className="text-gray-600">
                                                            {new Date(day.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-xs ${day.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {day.netFlow >= 0 ? '+' : ''}{(day.netFlow / 1000000).toFixed(1)}M
                                                        </span>
                                                        <span className={`font-medium ${day.isGap ? 'text-red-700' : 'text-gray-700'}`}>
                                                            {(day.runningBalance / 1000000).toFixed(1)}M
                                                        </span>
                                                        {day.isGap && (
                                                            <AlertTriangle className="h-4 w-4 text-red-500" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Мини-график */}
                                        <div className="mt-4 h-16 flex items-end gap-1">
                                            {cashForecast.forecast.slice(0, 30).map((day, i) => {
                                                const maxBalance = Math.max(...cashForecast.forecast.map(d => Math.abs(d.runningBalance)));
                                                const height = Math.max(5, Math.abs(day.runningBalance) / maxBalance * 100);
                                                return (
                                                    <div 
                                                        key={i}
                                                        className={`flex-1 rounded-t transition-all ${
                                                            day.isGap ? 'bg-red-400' : 
                                                            day.runningBalance > 0 ? 'bg-green-400' : 'bg-yellow-400'
                                                        }`}
                                                        style={{ height: `${height}%` }}
                                                        title={`${day.date}: ${currency.format(day.runningBalance)}`}
                                                    />
                                                );
                                            })}
                                        </div>
                                        <p className="text-xs text-center text-gray-400 mt-1">
                                            Баланс на каждый день (30 дней)
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}