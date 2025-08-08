import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { DataTable } from "../components/DataTable/DataTable";
import { Card } from "../components/Card";
import { Button } from "../components/ui/button";
import { Modal } from "../components/Modal";
import { Input } from "../components/ui/input";

// Типы для данных, чтобы код был чище
type Transaction = {
  id: number;
  amount: number;
  type: string;
  category: string;
  description?: string;
  date: string;
};

// Эмуляция Enum с бэкенда для использования в UI [cite: 30-39]
const FINANCE_TYPES = { INCOME: "Доход", EXPENSE: "Расход" };
const FINANCE_CATEGORIES = {
  NUTRITION: "Питание",
  CLUBS: "Кружки",
  MAINTENANCE: "Хоз. нужды",
  SALARY: "Зарплата",
};

// Отдельный компонент для вкладки "Транзакции"
const TransactionsView = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState({ amount: "", type: "INCOME", category: "CLUBS", description: "", date: new Date().toISOString().split("T")[0] });

  // Загрузка данных с сервера
  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    api.get(`/api/finance/transactions?${params.toString()}`)
      .then((data) => {
        setTransactions(data.items || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Обработчик для формы добавления транзакции
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/finance/transactions", { ...formState, amount: parseFloat(formState.amount) });
      setIsModalOpen(false);
      fetchData(); // Обновляем список после добавления
    } catch (error) {
      console.error("Failed to create transaction", error);
      alert("Ошибка при добавлении транзакции");
    }
  };

  const columns = [
    { key: "date", header: "Дата", render: (row: Transaction) => new Date(row.date).toLocaleDateString() },
    { key: "type", header: "Тип", render: (row: Transaction) => FINANCE_TYPES[row.type as keyof typeof FINANCE_TYPES] || row.type },
    { key: "category", header: "Категория", render: (row: Transaction) => FINANCE_CATEGORIES[row.category as keyof typeof FINANCE_CATEGORIES] || row.category },
    { key: "amount", header: "Сумма", render: (row: Transaction) => `${row.amount} руб.` },
    { key: "description", header: "Описание" },
  ];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsModalOpen(true)}>Добавить транзакцию</Button>
      </div>
      <DataTable columns={columns} data={transactions} page={page} pageSize={20} total={total} onPageChange={setPage} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Новая транзакция">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input type="date" value={formState.date} onChange={e => setFormState({...formState, date: e.target.value})} required />
          <Input type="number" placeholder="Сумма" value={formState.amount} onChange={e => setFormState({...formState, amount: e.target.value})} required />
          <select value={formState.type} onChange={e => setFormState({...formState, type: e.target.value})} className="w-full p-2 border rounded">
            {Object.entries(FINANCE_TYPES).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
          </select>
          <select value={formState.category} onChange={e => setFormState({...formState, category: e.target.value})} className="w-full p-2 border rounded">
            {Object.entries(FINANCE_CATEGORIES).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
          </select>
          <Input placeholder="Описание" value={formState.description} onChange={e => setFormState({...formState, description: e.target.value})} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Отмена</Button>
            <Button type="submit">Сохранить</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Отдельный компонент для вкладки "Отчеты"
const ReportsView = () => {
  // Тут будет логика для отчетов. Пока это просто заглушка.
  return (
    <Card>
      <div className="p-4 text-center text-gray-500">
        Раздел отчетов находится в разработке.
      </div>
    </Card>
  );
};


// Основной компонент страницы
export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<"transactions" | "reports">("transactions");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Финансы</h1>

      {/* Переключатель вкладок */}
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

      {/* Отображение содержимого активной вкладки */}
      <div>
        {activeTab === "transactions" && <TransactionsView />}
        {activeTab === "reports" && <ReportsView />}
      </div>
    </div>
  );
}