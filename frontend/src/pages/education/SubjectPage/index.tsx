import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, BookOpen, ClipboardCheck, Plus, Clock, AlertCircle, BarChart3 } from "lucide-react";

// --- ФЕЙКОВЫЕ ДАННЫЕ ---
const MOCK_SUBJECTS_META: Record<string, { icon: string; title: string; teacher: string }> = {
  english: { icon: "🇬🇧", title: "Английский язык", teacher: "Каримова Л.А." },
  uzbek: { icon: "🇺🇿", title: "Узбекский язык", teacher: "Холмуродов Ш.Б." },
  logic: { icon: "🧩", title: "Логика", teacher: "Иванова А.А." },
};

const MOCK_HOMEWORKS = [
  { id: 1, title: "Стр. 45, упр. 2 (Past Simple)", desc: "Выполнить в тетради, выучить неправильные глаголы", dueDate: "24.10.2024", status: "Активно" },
  { id: 2, title: "Аудирование: Track 05", desc: "Прослушать аудио, написать краткий пересказ", dueDate: "22.10.2024", status: "Просрочено" },
];

const MOCK_TESTS = [
  { id: 1, title: "Контрольная работа: Времена глаголов", questionsCount: 15, duration: "30 мин", status: "Назначена", date: "25.10.2024" },
  { id: 2, title: "Лексический тест: Еда и напитки", questionsCount: 10, duration: "15 мин", status: "Завершена", date: "18.10.2024" },
];

const TABS = [
  { id: "homework", label: "Обычное ДЗ", icon: <BookOpen className="w-4 h-4" /> },
  { id: "mezon", label: "Интерактив (Mezon)", icon: <ClipboardCheck className="w-4 h-4" /> },
  { id: "tests", label: "Оценки и контрольные", icon: <BarChart3 className="w-4 h-4" /> },
];

export default function SubjectPage() {
  const { classId, subjectId } = useParams<{ classId: string; subjectId: string }>();
  const [activeTab, setActiveTab] = useState("homework");
  const [lang, setLang] = useState<'en' | 'uz'>('en');

  const subjectMeta = MOCK_SUBJECTS_META[subjectId || ""] || { icon: "📚", title: "Предмет", teacher: "Учитель" };

  // БАЗА ТЕМ 1 КЛАССА (Структура как в Supabase)
  const TOPICS = [
    // --- ЛЕКСИКА ---
    { id: 1, icon: "👋", title: { en: "Greetings", uz: "Salomlashish" }, progress: 100, type: "lex" },
    { id: 2, icon: "🎨", title: { en: "Colors", uz: "Ranglar" }, progress: 65, type: "lex" },
    { id: 3, icon: "🐕", title: { en: "Animals", uz: "Hayvonlar" }, progress: 30, type: "lex" },
    { id: 4, icon: "🍎", title: { en: "Food & Drinks", uz: "Oziq-ovqat va ichimliklar" }, progress: 0, type: "lex" },
    
    // --- ГРАММАТИКА ---
    { id: 5, icon: "✍️", title: { en: "Verb 'to be' (am/is/are)", uz: "Yordamchi fe'l" }, progress: 0, type: "gram" },
    { id: 6, icon: "🔢", title: { en: "Plurals (dog - dogs)", uz: "Ko'plik (it - itlar)" }, progress: 0, type: "gram" },
    { id: 7, icon: "📌", title: { en: "Articles (a / an)", uz: "Artikllar (a / an)" }, progress: 0, type: "gram" },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/education" className="hover:text-indigo-600 transition-colors">Школа</Link>
        <span>/</span>
        <Link to={"/education/class/" + classId} className="hover:text-indigo-600 transition-colors">Класс {classId}</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{subjectMeta.title}</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{subjectMeta.icon}</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{subjectMeta.title}</h1>
            <p className="text-gray-500 mt-1">Учитель: <span className="font-medium text-gray-700">{subjectMeta.teacher}</span></p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Добавить ДЗ
        </button>
      </div>

      <div className="border-b border-gray-200 flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={"flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors " + (activeTab === tab.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300")}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        
        {/* ВКЛАДКА: ДЗ */}
        {activeTab === "homework" && MOCK_HOMEWORKS.map((hw) => {
          const statusColor = hw.status === "Активно" ? "bg-blue-50 text-blue-700" : "bg-red-100 text-red-700";
          return (
            <div key={hw.id} className={"bg-white border rounded-xl p-5 transition-all hover:shadow-sm " + (hw.status === "Просрочено" ? "border-red-200 bg-red-50/30" : "border-gray-200")}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{hw.title}</h3>
                    {hw.status === "Просрочено" && <AlertCircle className="w-4 h-4 text-red-500" />}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{hw.desc}</p>
                </div>
                <span className={"text-xs font-semibold px-2.5 py-1 rounded-full " + statusColor}>
                  {hw.status}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Сдать до: {hw.dueDate}</span>
              </div>
            </div>
          );
        })}

        {/* ВКЛАДКА: ИНТЕРАКТИВ MEZON */}
        {activeTab === "mezon" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Учебный план (1 класс)</h2>
                <p className="text-sm text-gray-500 mt-1">Изучайте темы, проходите тренажеры и сдавайте тесты</p>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                <button onClick={() => setLang('en')} className={"px-4 py-2 rounded-md text-sm font-bold transition-all " + (lang === 'en' ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700")}>🇬🇧 Английский</button>
                <button onClick={() => setLang('uz')} className={"px-4 py-2 rounded-md text-sm font-bold transition-all " + (lang === 'uz' ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700")}>🇺🇿 Узбекский</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TOPICS.map((topic) => (
                <div key={topic.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg hover:border-indigo-200 transition-all flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">{topic.icon}</span>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{topic.title[lang]}</h3>
                      <p className="text-xs text-gray-400">Тема {topic.id}</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Прогресс</span><span>{topic.progress}%</span></div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: topic.progress + "%" }}></div>
                    </div>
                  </div>
                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <Link to={"trainer/" + topic.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"><span>🏋️</span> Тренажер</Link>
                    <Link to={"test/" + topic.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-amber-50 hover:border-amber-300 transition-colors"><span>📝</span> Тест</Link>
                    <button className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-green-50 hover:border-green-300 transition-colors"><span>🎧</span> Аудио</button>
                    <button className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:border-purple-300 transition-colors"><span>🎤</span> Говорение <span className="ml-auto text-[9px] font-bold bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">AI</span></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ВКЛАДКА: ТЕСТЫ */}
        {activeTab === "tests" && MOCK_TESTS.map((test) => (
          <div key={test.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{test.title}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>Вопросов: {test.questionsCount}</span>
                  <span>Время: {test.duration}</span>
                </div>
              </div>
              <span className={"text-xs font-semibold px-2.5 py-1 rounded-full " + (test.status === "Назначена" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700")}>
                {test.status}
              </span>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
               <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Дата: {test.date}</span>
               </div>
               {test.status === "Назначена" && (
                 <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                   Перейти к тесту →
                 </button>
               )}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}