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
}: {
  data: T[];
  columns: Column<T>[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));

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
    <div className="border rounded overflow-hidden">
      <div className="flex justify-end p-2 bg-gray-50">
        <button className="text-sm px-3 py-1 border rounded bg-white hover:bg-gray-100" onClick={downloadCsv}>
          Экспорт CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              {columns.map((c) => (
                <th key={c.key} className="text-left p-2 whitespace-nowrap">{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={columns.length}>
                  Нет данных
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  {columns.map((c) => (
                    <td key={c.key} className="p-2 whitespace-nowrap">
                      {c.render ? c.render(row) : c.key in row ? String(row[c.key as keyof T] ?? "") : ""}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center p-3 text-sm gap-2 bg-gray-50 border-t">
        <div className="text-gray-600">Всего: {total}</div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-3 py-1.5 border rounded bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          >
            Назад
          </button>
          <span className="px-2 text-gray-700">{page} / {pages}</span>
          <button
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
            className="px-3 py-1.5 border rounded bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          >
            Вперёд
          </button>
        </div>
      </div>
    </div>
  );
}