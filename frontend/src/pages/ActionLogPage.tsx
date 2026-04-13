import { useEffect, useMemo, useState } from "react";
import { Clock, FileText, Search, User } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "../components/DataTable/DataTable";
import { EmptyListState, ErrorState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/input";
import { LoadingCard } from "../components/ui/LoadingState";
import { PageHeader, PageStack, PageToolbar } from "../components/ui/page";
import { api } from "../lib/api";

type Log = {
  id: number;
  action: string;
  details: any;
  timestamp: string;
  user: { email: string };
};

export default function ActionLogPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get("/api/actionlog");
      setLogs(data || []);
    } catch (err: any) {
      const message = err?.message || "Ошибка загрузки журнала";
      setError(message);
      toast.error("Ошибка загрузки журнала", { description: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return logs;
    return logs.filter((log) =>
      [log.action, log.user?.email, JSON.stringify(log.details ?? {})].join(" ").toLowerCase().includes(query),
    );
  }, [logs, search]);

  const columns: Column<Log>[] = [
    {
      key: "action",
      header: "Действие",
      render: (row) => (
        <div className="space-y-1">
          <div className="font-semibold text-primary">{row.action}</div>
          <div className="inline-flex items-center gap-1 text-sm text-secondary">
            <User className="h-4 w-4" />
            {row.user.email}
          </div>
        </div>
      ),
    },
    {
      key: "timestamp",
      header: "Время",
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-secondary">
          <Clock className="h-4 w-4" />
          {new Date(row.timestamp).toLocaleString("ru-RU")}
        </span>
      ),
    },
    {
      key: "details",
      header: "Подробности",
      render: (row) =>
        row.details && Object.keys(row.details).length > 0 ? (
          <details>
            <summary className="cursor-pointer text-sm text-macos-blue">Открыть JSON</summary>
            <pre className="mt-2 overflow-x-auto rounded-md bg-[rgba(255,255,255,0.58)] p-3 text-xs">
              {JSON.stringify(row.details, null, 2)}
            </pre>
          </details>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <PageStack>
      <PageHeader
        eyebrow="Audit · действия"
        title="Журнал действий"
        icon={<FileText className="h-5 w-5" />}
        meta={<span className="mezon-badge macos-badge-neutral">{filteredLogs.length} записей</span>}
        description="Плотный аудит-реестр для просмотра действий пользователей и системных событий с быстрым поиском по действию, пользователю и деталям."
      />

      <PageToolbar>
        <div className="mezon-toolbar-group">
          <div className="mezon-input-shell">
            <Search className="mezon-input-shell__icon h-4 w-4" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по действию, пользователю или деталям"
              className="min-w-[280px]"
            />
          </div>
        </div>
      </PageToolbar>

      <DataTable
        title="Лента аудита"
        description="Последние изменения, административные действия и системные события в едином реестре для разбора инцидентов."
        toolbar={<span className="mezon-data-table__toolbar-pill">Всего: {logs.length}</span>}
        columns={columns}
        data={filteredLogs}
        page={1}
        pageSize={Math.max(filteredLogs.length || 1, 1)}
        total={filteredLogs.length}
        onPageChange={() => {}}
        density="compact"
        wrapCells
        emptyState={
          loading ? (
            <LoadingCard message="Загрузка журнала действий..." height={220} />
          ) : error ? (
            <ErrorState message={error} onRetry={loadLogs} className="py-10" />
          ) : (
            <EmptyListState
              title="Журнал пуст"
              description="В журнале пока нет записей о действиях пользователей или системных событиях."
              className="py-10"
            />
          )
        }
      />
    </PageStack>
  );
}
