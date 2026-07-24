import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, BookOpen, CalendarDays, BarChart3, Users } from "lucide-react";

// --- ФЕЙКОВЫЕ ДАННЫЕ ---
const MOCK_CLASS_INFO: Record<string, { name: string; teacher: string }> = {
  "1": { name: "1 А", teacher: "Иванова А.А." },
  "2": { name: "1 Б", teacher: "Петрова М.С." },
  "3": { name: "2 А", teacher: "Сидорова Е.В." },
};

const MOCK_STUDENTS = [
  { id: 1, name: "Алиев Рустам", status: "В школе" },
  { id: 2, name: "Каримова Мухлиса", status: "В школе" },
  { id: 3, name: "Усманов Бекзод", status: "Пропуск по болезни" },
  { id: 4, name: "Рахимова Нодира", status: "ПРОПУСК" },
  { id: 5, name: "Тошматов Джасур", status: "В школе" },
];

// Предметы конкретно для этого класса (То, к чему мы идем!)
const CLASS_SUBJECTS = [
  { id: "english", icon: "🇬🇧", title: "Английский язык", teacher: "Каримова Л.А." },
  { id: "uzbek", icon: "🇺🇿", title: "Узбекский язык", teacher: "Холмуродов Ш.Б." },
  { id: "logic", icon: "🧩", title: "Логика", teacher: "Иванова А.А." },
  { id: "math", icon: "🔢", title: "Математика", teacher: "Сидорова Е.В." },
  { id: "pe", icon: "⚽", title: "Физкультура", teacher: "Михайлов С.В." },
];

const TABS = [
  { id: "students", label: "Ученики", icon: <Users className="w-4 h-4" /> },
  { id: "subjects", label: "Предметы и ДЗ", icon: <BookOpen className="w-4 h-4" /> },
  { id: "schedule", label: "Расписание", icon: <CalendarDays className="w-4 h-4" /> },
  { id: "performance", label: "Успеваемость", icon: <BarChart3 className="w-4 h-4" /> },
];

export default function ClassProfilePage() {
  const { classId } = useParams<{ classId: string }>();
  const [activeTab, setActiveTab] = useState("students");

  // Получаем инфо о классе (если вдруг перешли по прямой ссылке)
  const classInfo = MOCK_CLASS_INFO[classId || ""] || { name: `Класс ${classId}`, teacher: "Не назначен" };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* ХЛЕБНЫЕ КРОШКИ И КНОПКА НАЗАД */}
      <Link to="/education" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        К списку классов
      </Link>

      {/* ШАПКА КЛАССА */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Класс {classInfo.name}</h1>
          <p className="text-gray-500 mt-1">Классный руководитель: <span className="font-medium text-gray-700">{classInfo.teacher}</span></p>
        </div>
        <div className="flex gap-4 text-center bg-gray-50 rounded-xl p-4 border">
          <div>
            <p className="text-2xl font-bold text-gray-900">{MOCK_STUDENTS.length}</p>
            <p className="text-xs text-gray-500">Учеников</p>
          </div>
          <div className="w-px bg-gray-200"></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{CLASS_SUBJECTS.length}</p>
            <p className="text-xs text-gray-500">Предметов</p>
          </div>
        </div>
      </div>

      {/* ТАБЫ */}
      <div className="border-b border-gray-200 flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* КОНТЕНТ ТАБОВ */}
      <div className="mt-6">
        
        {/* --- ТАБ: УЧЕНИКИ --- */}
        {activeTab === "students" && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">ФИО Ученика</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MOCK_STUDENTS.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">#{student.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.name}</td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        student.status === "В школе" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- ТАБ: ПРЕДМЕТЫ И ДЗ (НАША ГЛАВНАЯ ЦЕЛЬ) --- */}
        {activeTab === "subjects" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CLASS_SUBJECTS.map((subject) => (
              <Link
                to={`/education/class/${classId}/subject/${subject.id}`} // Маршрут для следующего шага!
                key={subject.id}
                className="group border border-gray-200 rounded-xl p-5 bg-white hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <div className="text-3xl mb-3">{subject.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {subject.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Учитель: {subject.teacher}</p>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>ДЗ, тесты, оценки</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* --- ТАБЫ ЗАГЛУШКИ --- */}
               {/* --- ТАБ: РАСПИСАНИЕ --- */}
        {activeTab === "schedule" && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700">Расписание на неделю</h3>
              <span className="text-xs text-gray-500">1 четверть (с 01.10 по 25.10)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 w-20">Время</th>
                    <th className="px-4 py-3">Понедельник</th>
                    <th className="px-4 py-3">Вторник</th>
                    <th className="px-4 py-3">Среда</th>
                    <th className="px-4 py-3">Четверг</th>
                    <th className="px-4 py-3">Пятница</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-500">08:30<br/><span className="text-xs font-normal">09:15</span></td>
                    <td className="px-4 py-3 font-medium text-indigo-700 bg-indigo-50/50">🇬🇧 Англ. язык</td>
                    <td className="px-4 py-3">🔢 Математика</td>
                    <td className="px-4 py-3 font-medium text-indigo-700 bg-indigo-50/50">🇬🇧 Англ. язык</td>
                    <td className="px-4 py-3">🇺🇿 Узб. язык</td>
                    <td className="px-4 py-3">🧩 Логика</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-500">09:25<br/><span className="text-xs font-normal">10:10</span></td>
                    <td className="px-4 py-3">📖 Чтение</td>
                    <td className="px-4 py-3 font-medium text-indigo-700 bg-indigo-50/50">🇬🇧 Англ. язык</td>
                    <td className="px-4 py-3">🔢 Математика</td>
                    <td className="px-4 py-3 font-medium text-indigo-700 bg-indigo-50/50">🇬🇧 Англ. язык</td>
                    <td className="px-4 py-3">📖 Чтение</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-500">10:30<br/><span className="text-xs font-normal">11:15</span></td>
                    <td className="px-4 py-3">🇺🇿 Узб. язык</td>
                    <td className="px-4 py-3">🎨 ИЗО</td>
                    <td className="px-4 py-3">⚽ Физра</td>
                    <td className="px-4 py-3">🔢 Математика</td>
                    <td className="px-4 py-3">🇺🇿 Узб. язык</td>
                  </tr>
                  <tr className="bg-gray-50/50">
                    <td className="px-4 py-2 text-center text-xs text-gray-400 font-medium" colSpan={6}>ПЕРЕМЕННАЯ (11:15 - 11:35)</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-500">11:35<br/><span className="text-xs font-normal">12:20</span></td>
                    <td className="px-4 py-3">🔢 Математика</td>
                    <td className="px-4 py-3">📖 Чтение</td>
                    <td className="px-4 py-3">🇺🇿 Узб. язык</td>
                    <td className="px-4 py-3">🎨 ИЗО</td>
                    <td className="px-4 py-3">⚽ Физра</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-500">12:30<br/><span className="text-xs font-normal">13:15</span></td>
                    <td className="px-4 py-3">🧩 Логика</td>
                    <td className="px-4 py-3">🌍 Окр. мир</td>
                    <td className="px-4 py-3">🎶 Музыка</td>
                    <td className="px-4 py-3">🌍 Окр. мир</td>
                    <td className="px-4 py-3">📝 Письмо</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "performance" && (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-semibold">Сводная успеваемость</p>
            <p className="text-sm mt-1">Средний балл по классу, рейтинги, графики</p>
          </div>
        )}

      </div>
    </div>
  );
}