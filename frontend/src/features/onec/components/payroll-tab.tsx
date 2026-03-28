import { useEffect, useMemo, useState } from "react";
import { listOneCPayrollDocuments } from "../api";
import { usePaginatedOneCResource } from "../hooks";
import type { OneCPayrollDocumentItem, OneCSummary } from "../types";
import { FilterChips, SectionTable, formatAmount, formatDate, type TableColumn } from "./shared";

export function PayrollTab({ summary }: { summary: OneCSummary | null }) {
  const [selected, setSelected] = useState("");
  const resource = usePaginatedOneCResource<OneCPayrollDocumentItem, { docType?: string }>({
    loader: listOneCPayrollDocuments,
    initialFilters: {},
    initialPageSize: 50,
  });

  useEffect(() => {
    resource.setFilters(selected ? { docType: selected } : {});
  }, [selected, resource.setFilters]);

  const columns = useMemo<TableColumn<OneCPayrollDocumentItem>[]>(
    () => [
      { key: "docType", header: "Тип", cellClassName: "text-xs", render: (item) => item.docType },
      {
        key: "documentNumber",
        header: "Номер",
        cellClassName: "font-mono text-xs",
        render: (item) => item.documentNumber || "—",
      },
      { key: "date", header: "Дата", cellClassName: "text-xs", render: (item) => formatDate(item.date) },
      { key: "period", header: "Период", cellClassName: "text-xs", render: (item) => formatDate(item.period) },
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
      <FilterChips items={summary?.payrollDocuments.byType ?? []} selected={selected} total={summary?.payrollDocuments.total ?? 0} onSelect={setSelected} />
      <SectionTable
        columns={columns}
        items={resource.items}
        loading={resource.loading}
        error={resource.error}
        total={resource.total}
        page={resource.page}
        totalPages={resource.totalPages}
        emptyMessage="Нет зарплатных документов"
        onPageChange={resource.setPage}
      />
    </div>
  );
}
