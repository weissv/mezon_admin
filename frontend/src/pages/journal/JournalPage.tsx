import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CheckCircle2, XCircle, ArrowLeft, Filter, Plus, X } from "lucide-react";

// ==========================================
// ТИПЫ
// ==========================================
interface JournalDetail {
  correct: string;
  colorCode: string;
  userAnswer: string;
  phase: string;
  status: "success" | "fail";
}

interface JournalEntry {
  id: string;
  studentName: string;
  studentClass: string;
  date: string;
  time: string;
  subject: string;
  topic: string;
  score: string;
  grade: number;
  details: JournalDetail[];
}

// Список учеников по классам (потом придет с бэкенда)
const CLASS_STUDENTS: Record<string, string[]> = {
  "1 А": ["Алиев Рустам", "Каримова Малика", "Усманов Бекзод", "Исламова Дилноза", "Хасанов Шахзод"],
  "2 А": ["Сидоров Петр", "Иванова Анна", "Козлов Максим", "Смирнова Елена"]
};


// ==========================================
// MOCK-ДАННЫЕ
// ==========================================
const INITIAL_JOURNAL: JournalEntry[] = [
  {
    id: "1", studentName: "Алиев Рустам", studentClass: "1 А", date: "24 июля 2026", time: "10:15",
    subject: "🇬🇧 Английский язык", topic: "Цвета", score: "16 из 18", grade: 4,
    details: [
      { correct: "RED", colorCode: "#EF4444", userAnswer: "RED", phase: "Устно", status: "success" },
      { correct: "BLUE", colorCode: "#3B82F6", userAnswer: "BLUI", phase: "Устно", status: "fail" },
      { correct: "GREEN", colorCode: "#22C55E", userAnswer: "GREAN", phase: "Письменно", status: "fail" },
    ]
  },
  {
    id: "2", studentName: "Каримова Малика", studentClass: "1 А", date: "24 июля 2026", time: "10:30",
    subject: "🇬🇧 Английский язык", topic: "Цвета", score: "18 из 18", grade: 5,
    details: [
      { correct: "RED", colorCode: "#EF4444", userAnswer: "RED", phase: "Устно", status: "success" },
      { correct: "WHITE", colorCode: "#FFFFFF", userAnswer: "WHITE", phase: "Письменно", status: "success" },
    ]
  }
];

export default function JournalPage() {
  const [records, setRecords] = useState<JournalEntry[]>(INITIAL_JOURNAL);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState("1 А");
  const [isAddingManual, setIsAddingManual] = useState(false);
  
  const [manualData, setManualData] = useState({ studentName: "", topic: "", grade: 5, comment: "" });

  const filteredRecords = records.filter(r => r.studentClass === selectedClass);

  const handleAddManual = () => {
    if (!manualData.studentName || !manualData.topic) return;
    
    const now = new Date();
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      studentName: manualData.studentName,
      studentClass: selectedClass,
      date: now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
      time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      subject: "🇬🇧 Английский язык",
      topic: manualData.topic,
      score: "Ручной ввод",
      grade: manualData.grade,
      details: [{ 
        correct: manualData.comment || "Ответ у доски", 
        colorCode: "#ffffff", 
        userAnswer: "Оценено учителем", 
        phase: "Устно", 
        status: manualData.grade >= 3 ? "success" : "fail" 
      }]
    };

    setRecords([newEntry, ...records]);
    setManualData({ studentName: "", topic: "", grade: 5, comment: "" });
    setIsAddingManual(false);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-indigo-600" /> Электронный журнал
          </h1>
        </div>
        <button 
          onClick={() => setIsAddingManual(!isAddingManual)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Вручную
        </button>
      </div>

      {/* ФОРМА РУЧНОГО ВВОДА */}
      {isAddingManual && (
        <div className="bg-white border-2 border-indigo-200 rounded-2xl p-6 mb-6 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">Добавить оценку вручную</h3>
            <button onClick={() => setIsAddingManual(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <select 
              value={manualData.studentName}
              onChange={(e) => setManualData({...manualData, studentName: e.target.value})}
              className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 outline-none"
            >
              <option value="" disabled>Выберите ученика...</option>
              {(CLASS_STUDENTS[selectedClass] || []).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <input 
              type="text" placeholder="Тема (Ответ у доски)" 
              value={manualData.topic}
              onChange={(e) => setManualData({...manualData, topic: e.target.value})}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 outline-none"
            />
            <select 
              value={manualData.grade}
              onChange={(e) => setManualData({...manualData, grade: Number(e.target.value)})}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-indigo-500 outline-none"
            >
              {[5, 4, 3, 2].map(g => <option key={g} value={g}>Оценка: {g}</option>)}
            </select>
          </div>
          <input 
            type="text" placeholder="Комментарий (необязательно)" 
            value={manualData.comment}
            onChange={(e) => setManualData({...manualData, comment: e.target.value})}
            className="w-full mt-3 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 outline-none"
          />
          <button onClick={handleAddManual} className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors">
            Сохранить в журнал
          </button>
        </div>
      )}

      {/* ФИЛЬТРЫ */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex items-center gap-4 shadow-sm">
        <Filter className="w-5 h-5 text-gray-400" />
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:ring-indigo-500 outline-none">
          <option value="1 А">Класс: 1 А</option>
          <option value="2 А">Класс: 2 А</option>
        </select>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-16 text-center text-gray-400 border-2 border-dashed">
          <p className="text-xl font-bold mb-2">Нет записей</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredRecords.map((record) => (
            <div key={record.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div onClick={() => setExpandedId(expandedId === record.id ? null : record.id)} className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-lg">{record.grade}</div>
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{record.studentName} <span className="text-sm font-normal text-gray-400">({record.studentClass})</span></p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{record.subject}</span>
                      <span className="text-sm text-gray-600">{record.topic}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{record.date} в {record.time} • {record.score}</p>
                  </div>
                </div>
                <div className="text-gray-400">{expandedId === record.id ? '▲' : '▼'}</div>
              </div>

              {expandedId === record.id && record.details && (
                <div className="border-t border-gray-100 bg-gray-50 p-6">
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Детализация ответов</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {record.details.map((log, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100">
                        <div className="w-10 h-10 rounded-lg shadow-inner flex-shrink-0" style={{ backgroundColor: log.colorCode, border: log.colorCode === '#FFFFFF' ? '1px solid #ccc' : 'none' }} />
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
                          {log.status === "success" ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />}
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