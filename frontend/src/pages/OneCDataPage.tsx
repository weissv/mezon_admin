import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  FileText,
  Users,
  Wallet,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Database,
  Loader2,
} from "lucide-react";
import { api } from "../lib/api";

// ── Types ─────────────────────────────────────────────────────

interface Summary {
  catalogs: Record<string, number>;
  documents: { total: number; byType: { type: string; count: number }[] };
  hrDocuments: { total: number; byType: { type: string; count: number }[] };
  payrollDocuments: { total: number; byType: { type: string; count: number }[] };
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

type TabId = "catalogs" | "documents" | "hr" | "payroll";

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "catalogs", label: "Справочники", icon: <Building2 className="h-4 w-4" /> },
  { id: "documents", label: "Документы", icon: <FileText className="h-4 w-4" /> },
  { id: "hr", label: "Кадры", icon: <Users className="h-4 w-4" /> },
  { id: "payroll", label: "Зарплата", icon: <Wallet className="h-4 w-4" /> },
];

const catalogTypes: { key: string; label: string }[] = [
  { key: "organizations", label: "Организации" },
  { key: "nomenclature", label: "Номенклатура" },
  { key: "bank-accounts", label: "Банковские счета" },
  { key: "contracts", label: "Договоры" },
  { key: "employees", label: "Сотрудники" },
  { key: "positions", label: "Должности" },
  { key: "fixed-assets", label: "Основные средства" },
  { key: "warehouses", label: "Склады" },
  { key: "currencies", label: "Валюты" },
  { key: "departments", label: "Подразделения" },
];

