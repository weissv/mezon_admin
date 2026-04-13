// src/components/DataTable/DataTable.tsx
import Papa from "papaparse";
import React from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, Download, Rows3 } from "lucide-react";
import { EmptyState } from "../ui/EmptyState";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
};

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  page,
  pageSize,
  total,
  onPageChange,
  wrapCells = false,
  title,
  description,
  toolbar,
  emptyState,
  density = "comfortable",
}: {
  data: T[];
  columns: Column<T>[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  wrapCells?: boolean;
  title?: string;
  description?: string;
  toolbar?: React.ReactNode;
  emptyState?: React.ReactNode;
  density?: "comfortable" | "compact";
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const isCompact = density === "compact";

  const headerCellCls = wrapCells
    ? clsx(
        "text-left whitespace-normal break-words align-top text-[11px] font-bold uppercase tracking-[0.06em] text-tertiary",
        isCompact ? "px-3 py-2.5" : "p-3",
      )
    : clsx(
        "text-left whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.06em] text-tertiary",
        isCompact ? "px-3 py-2.5" : "p-3",
      );

  const bodyCellCls = wrapCells
    ? clsx(
        "whitespace-normal break-words align-top text-primary",
        isCompact ? "px-3 py-2.5 text-[13px]" : "p-3 text-[14px]",
      )
    : clsx(
        "whitespace-nowrap text-primary",
        isCompact ? "px-3 py-2.5 text-[13px]" : "p-3 text-[14px]",
      );

  const tableCls = wrapCells ? "w-full table-fixed" : "w-full";

  const downloadCsv = () => {
    const rows = data.map((row) =>
      Object.fromEntries(
        columns.map((c) => [String(c.header), c.key in row ? row[c.key as keyof T] : ""])
      )
    );
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mezon-data-table">
      {(title || description || toolbar) && (
        <div className="mezon-data-table__intro">
          <div className="min-w-0">
            {title ? <h2 className="mezon-data-table__title">{title}</h2> : null}
            {description ? <p className="mezon-data-table__description">{description}</p> : null}
          </div>
          {toolbar ? <div className="mezon-data-table__toolbar-extra">{toolbar}</div> : null}
        </div>
      )}

      <div className="mezon-data-table__toolbar">
        <div className="mezon-data-table__toolbar-summary">
          <span className="mezon-data-table__toolbar-pill">
            <Rows3 className="h-3.5 w-3.5" />
            {total === 0 ? "Нет записей" : `${rangeStart}–${rangeEnd} из ${total}`}
          </span>
        </div>
        <button
          className="mezon-data-table__toolbar-button"
          onClick={downloadCsv}
          type="button"
        >
          <Download className="h-3.5 w-3.5" />
          Экспорт CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className={tableCls}>
          <thead className="sticky top-0 z-[1]">
            <tr className="border-b border-[var(--separator)] bg-[var(--bg-inset)]">
              {columns.map((c) => (
                <th key={c.key} className={headerCellCls}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  className="p-0"
                  colSpan={columns.length}
                >
                  {emptyState ?? (
                    <EmptyState
                      icon={Rows3}
                      title="Нет данных"
                      description="Таблица пока не содержит записей по выбранным параметрам."
                      size="sm"
                      className="py-10"
                    />
                  )}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={i}
                  className={`border-b border-[var(--separator)] last:border-0 hover:bg-fill-quaternary macos-transition ${
                    i % 2 === 1 ? 'bg-[var(--bg-inset)]' : ''
                  }`}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={bodyCellCls}>
                      {c.render
                        ? c.render(row)
                        : c.key in row
                        ? String(row[c.key as keyof T] ?? "")
                        : ""}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mezon-data-table__pagination">
        <div className="text-tertiary">
          Всего: <span className="font-semibold text-primary">{total}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="mezon-data-table__pagination-button"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Назад
          </button>
          <span className="px-3 text-secondary tabular-nums font-semibold">
            {page} / {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
            className="mezon-data-table__pagination-button"
          >
            Вперёд
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
