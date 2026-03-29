// src/components/DataTable/DataTable.tsx
import Papa from"papaparse";
import React from"react";

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

 const headerCellCls = wrapCells
 ?"text-left p-3 whitespace-normal break-words align-top text-[11px] font-semibold uppercase tracking-[0.04em] text-[#86868B]"
 :"text-left p-3 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.04em] text-[#86868B]";

 const bodyCellCls = wrapCells
 ?"p-3 whitespace-normal break-words align-top text-[13px] text-[#1D1D1F]"
 :"p-3 whitespace-nowrap text-[13px] text-[#1D1D1F]";

 const tableCls = wrapCells ?"w-full table-fixed":"w-full";

 const downloadCsv = () => {
 const rows = data.map((row) =>
 Object.fromEntries(
 columns.map((c) => [String(c.header), c.key in row ? row[c.key as keyof T] :""])
 )
 );
 const csv = Papa.unparse(rows);
 const blob = new Blob([csv], { type:"text/csv;charset=utf-8;"});
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download ="export.csv";
 a.click();
 URL.revokeObjectURL(url);
};

 return (
 <div className="rounded-[12px] border border-[rgba(0,0,0,0.08)] bg-white/85 backdrop-blur-[40px] saturate-[1.8] overflow-hidden shadow-[0_0_0_0.5px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06)]">
 {/* Toolbar */}
 <div className="flex justify-end px-4 py-2.5 border-b border-[rgba(0,0,0,0.06)]">
 <button
 className="text-[12px] font-medium px-3 py-1.5 rounded-[6px] bg-[rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.07)] text-[#6E6E73] macos-macos-transition"
 onClick={downloadCsv}
 >
 Экспорт CSV
 </button>
 </div>

 {/* Table */}
 <div className="overflow-x-auto">
 <table className={tableCls}>
 <thead>
 <tr className="border-b border-[rgba(0,0,0,0.06)] bg-[rgba(0,0,0,0.02)]">
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
 className="p-10 text-center text-[#86868B] text-[13px]"
 colSpan={columns.length}
 >
 Нет данных
 </td>
 </tr>
 ) : (
 data.map((row, i) => (
 <tr
 key={i}
 className="border-b border-[rgba(0,0,0,0.04)] last:border-0 hover:bg-[rgba(0,122,255,0.03)] macos-macos-transition"
 >
 {columns.map((c) => (
 <td key={c.key} className={bodyCellCls}>
 {c.render
 ? c.render(row)
 : c.key in row
 ? String(row[c.key as keyof T] ??"")
 :""}
 </td>
 ))}
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>

 {/* Pagination */}
 <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 text-[12px] gap-2 border-t border-[rgba(0,0,0,0.06)]">
 <div className="text-[#86868B]">
 Всего: <span className="font-medium text-[#1D1D1F]">{total}</span>
 </div>
 <div className="flex items-center gap-1.5">
 <button
 disabled={page <= 1}
 onClick={() => onPageChange(page - 1)}
 className="px-3 py-1.5 rounded-[6px] bg-[rgba(0,0,0,0.04)] text-[#1D1D1F] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[rgba(0,0,0,0.07)] macos-macos-transition font-medium"
 >
 Назад
 </button>
 <span className="px-2.5 text-[#6E6E73] tabular-nums font-medium">
 {page} / {pages}
 </span>
 <button
 disabled={page >= pages}
 onClick={() => onPageChange(page + 1)}
 className="px-3 py-1.5 rounded-[6px] bg-[rgba(0,0,0,0.04)] text-[#1D1D1F] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[rgba(0,0,0,0.07)] macos-macos-transition font-medium"
 >
 Вперёд
 </button>
 </div>
 </div>
 </div>
 );
}