// ── Helpers ────────────────────────────────────────────────────

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatAmount(v: string | number | null | undefined) {
  if (v == null) return "—";
  return Number(v).toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Pagination Component ──────────────────────────────────────

function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="p-1.5 rounded border disabled:opacity-30 hover:bg-gray-100"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm text-gray-600">
        {page} / {pages}
      </span>
      <button
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
        className="p-1.5 rounded border disabled:opacity-30 hover:bg-gray-100"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Catalogs Tab ──────────────────────────────────────────────

function CatalogsTab({ summary }: { summary: Summary | null }) {
  const [selected, setSelected] = useState(catalogTypes[0].key);
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (search) params.set("search", search);
      const res = await api.get<PaginatedResponse<any>>(`/onec-data/catalogs/${selected}?${params}`);
      setItems(res.items);
      setPages(res.pages);
      setTotal(res.total);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [selected, page, search]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [selected, search]);

  return (
    <div className="space-y-4">
      {/* Catalog cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {catalogTypes.map((c) => {
          const count = summary?.catalogs?.[c.key] ?? 0;
          return (
            <button
              key={c.key}
              onClick={() => setSelected(c.key)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                selected === c.key ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-xs text-gray-500">{c.label}</div>
              <div className="text-lg font-semibold">{count}</div>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Поиск..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-auto">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : items.length === 0 ? (
          <div className="text-center text-gray-400 py-10 text-sm">Нет данных</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Код</th>
                <th className="px-4 py-2 text-left font-medium">Наименование</th>
                <th className="px-4 py-2 text-left font-medium">Доп. информация</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-500 font-mono text-xs">{item.code || "—"}</td>
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs">
                    {item.fullName || item.accountNumber || item.inn || item.contractorRefKey || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Всего: {total}</span>
        <Pagination page={page} pages={pages} onPage={setPage} />
      </div>
    </div>
  );
}

// ── Documents Tab ─────────────────────────────────────────────

function DocumentsTab({ summary }: { summary: Summary | null }) {
  const byType = summary?.documents?.byType ?? [];
  const [selected, setSelected] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (selected) params.set("docType", selected);
      if (search) params.set("search", search);
      const res = await api.get<PaginatedResponse<any>>(`/onec-data/documents?${params}`);
      setItems(res.items);
      setPages(res.pages);
      setTotal(res.total);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [selected, page, search]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [selected, search]);

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelected("")}
          className={`text-xs rounded-full px-3 py-1 border transition-colors ${
            !selected ? "bg-blue-100 border-blue-400 text-blue-700" : "border-gray-200 hover:border-gray-300"
          }`}
        >
          Все ({summary?.documents?.total ?? 0})
        </button>
        {byType.map((t) => (
          <button
            key={t.type}
            onClick={() => setSelected(t.type)}
            className={`text-xs rounded-full px-3 py-1 border transition-colors ${
              selected === t.type ? "bg-blue-100 border-blue-400 text-blue-700" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {t.type} ({t.count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Поиск по номеру / комментарию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-auto">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : items.length === 0 ? (
          <div className="text-center text-gray-400 py-10 text-sm">Нет данных</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Тип</th>
                <th className="px-3 py-2 text-left font-medium">Номер</th>
                <th className="px-3 py-2 text-left font-medium">Дата</th>
                <th className="px-3 py-2 text-right font-medium">Сумма</th>
                <th className="px-3 py-2 text-left font-medium">Операция</th>
                <th className="px-3 py-2 text-center font-medium">Проведён</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((d: any) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs">{d.docType}</td>
                  <td className="px-3 py-2 font-mono text-xs">{d.documentNumber || "—"}</td>
                  <td className="px-3 py-2 text-xs">{formatDate(d.date)}</td>
                  <td className="px-3 py-2 text-right text-xs tabular-nums">{formatAmount(d.amount)}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{d.operationType || "—"}</td>
                  <td className="px-3 py-2 text-center">{d.posted ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Всего: {total}</span>
        <Pagination page={page} pages={pages} onPage={setPage} />
      </div>
    </div>
  );
}

// ── HR Tab ────────────────────────────────────────────────────

function HRTab({ summary }: { summary: Summary | null }) {
  const byType = summary?.hrDocuments?.byType ?? [];
  const [selected, setSelected] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (selected) params.set("docType", selected);
      const res = await api.get<PaginatedResponse<any>>(`/onec-data/hr-documents?${params}`);
      setItems(res.items);
      setPages(res.pages);
      setTotal(res.total);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [selected, page]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [selected]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelected("")}
          className={`text-xs rounded-full px-3 py-1 border transition-colors ${
            !selected ? "bg-blue-100 border-blue-400 text-blue-700" : "border-gray-200 hover:border-gray-300"
          }`}
        >
          Все ({summary?.hrDocuments?.total ?? 0})
        </button>
        {byType.map((t) => (
          <button
            key={t.type}
            onClick={() => setSelected(t.type)}
            className={`text-xs rounded-full px-3 py-1 border transition-colors ${
              selected === t.type ? "bg-blue-100 border-blue-400 text-blue-700" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {t.type} ({t.count})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border overflow-auto">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : items.length === 0 ? (
          <div className="text-center text-gray-400 py-10 text-sm">Нет данных</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Тип</th>
                <th className="px-3 py-2 text-left font-medium">Номер</th>
                <th className="px-3 py-2 text-left font-medium">Дата</th>
                <th className="px-3 py-2 text-left font-medium">Период</th>
                <th className="px-3 py-2 text-right font-medium">Сумма</th>
                <th className="px-3 py-2 text-center font-medium">Проведён</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((d: any) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs">{d.docType}</td>
                  <td className="px-3 py-2 font-mono text-xs">{d.documentNumber || "—"}</td>
                  <td className="px-3 py-2 text-xs">{formatDate(d.date)}</td>
                  <td className="px-3 py-2 text-xs">
                    {d.dateStart ? formatDate(d.dateStart) : "—"}
                    {d.dateEnd ? ` — ${formatDate(d.dateEnd)}` : ""}
                  </td>
                  <td className="px-3 py-2 text-right text-xs tabular-nums">{formatAmount(d.amount)}</td>
                  <td className="px-3 py-2 text-center">{d.posted ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Всего: {total}</span>
        <Pagination page={page} pages={pages} onPage={setPage} />
      </div>
    </div>
  );
}

// ── Payroll Tab ───────────────────────────────────────────────

function PayrollTab({ summary }: { summary: Summary | null }) {
  const byType = summary?.payrollDocuments?.byType ?? [];
  const [selected, setSelected] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (selected) params.set("docType", selected);
      const res = await api.get<PaginatedResponse<any>>(`/onec-data/payroll-documents?${params}`);
      setItems(res.items);
      setPages(res.pages);
      setTotal(res.total);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [selected, page]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [selected]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelected("")}
          className={`text-xs rounded-full px-3 py-1 border transition-colors ${
            !selected ? "bg-blue-100 border-blue-400 text-blue-700" : "border-gray-200 hover:border-gray-300"
          }`}
        >
          Все ({summary?.payrollDocuments?.total ?? 0})
        </button>
        {byType.map((t) => (
          <button
            key={t.type}
            onClick={() => setSelected(t.type)}
            className={`text-xs rounded-full px-3 py-1 border transition-colors ${
              selected === t.type ? "bg-blue-100 border-blue-400 text-blue-700" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {t.type} ({t.count})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border overflow-auto">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : items.length === 0 ? (
          <div className="text-center text-gray-400 py-10 text-sm">Нет данных</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Тип</th>
                <th className="px-3 py-2 text-left font-medium">Номер</th>
                <th className="px-3 py-2 text-left font-medium">Дата</th>
                <th className="px-3 py-2 text-left font-medium">Период</th>
                <th className="px-3 py-2 text-right font-medium">Сумма</th>
                <th className="px-3 py-2 text-center font-medium">Проведён</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((d: any) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs">{d.docType}</td>
                  <td className="px-3 py-2 font-mono text-xs">{d.documentNumber || "—"}</td>
                  <td className="px-3 py-2 text-xs">{formatDate(d.date)}</td>
                  <td className="px-3 py-2 text-xs">{d.period ? formatDate(d.period) : "—"}</td>
                  <td className="px-3 py-2 text-right text-xs tabular-nums">{formatAmount(d.amount)}</td>
                  <td className="px-3 py-2 text-center">{d.posted ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Всего: {total}</span>
        <Pagination page={page} pages={pages} onPage={setPage} />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function OneCDataPage() {
  const [activeTab, setActiveTab] = useState<TabId>("catalogs");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await api.get<Summary>("/onec-data/summary");
      setSummary(data);
    } catch {
      /* silent */
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await api.post("/integrations/1c/sync");
      await loadSummary();
    } catch {
      /* silent */
    } finally {
      setSyncing(false);
    }
  };

  const totalRecords =
    summary
      ? Object.values(summary.catalogs).reduce((a, b) => a + b, 0) +
        summary.documents.total +
        summary.hrDocuments.total +
        summary.payrollDocuments.total
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Database className="h-8 w-8 text-blue-600" />
            Данные 1С
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {summaryLoading ? "Загрузка..." : `${totalRecords.toLocaleString("ru-RU")} записей синхронизировано`}
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Синхронизация..." : "Синхронизировать"}
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-white p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Справочники</div>
            <div className="text-2xl font-bold mt-1">
              {Object.values(summary.catalogs).reduce((a, b) => a + b, 0).toLocaleString("ru-RU")}
            </div>
            <div className="text-xs text-gray-400">{Object.keys(summary.catalogs).length} типов</div>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Документы</div>
            <div className="text-2xl font-bold mt-1">{summary.documents.total.toLocaleString("ru-RU")}</div>
            <div className="text-xs text-gray-400">{summary.documents.byType.length} типов</div>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Кадры</div>
            <div className="text-2xl font-bold mt-1">{summary.hrDocuments.total.toLocaleString("ru-RU")}</div>
            <div className="text-xs text-gray-400">{summary.hrDocuments.byType.length} типов</div>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Зарплата</div>
            <div className="text-2xl font-bold mt-1">{summary.payrollDocuments.total.toLocaleString("ru-RU")}</div>
            <div className="text-xs text-gray-400">{summary.payrollDocuments.byType.length} типов</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="1C Data tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "catalogs" && <CatalogsTab summary={summary} />}
        {activeTab === "documents" && <DocumentsTab summary={summary} />}
        {activeTab === "hr" && <HRTab summary={summary} />}
        {activeTab === "payroll" && <PayrollTab summary={summary} />}
      </div>
    </div>
  );
}
