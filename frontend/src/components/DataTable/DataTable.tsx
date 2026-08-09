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
        "text-left whitespace-normal break-words align-middle text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary select-none",
        isCompact ? "px-3.5 py-2.5" : "px-4 py-3.5",
      )
    : clsx(
        "text-left whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary select-none",
        isCompact ? "px-3.5 py-2.5" : "px-4 py-3.5",
      );

  const bodyCellCls = wrapCells
    ? clsx(
        "whitespace-normal break-words align-middle text-text-primary transition-colors",
        isCompact ? "px-3.5 py-2.5 text-[13px]" : "px-4 py-3 text-[13.5px]",
      )
    : clsx(
        "whitespace-nowrap text-text-primary transition-colors",
        isCompact ? "px-3.5 py-2.5 text-[13px]" : "px-4 py-3 text-[13.5px]",
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
    a.download = `export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-surface-primary shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] overflow-hidden transition-all">
      {(title || description || toolbar) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 lg:p-6 border-b border-separator/50 bg-fill-quaternary/30">
          <div className="min-w-0">
            {title ? <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-text-primary">{title}</h2> : null}
            {description ? <p className="text-[13px] text-text-tertiary mt-0.5 leading-relaxed">{description}</p> : null}
          </div>
          {toolbar ? <div className="flex items-center gap-2.5 shrink-0">{toolbar}</div> : null}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-separator/40 bg-surface-primary">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium text-text-secondary bg-fill-quaternary/80 border border-separator/40">
            <Rows3 className="h-3.5 w-3.5 text-text-tertiary" />
            {total === 0 ? "Нет записей" : `${rangeStart}–${rangeEnd} из ${total}`}
          </span>
        </div>
        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-text-secondary hover:text-text-primary hover:bg-fill-tertiary border border-separator/50 transition-all cursor-pointer"
          onClick={downloadCsv}
          type="button"
        >
          <Download className="h-3.5 w-3.5 text-macos-blue" />
          Экспорт CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className={tableCls}>
          <thead>
            <tr className="border-b border-separator/60 bg-fill-quaternary/50 backdrop-blur-md">
              {columns.map((c) => (
                <th key={c.key} className={headerCellCls}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-separator/40">
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
                      className="py-12"
                    />
                  )}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={i}
                  className={clsx(
                    "transition-colors duration-150 hover:bg-macos-blue/[0.03]",
                    i % 2 === 1 ? 'bg-fill-quaternary/20' : 'bg-transparent'
                  )}
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

      <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-t border-separator/50 bg-fill-quaternary/20">
        <div className="text-[12px] text-text-tertiary">
          Всего записей: <span className="font-semibold text-text-primary tabular-nums">{total}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium text-text-secondary bg-surface-primary border border-separator/60 hover:bg-fill-tertiary hover:text-text-primary disabled:opacity-40 disabled:pointer-events-none transition-all shadow-subtle cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Назад
          </button>
          <span className="px-3 text-[12px] text-text-secondary tabular-nums font-semibold">
            {page} / {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium text-text-secondary bg-surface-primary border border-separator/60 hover:bg-fill-tertiary hover:text-text-primary disabled:opacity-40 disabled:pointer-events-none transition-all shadow-subtle cursor-pointer"
          >
            Вперёд
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

