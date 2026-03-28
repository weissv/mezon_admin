// src/components/DataTable/DataTable.tsx
import Papa from "papaparse";
import React from "react";

export type Column<T> = { key: string; header: string; render?: (row: T) => React.ReactNode };

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  page,
  pageSize,
  total,
  onPageChange,
  wrapCells = false,
}: {
  data: T[];
  columns: Column<T>[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  wrapCells?: boolean;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const headerCellClassName = wrapCells
    ? "text-left p-2.5 whitespace-normal break-words align-top text-[11px] font-semibold uppercase tracking-wide text-[#86868B]"
    : "text-left p-2.5 whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-[#86868B]";
  const bodyCellClassName = wrapCells
    ? "p-2.5 whitespace-normal break-words align-top text-[13px]"
    : "p-2.5 whitespace-nowrap text-[13px]";
  const tableClassName = wrapCells ? "w-full table-fixed" : "w-full";

  const downloadCsv = () => {
    const rows = data.map((row) =>
      Object.fromEntries(columns.map((c) => [String(c.header), c.key in row ? row[c.key as keyof T] : ""]))
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
    <div className="rounded-[10px] border border-[rgba(0,0,0,0.08)] bg-white/80 backdrop-blur-[40px] saturate-[1.8] overflow-hidden shadow-[0_0_0_0.5px_rgba(0,0,0,0.04)]">
      <div className="flex justify-end px-3 py-2 border-b border-[rgba(0,0,0,0.06)]">
        <button className="text-[12px] font-medium px-2.5 py-1 rounded-[6px] bg-[rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.07)] text-[#6E6E73] transition-colors" onClick={downloadCsv}>
          Экспорт CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className={tableClassName}>
          <thead>
            <tr className="border-b border-[rgba(0,0,0,0.06)]">
              {columns.map((c) => (
                <th key={c.key} className={headerCellClassName}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td className="p-8 text-center text-[#86868B] text-[13px]" colSpan={columns.length}>
                  Нет данных
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} className="border-b border-[rgba(0,0,0,0.04)] last:border-0 hover:bg-[rgba(0,0,0,0.02)] transition-colors">
                  {columns.map((c) => (
                    <td key={c.key} className={bodyCellClassName}>
                      {c.render ? c.render(row) : c.key in row ? String(row[c.key as keyof T] ?? "") : ""}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center px-3 py-2.5 text-[12px] gap-2 border-t border-[rgba(0,0,0,0.06)]">
        <div className="text-[#86868B]">Всего: {total}</div>
        <div className="flex items-center gap-1.5">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-2.5 py-1 rounded-[6px] bg-[rgba(0,0,0,0.04)] text-[#1D1D1F] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[rgba(0,0,0,0.07)] transition-colors font-medium"
          >
            Назад
          </button>
          <span className="px-2 text-[#6E6E73] tabular-nums">{page} / {pages}</span>
          <button
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
            className="px-2.5 py-1 rounded-[6px] bg-[rgba(0,0,0,0.04)] text-[#1D1D1F] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[rgba(0,0,0,0.07)] transition-colors font-medium"
          >
            Вперёд
          </button>
        </div>
      </div>
    </div>
  );
}