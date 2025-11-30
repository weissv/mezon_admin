import React, { useState } from "react";
import { toast } from "sonner";
import { useApi } from "../hooks/useApi";
import { DataTable, Column } from "../components/DataTable/DataTable";
import { Card } from "../components/Card";
import { Button } from "../components/ui/button";
import { Modal } from "../components/Modal";
import { TransactionForm } from "../components/forms/TransactionForm";
import { Transaction } from "../types/finance";
import { FINANCE_TYPES, FINANCE_CATEGORIES } from "../lib/constants";
import { api } from "../lib/api";
import { Download, TrendingUp, TrendingDown, DollarSign, Trash2, AlertTriangle } from "lucide-react";

const currency = new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 });

const TransactionsView = () => {
  const { data: transactions, total, page, setPage, fetchData } = useApi<Transaction>({
    url: "/api/finance/transactions",
    initialPageSize: 20,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    fetchData();
  };

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

  const openDeleteModal = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingTransaction) return;
    setDeleting(true);
    try {
      await api.delete(`/api/finance/transactions/${deletingTransaction.id}`);
      toast.success('Транзакция удалена');
      setDeleteModalOpen(false);
      setDeletingTransaction(null);
      fetchData();
    } catch (error: any) {
      toast.error('Ошибка удаления', { description: error?.message });
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Transaction>[] = [
    { key: "date", header: "Дата", render: (row) => new Date(row.date).toLocaleDateString() },
    { key: "type", header: "Тип", render: (row) => FINANCE_TYPES[row.type as keyof typeof FINANCE_TYPES] || row.type },
    { key: "category", header: "Категория", render: (row) => FINANCE_CATEGORIES[row.category as keyof typeof FINANCE_CATEGORIES] || row.category },
    { key: "amount", header: "Сумма", render: (row) => currency.format(row.amount) },
    { key: "description", header: "Описание" },
    {
      key: "actions",
      header: "Действия",
      render: (row) => (
        <Button variant="destructive" size="sm" onClick={() => openDeleteModal(row)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between mb-4">
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" /> Экспорт CSV
        </Button>
        <Button onClick={() => setIsModalOpen(true)}>Добавить транзакцию</Button>
      </div>
      <DataTable columns={columns} data={transactions} page={page} pageSize={20} total={total} onPageChange={setPage} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Новая транзакция">
        <TransactionForm onSuccess={handleFormSuccess} onCancel={() => setIsModalOpen(false)} />
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Подтверждение удаления">
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800">Внимание!</h4>
              <p className="text-red-700 text-sm mt-1">
                Вы собираетесь удалить транзакцию. Это действие нельзя отменить.
              </p>
            </div>
          </div>
          {deletingTransaction && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p><strong>Дата:</strong> {new Date(deletingTransaction.date).toLocaleDateString()}</p>
              <p><strong>Тип:</strong> {FINANCE_TYPES[deletingTransaction.type as keyof typeof FINANCE_TYPES] || deletingTransaction.type}</p>
              <p><strong>Сумма:</strong> {currency.format(deletingTransaction.amount)}</p>
              <p><strong>Описание:</strong> {deletingTransaction.description || '—'}</p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const ReportsView = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/finance/reports/summary');
      setSummary(data);
    } catch (error: any) {
      toast.error('Ошибка загрузки отчета', { description: error?.message });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadSummary();
  }, []);

  if (loading) return <div className="p-4">Загрузка отчета...</div>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
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

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<"transactions" | "reports">("transactions");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Финансы</h1>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("transactions")}
            className={`${activeTab === 'transactions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Транзакции
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`${activeTab === 'reports' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Отчеты
          </button>
        </nav>
      </div>

      <div>
        {activeTab === "transactions" && <TransactionsView />}
        {activeTab === "reports" && <ReportsView />}
      </div>
    </div>
  );
}