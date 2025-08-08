import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { DataTable } from '../components/DataTable/DataTable';

type Log = { id: number; action: string; details: any; timestamp: string; user: { email: string } };

export default function ActionLogPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/actionlog')
      .then(setLogs)
      .catch(err => toast.error('Ошибка загрузки журнала', { description: err?.message }))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'timestamp', header: 'Время', render: (row: Log) => new Date(row.timestamp).toLocaleString() },
    { key: 'user', header: 'Пользователь', render: (row: Log) => row.user.email },
    { key: 'action', header: 'Действие' },
    { key: 'details', header: 'Детали', render: (row: Log) => <pre className="text-xs bg-gray-100 p-1 rounded max-w-md overflow-auto">{JSON.stringify(row.details, null, 2)}</pre> },
  ];

  if (loading) return <div>Загрузка...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Журнал действий</h1>
      {/* Простая таблица без пагинации, т.к. бэк отдает последние 200 записей */}
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-50">
            {columns.map(c => <th key={c.key} className="text-left p-2">{c.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-t">
              {columns.map(c => <td key={`${log.id}-${c.key}`} className="p-2 align-top">{c.render ? c.render(log) : String(log[c.key as keyof Log] ?? '')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}