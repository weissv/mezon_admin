// src/components/DataTable/DataTable.tsx
import Papa from "papaparse";
import { useMemo } from "react";
import React from "react"; // <-- Добавил импорт React для JSX

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

  const csv = useMemo(() => {
    const rows = data.map((row) =>
      Object.fromEntries(columns.map((c) => [String(c.header), c.key in row ? row[c.key as keyof T] : '']))
    );
    return Papa.unparse(rows);
  }, [data, columns]);

  const downloadCsv = () => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border rounded">
      <div className="flex justify-end p-2">
        <button className="text-sm px-3 py-1 border rounded" onClick={downloadCsv}>Экспорт CSV</button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            {columns.map((c) => (
              <th key={c.key} className="text-left p-2">{c.header}</th>
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
              <tr key={i} className="border-t">
                {columns.map((c) => (
                  <td key={c.key} className="p-2">
                    {c.render ? c.render(row) : c.key in row ? String(row[c.key as keyof T] ?? "") : ""}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="flex justify-between items-center p-2 text-sm">
        <div>Всего: {total}</div>
        <div className="space-x-2">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            Назад
          </button>
          <span>{page} / {pages}</span>
          <button
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            Вперёд
          </button>
        </div>
      </div>
    </div>
  );
}