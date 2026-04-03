import { useEffect, useMemo, useState } from "react";
import { HR_REGISTER_TYPES } from "../register-groups";
import { listOneCHRDocuments } from "../api";
import { usePaginatedOneCResource } from "../hooks";
import type { OneCHRDocumentItem, OneCSummary } from "../types";
import { FilterChips, SectionTable, formatAmount, formatDate, type TableColumn } from "./shared";
import { ScopedRegistersTab } from "./scoped-registers-tab";

type HRSubTab = "documents" | "registers";

function HRDocumentsSection({ summary }: { summary: OneCSummary | null }) {
  const [selected, setSelected] = useState("");
  const resource = usePaginatedOneCResource<OneCHRDocumentItem, { docType?: string }>({
    loader: listOneCHRDocuments,
    initialFilters: {},
    initialPageSize: 50,
  });

  useEffect(() => {
    resource.setFilters(selected ? { docType: selected } : {});
  }, [selected, resource.setFilters]);

  const columns = useMemo<TableColumn<OneCHRDocumentItem>[]>(
    () => [
      { key: "docType", header: "Тип", cellClassName: "text-xs", render: (item) => item.docType },
      {
        key: "documentNumber",
        header: "Номер",
        cellClassName: "font-mono text-xs",
        render: (item) => item.documentNumber || "—",
      },
      { key: "date", header: "Дата", cellClassName: "text-xs", render: (item) => formatDate(item.date) },
      {
        key: "period",
        header: "Период",
        cellClassName: "text-xs",
        render: (item) => {
          const start = formatDate(item.dateStart);
          const end = item.dateEnd ? formatDate(item.dateEnd) : "";
          return end ? `${start} — ${end}` : start;
        },
      },
      {
        key: "amount",
        header: "Сумма",
        headerClassName: "text-right",
        cellClassName: "text-right text-xs tabular-nums",
        render: (item) => formatAmount(item.amount),
      },
      {
        key: "posted",
        header: "Проведён",
        headerClassName: "text-center",
        cellClassName: "text-center",
        render: (item) => (item.posted ? "✓" : "—"),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <FilterChips
        items={summary?.hrDocuments.byType ?? []}
        selected={selected}
        total={summary?.hrDocuments.total ?? 0}
        onSelect={setSelected}
      />
      <SectionTable
        columns={columns}
        items={resource.items}
        loading={resource.loading}
        error={resource.error}
        total={resource.total}
        page={resource.page}
        totalPages={resource.totalPages}
        emptyMessage="Нет кадровых документов"
        onPageChange={resource.setPage}
      />
    </div>
  );
}

export function HRTab({ summary }: { summary: OneCSummary | null }) {
  const [subTab, setSubTab] = useState<HRSubTab>("documents");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
        {(["documents", "registers"] as HRSubTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              subTab === tab
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "documents" ? "Документы" : "Регистры 1С"}
          </button>
        ))}
      </div>
      {subTab === "documents" ? (
        <HRDocumentsSection summary={summary} />
      ) : (
        <ScopedRegistersTab registerTypes={HR_REGISTER_TYPES} summary={summary} />
      )}
    </div>
  );
}
