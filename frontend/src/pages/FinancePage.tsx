import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useApi } from "../hooks/useApi";
import { DataTable, Column } from "../components/DataTable/DataTable";
import { Card } from "../components/Card";
import { Button } from "../components/ui/button";
import type { FinanceTransaction, Invoice, BalancesResponse, DebtorsResponse, ContractorRef, CashFlowArticleRef } from "../types/finance";
import { FINANCE_TYPES, FINANCE_CATEGORIES, TRANSACTION_CHANNELS, INVOICE_DIRECTIONS } from "../lib/constants";
import { api } from "../lib/api";
import { Download, TrendingUp, TrendingDown, DollarSign, Wallet, Landmark, FileText, Users, Search } from "lucide-react";

const currency = new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 });

// ── Balance Cards ──
const BalanceCards = () => {
  const [data, setData] = useState<BalancesResponse | null>(null);

  useEffect(() => {
    api.get('/api/finance/balances').then(setData).catch(() => {});
  }, []);

  if (!data || data.balances.length === 0) return null;

  const cash = data.balances.find(b => b.type === 'CASH');
  const bank = data.balances.find(b => b.type === 'BANK');
  const total = (cash?.amount ?? 0) + (bank?.amount ?? 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <Wallet className="h-8 w-8 text-green-600" />
          <div>
            <p className="text-sm text-gray-500">Касса</p>
            <p className="text-xl font-bold">{cash != null ? currency.format(cash.amount) : '—'}</p>
          </div>
        </div>
      </Card>
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <Landmark className="h-8 w-8 text-blue-600" />
          <div>
            <p className="text-sm text-gray-500">Расчётный счёт</p>
            <p className="text-xl font-bold">{bank != null ? currency.format(bank.amount) : '—'}</p>
          </div>
        </div>
      </Card>
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-purple-600" />
          <div>
            <p className="text-sm text-gray-500">Итого</p>
            <p className="text-xl font-bold">{currency.format(total)}</p>
          </div>
        </div>
      </Card>
      {data.snapshotDate && (
        <p className="col-span-full text-xs text-gray-400">
          Данные на {new Date(data.snapshotDate).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};

// ── Transactions View (read-only) ──
const TransactionsView = () => {
  const [channelFilter, setChannelFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const extraParams = new URLSearchParams();
  if (channelFilter) extraParams.set('channel', channelFilter);
  if (typeFilter) extraParams.set('type', typeFilter);
  if (searchQuery) extraParams.set('search', searchQuery);

  const { data: transactions, total, page, setPage, fetchData } = useApi<FinanceTransaction>({
    url: `/api/finance/transactions${extraParams.toString() ? `?${extraParams}` : ''}`,
    initialPageSize: 20,
  });

  const handleExport = async () => {
    try {
      const blob = await api.download('/api/finance/export');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Экспорт завершен');
    } catch (error: any) {
      toast.error('Ошибка экспорта', { description: error?.message });
    }
  };

  const columns: Column<FinanceTransaction>[] = [
    { key: "date", header: "Дата", render: (row) => new Date(row.date).toLocaleDateString() },
    { key: "channel", header: "Канал", render: (row) => row.channel ? TRANSACTION_CHANNELS[row.channel] : '—' },
    { key: "type", header: "Тип", render: (row) => (
      <span className={row.type === 'INCOME' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
        {FINANCE_TYPES[row.type]}
      </span>
    )},
    { key: "amount", header: "Сумма", render: (row) => currency.format(Number(row.amount)) },
    { key: "category", header: "Категория", render: (row) => FINANCE_CATEGORIES[row.category] || row.category },
    { key: "contractor", header: "Контрагент", render: (row) => row.contractor?.name || row.person?.name || '—' },
    { key: "cashFlowArticle", header: "Статья ДДС", render: (row) => row.cashFlowArticle?.name || '—' },
    { key: "documentNumber", header: "№ док.", render: (row) => row.documentNumber || '—' },
    { key: "description", header: "Описание", render: (row) => row.description || row.purpose || '—' },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <select
          className="border rounded px-3 py-2 text-sm"
          value={channelFilter}
          onChange={e => setChannelFilter(e.target.value)}
        >
          <option value="">Все каналы</option>
          <option value="CASH">Касса</option>
          <option value="BANK">Банк</option>
        </select>
        <select
          className="border rounded px-3 py-2 text-sm"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="">Все типы</option>
          <option value="INCOME">Доход</option>
          <option value="EXPENSE">Расход</option>
        </select>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск..."
            className="border rounded pl-8 pr-3 py-2 text-sm w-56"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="ml-auto">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Экспорт CSV
          </Button>
        </div>
      </div>
      <DataTable columns={columns} data={transactions} page={page} pageSize={20} total={total} onPageChange={setPage} />
    </div>
  );
};

// ── Invoices View ──
const InvoicesView = () => {
  const { data: invoices, total, page, setPage } = useApi<Invoice>({
    url: "/api/finance/invoices",
    initialPageSize: 20,
  });

  const columns: Column<Invoice>[] = [
    { key: "date", header: "Дата", render: (row) => new Date(row.date).toLocaleDateString() },
    { key: "direction", header: "Направление", render: (row) => (
      <span className={row.direction === 'INCOMING' ? 'text-blue-600' : 'text-orange-600'}>
        {INVOICE_DIRECTIONS[row.direction]}
      </span>
    )},
    { key: "documentNumber", header: "№ документа", render: (row) => row.documentNumber || '—' },
    { key: "totalAmount", header: "Сумма", render: (row) => currency.format(Number(row.totalAmount)) },
    { key: "contractor", header: "Контрагент", render: (row) => row.contractor?.name || '—' },
    { key: "posted", header: "Проведён", render: (row) => row.posted ? '✓' : '—' },
    { key: "comment", header: "Комментарий", render: (row) => row.comment || '—' },
  ];

  return (
    <DataTable columns={columns} data={invoices} page={page} pageSize={20} total={total} onPageChange={setPage} />
  );
};

// ── Debtors View ──
const DebtorsView = () => {
  const [data, setData] = useState<DebtorsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/finance/debtors?pageSize=50')
      .then(setData)
      .catch(() => toast.error('Ошибка загрузки дебиторов'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Загрузка...</div>;
  if (!data || data.items.length === 0) {
    return <div className="p-4 text-gray-500">Нет данных о дебиторах</div>;
  }

  return (
    <div className="space-y-4">
      {data.snapshotDate && (
        <p className="text-xs text-gray-400">Данные на {new Date(data.snapshotDate).toLocaleDateString()}</p>
      )}
      <div className="space-y-2">
        {data.items.map((d, idx) => (
          <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <p className="font-medium">{d.contractorName}</p>
              {d.contractorInn && <p className="text-xs text-gray-500">ИНН: {d.contractorInn}</p>}
            </div>
            <p className={`font-bold ${Number(d.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {currency.format(d.amount)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Reports View ──
const ReportsView = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/api/finance/reports/summary')
      .then(setSummary)
      .catch((error: any) => toast.error('Ошибка загрузки отчета', { description: error?.message }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Загрузка отчета...</div>;

  return (
    <div className="space-y-6">
      {summary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Всего транзакций</p>
                  <p className="text-2xl font-bold">{summary.totals?.totalTransactions || 0}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Доходы</p>
                  <p className="text-2xl font-bold text-green-600">
                    {currency.format(summary.byType?.find((t: any) => t.type === 'INCOME')?._sum?.amount || 0)}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center">
                <TrendingDown className="h-8 w-8 text-red-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Расходы</p>
                  <p className="text-2xl font-bold text-red-600">
                    {currency.format(summary.byType?.find((t: any) => t.type === 'EXPENSE')?._sum?.amount || 0)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* By Category */}
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4">По категориям</h3>
            <div className="space-y-2">
              {summary.byCategory?.map((cat: any, idx: number) => (
                <div key={idx} className="flex justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">{FINANCE_CATEGORIES[cat.category as keyof typeof FINANCE_CATEGORIES] || cat.category}</span>
                  <div className="text-right">
                    <div className="font-bold">{currency.format(cat._sum?.amount || 0)}</div>
                    <div className="text-sm text-gray-600">{cat._count?.id || 0} транзакций</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* By Channel */}
          {summary.byChannel && summary.byChannel.length > 0 && (
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">По каналам</h3>
              <div className="space-y-2">
                {summary.byChannel.map((ch: any, idx: number) => (
                  <div key={idx} className="flex justify-between p-3 bg-gray-50 rounded">
                    <span className="font-medium">{ch.channel ? TRANSACTION_CHANNELS[ch.channel as keyof typeof TRANSACTION_CHANNELS] : 'Не указан'}</span>
                    <div className="text-right">
                      <div className="font-bold">{currency.format(ch._sum?.amount || 0)}</div>
                      <div className="text-sm text-gray-600">{ch._count?.id || 0} транзакций</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* By Source */}
          {summary.bySource && summary.bySource.length > 0 && (
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">По источникам</h3>
              <div className="space-y-2">
                {summary.bySource.map((src: any, idx: number) => (
                  <div key={idx} className="flex justify-between p-3 bg-gray-50 rounded">
                    <span className="font-medium">{src.source || 'Не указан'}</span>
                    <div className="text-right">
                      <div className="font-bold">{currency.format(src._sum?.amount || 0)}</div>
                      <div className="text-sm text-gray-600">{src._count?.id || 0} транзакций</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

type TabId = "transactions" | "invoices" | "debtors" | "reports";

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<TabId>("transactions");

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "transactions", label: "Транзакции", icon: <DollarSign className="h-4 w-4" /> },
    { id: "invoices", label: "Накладные", icon: <FileText className="h-4 w-4" /> },
    { id: "debtors", label: "Дебиторы", icon: <Users className="h-4 w-4" /> },
    { id: "reports", label: "Отчеты", icon: <TrendingUp className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Финансы</h1>

      <BalanceCards />

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {activeTab === "transactions" && <TransactionsView />}
        {activeTab === "invoices" && <InvoicesView />}
        {activeTab === "debtors" && <DebtorsView />}
        {activeTab === "reports" && <ReportsView />}
      </div>
    </div>
  );
}