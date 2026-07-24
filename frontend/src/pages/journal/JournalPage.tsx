import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";

export default function JournalPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    // Читаем то, что сохранил тест из localStorage
    const saved = localStorage.getItem('mezon_journal');
    if (saved) {
      try {
        setRecords(JSON.parse(saved));
      } catch (e) {
        console.error("Ошибка чтения журнала", e);
      }
    }
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/dashboard" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-indigo-600" /> Электронный журнал
        </h1>
      </div>

      {records.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-16 text-center text-gray-400 border-2 border-dashed">
          <p className="text-xl font-bold mb-2">Пока пусто</p>
          <p className="text-sm">Здесь будут появляться результаты после прохождения тестов и тренажеров.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {records.map((record, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              
              {/* Шапка записи */}
              <div 
                onClick={() => setExpandedId(expandedId === `${index}` ? null : `${index}`)}
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">📝</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{record.subject}</span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-600">{record.topic}</span>
                    </div>
                    <p className="text-xs text-gray-400">{record.date} в {record.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-indigo-600">{record.score}</span>
                </div>
              </div>

              {/* Разворачивающиеся детали (Лог ошибок) */}
              {expandedId === `${index}` && record.details && (
                <div className="border-t border-gray-100 bg-gray-50 p-6">
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Детализация ответов</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {record.details.map((log: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100">
                        {/* Цветная плашка */}
                        <div 
                          className="w-10 h-10 rounded-lg shadow-inner flex-shrink-0" 
                          style={{ backgroundColor: log.colorCode || '#ccc', border: log.colorCode === '#FFFFFF' ? '1px solid #ccc' : 'none' }}
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-bold text-gray-800 truncate">{log.correct}</span>
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold">{log.phase}</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            Ответ: <span className={log.status === "success" ? "text-green-600 font-bold" : "text-red-600 font-bold line-through"}>{log.userAnswer}</span>
                          </p>
                        </div>

                        <div className="text-xl flex-shrink-0">
                          {log.status === "success" 
                            ? <CheckCircle2 className="text-green-500" /> 
                            : <XCircle className="text-red-500" />
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}