import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { DataTable, Column } from "../components/DataTable/DataTable";
import { Card } from "../components/Card";
import { Button } from "../components/ui/button";
import { Modal } from "../components/Modal";
import { TransactionForm } from "../components/forms/TransactionForm";
import { Transaction } from "../types/finance";
import { FINANCE_TYPES, FINANCE_CATEGORIES } from "../lib/constants";

const TransactionsView = () => {
  const { data: transactions, total, page, setPage, fetchData } = useApi<Transaction>({
    url: "/api/finance/transactions",
    initialPageSize: 20,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    fetchData();
  };

  const columns: Column<Transaction>[] = [
    { key: "date", header: "Дата", render: (row) => new Date(row.date).toLocaleDateString() },
    { key: "type", header: "Тип", render: (row) => FINANCE_TYPES[row.type as keyof typeof FINANCE_TYPES] || row.type },
    { key: "category", header: "Категория", render: (row) => FINANCE_CATEGORIES[row.category as keyof typeof FINANCE_CATEGORIES] || row.category },
    { key: "amount", header: "Сумма", render: (row) => `${row.amount} руб.` },
    { key: "description", header: "Описание" },
  ];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsModalOpen(true)}>Добавить транзакцию</Button>
      </div>
      <DataTable columns={columns} data={transactions} page={page} pageSize={20} total={total} onPageChange={setPage} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Новая транзакция">
        <TransactionForm onSuccess={handleFormSuccess} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

const ReportsView = () => {
  return (
    <Card>
      <div className="p-4 text-center text-gray-500">
        Раздел отчетов находится в разработке.
      </div>
    </Card>
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