import React from "react";
import { Card } from "../../../components/Card";
import { api } from "../../../lib/api";
import type { DebtorsResponse, DebtorItem } from "../../../types/finance";
import { Users, AlertTriangle, TrendingUp } from "lucide-react";

const currency = new Intl.NumberFormat("uz-UZ", {
  style: "currency",
  currency: "UZS",
  maximumFractionDigits: 0,
});

export default function DebtorsView() {
  const [data, setData] = React.useState<DebtorsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api
      .get("/api/finance/debtors?pageSize=50")
      .then((res: DebtorsResponse) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Загрузка дебиторов...
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Users className="mx-auto h-10 w-10 text-gray-300 mb-3" />
        <p className="text-gray-500 text-lg">Нет данных о дебиторской задолженности</p>
        <p className="text-gray-400 text-sm mt-1">Информация появится после синхронизации с 1С</p>
      </Card>
    );
  }

  const totalDebt = data.items.reduce((s, d) => s + Number(d.amount), 0);
  const maxDebt = Math.max(...data.items.map((d) => Math.abs(Number(d.amount))));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Общая задолженность</p>
            <p className="text-xl font-bold text-red-600">{currency.format(totalDebt)}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-100">
            <Users className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Дебиторов</p>
            <p className="text-xl font-bold text-gray-800">{data.items.length}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50">
            <TrendingUp className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Макс. долг</p>
            <p className="text-xl font-bold text-amber-700">{currency.format(maxDebt)}</p>
          </div>
        </Card>
      </div>

      {data.snapshotDate && (
        <p className="text-xs text-gray-400">
          Данные на: {new Date(data.snapshotDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      )}

      {/* Debtor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.items
          .sort((a, b) => Math.abs(Number(b.amount)) - Math.abs(Number(a.amount)))
          .map((item, idx) => (
            <DebtorCard key={item.contractorId ?? idx} item={item} maxDebt={maxDebt} />
          ))}
      </div>
    </div>
  );
}

function DebtorCard({ item, maxDebt }: { item: DebtorItem; maxDebt: number }) {
  const absAmount = Math.abs(Number(item.amount));
  const pct = maxDebt > 0 ? (absAmount / maxDebt) * 100 : 0;
  const isNegative = Number(item.amount) < 0;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-800">{item.contractorName}</p>
          {item.contractorInn && (
            <p className="text-xs text-gray-400 mt-0.5">ИНН: {item.contractorInn}</p>
          )}
        </div>
        <span
          className={`text-lg font-bold ${
            isNegative ? "text-red-600" : "text-emerald-600"
          }`}
        >
          {currency.format(Number(item.amount))}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isNegative ? "bg-red-400" : "bg-emerald-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </Card>
  );
}
