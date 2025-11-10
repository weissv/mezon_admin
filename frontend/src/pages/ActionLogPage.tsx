import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { Card } from '../components/Card';
import { FileText, User, Clock } from 'lucide-react';

type Log = { 
  id: number; 
  action: string; 
  details: any; 
  timestamp: string; 
  user: { email: string } 
};

export default function ActionLogPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/actionlog')
      .then(setLogs)
      .catch(err => toast.error('Ошибка загрузки журнала', { description: err?.message }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500">Загрузка журнала действий...</div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Журнал действий</h1>
      </div>
      
      <Card>
        <div className="divide-y divide-gray-200">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Нет записей в журнале
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900">{log.action}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(log.timestamp).toLocaleString('ru-RU')}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      Пользователь: <span className="font-medium">{log.user.email}</span>
                    </p>
                    
                    {log.details && Object.keys(log.details).length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                          Подробности
                        </summary>
                        <div className="mt-2 p-3 bg-gray-100 rounded-md">
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
      
      <div className="mt-4 text-sm text-gray-500 text-center">
        Показаны последние {logs.length} записей
      </div>
    </div>
  );
}