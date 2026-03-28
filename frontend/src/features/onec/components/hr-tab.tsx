import { useEffect, useMemo, useState } from "react";
import { listOneCHRDocuments } from "../api";
import { usePaginatedOneCResource } from "../hooks";
import type { OneCHRDocumentItem, OneCSummary } from "../types";
import { FilterChips, SectionTable, formatAmount, formatDate, type TableColumn } from "./shared";

export function HRTab({ summary }: { summary: OneCSummary | null }) {
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
      <FilterChips items={summary?.hrDocuments.byType ?? []} selected={selected} total={summary?.hrDocuments.total ?? 0} onSelect={setSelected} />
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
