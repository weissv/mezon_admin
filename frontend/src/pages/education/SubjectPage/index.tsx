import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, BookOpen, ClipboardCheck, Plus, Clock, AlertCircle, BarChart3, ChevronDown } from "lucide-react";

// --- МАСШТАБИРУЕМАЯ СТРУКТУРА: ПРЕДМЕТЫ ПО КЛАССАМ ---
const CLASS_SUBJECTS: Record<string, Array<{ id: string; icon: string; title: string; teacher: string; isLanguage?: boolean }>> = {
  "1": [
    { id: "english", icon: "🇬🇧", title: "Английский язык", teacher: "Каримова Л.А.", isLanguage: true },
    { id: "uzbek", icon: "🇺🇿", title: "Узбекский язык", teacher: "Холмуродов Ш.Б.", isLanguage: true },
    { id: "logic", icon: "🧩", title: "Логика", teacher: "Иванова А.А." },
  ],
  "2": [
    { id: "math", icon: "🔢", title: "Математика", teacher: "Сидорова В.В." },
    { id: "english", icon: "🇬🇧", title: "Английский язык", teacher: "Каримова Л.А.", isLanguage: true },
    { id: "russian", icon: "🇷🇺", title: "Русский язык", teacher: "Петрова О.Н.", isLanguage: true },
  ]
};

// --- ФЕЙКОВЫЕ ДАННЫЕ ---
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
  { id: "mezon", label: "Тренажеры и Тесты", icon: <ClipboardCheck className="w-4 h-4" /> },
  { id: "tests", label: "Оценки и контрольные", icon: <BarChart3 className="w-4 h-4" /> },
];

// БАЗА ТЕМ
const LANGUAGE_TOPICS = [
  { id: 1, icon: "👋", title: { en: "Greetings", uz: "Salomlashish" }, type: "lex" },
  { id: 2, icon: "🎨", title: { en: "Colors", uz: "Ranglar" }, type: "lex" },
  { id: 3, icon: "🐕", title: { en: "Animals", uz: "Hayvonlar" }, type: "lex" },
  { id: 4, icon: "🍎", title: { en: "Food & Drinks", uz: "Oziq-ovqat va ichimliklar" }, type: "lex" },
  { id: 5, icon: "✍️", title: { en: "Verb 'to be'", uz: "Yordamchi fe'l" }, type: "gram" },
  { id: 6, icon: "🔢", title: { en: "Plurals", uz: "Ko'plik" }, type: "gram" },
  { id: 7, icon: "🎧", title: { en: "Listening", uz: "Tinglash" }, type: "listen" },
];

export default function SubjectPage() {
  const { classId, subjectId } = useParams<{ classId: string; subjectId: string }>();
  const availableSubjects = CLASS_SUBJECTS[classId || "1"] || CLASS_SUBJECTS["1"];
  const [currentSubjectId, setCurrentSubjectId] = useState(subjectId || availableSubjects[0]?.id);
  const currentSubject = availableSubjects.find(s => s.id === currentSubjectId) || availableSubjects[0];
  const [activeTab, setActiveTab] = useState("mezon");
  const [lang, setLang] = useState<'en' | 'uz'>('en');
  
  // Состояние для раскрытия разделов (по умолчанию открыт первый)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "Лексика": true,
    "Грамматика": false,
    "Аудирование": false
  });

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/education" className="hover:text-indigo-600 transition-colors">Школа</Link>
        <span>/</span>
        <Link to={"/education/class/" + classId} className="hover:text-indigo-600 transition-colors">Класс {classId}</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{currentSubject?.title}</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{currentSubject?.icon}</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{currentSubject?.title}</h1>
            <p className="text-gray-500 mt-1">Учитель: <span className="font-medium text-gray-700">{currentSubject?.teacher}</span></p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <select 
              value={currentSubjectId} 
              onChange={(e) => setCurrentSubjectId(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-sm font-medium text-gray-700 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
            >
              {availableSubjects.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.icon} {sub.title}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Добавить ДЗ
          </button>
        </div>
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
                <span className={"text-xs font-semibold px-2.5 py-1 rounded-full " + statusColor}>{hw.status}</span>
              </div>
              <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Сдать до: {hw.dueDate}</span>
              </div>
            </div>
          );
        })}

        {activeTab === "mezon" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Учебный план ({classId} класс)</h2>
                <p className="text-sm text-gray-500 mt-1">Изучайте темы, проходите тренажеры и сдавайте тесты</p>
              </div>
              
              {currentSubject?.isLanguage && (
                <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                  <button onClick={() => setLang('en')} className={"px-4 py-2 rounded-md text-sm font-bold transition-all " + (lang === 'en' ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700")}>🇬🇧 EN</button>
                  <button onClick={() => setLang('uz')} className={"px-4 py-2 rounded-md text-sm font-bold transition-all " + (lang === 'uz' ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700")}>🇺🇿 UZ</button>
                </div>
              )}
            </div>

            {currentSubject?.isLanguage ? (
              <div className="space-y-4">
                {[
                  { 
                    title: "Лексика", 
                    topics: [
                      { id: 1, icon: "👋", title: { en: "Greetings", uz: "Salomlashish" }, type: "lex" },
                      { id: 2, icon: "🎨", title: { en: "Colors", uz: "Ranglar" }, type: "lex" },
                      { id: 3, icon: "🐕", title: { en: "Animals", uz: "Hayvonlar" }, type: "lex" },
                      { id: 4, icon: "🍎", title: { en: "Food & Drinks", uz: "Oziq-ovqat va ichimliklar" }, type: "lex" },
                      { id: 8, icon: "🏠", title: { en: "House", uz: "Uy" }, type: "lex" },
                      { id: 9, icon: "👕", title: { en: "Clothes", uz: "Kiyimlar" }, type: "lex" },
                    ]
                  },
                  { 
                    title: "Грамматика", 
                    topics: [
                      { id: 5, icon: "✍️", title: { en: "Verb 'to be'", uz: "Yordamchi fe'l" }, type: "gram" },
                      { id: 6, icon: "🔢", title: { en: "Plurals", uz: "Ko'plik" }, type: "gram" },
                      { id: 10, icon: "⏰", title: { en: "Tenses", uz: "Zamonlar" }, type: "gram" },
                    ]
                  },
                  { 
                    title: "Аудирование", 
                    topics: [
                      { id: 7, icon: "🎧", title: { en: "Listening", uz: "Tinglash" }, type: "listen" }
                    ]
                  }
                ].map((section) => (
                  <div key={section.title} className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-black text-gray-800">{section.title}</h3>
                        <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                          {section.topics.length} тем
                        </span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${openSections[section.title] ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {openSections[section.title] && (
                      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {section.topics.map((topic) => {
                          const trainerLink = topic.type === 'gram' ? `grammar-trainer/${topic.id}` : topic.type === 'listen' ? `listening-trainer/${topic.id}` : `trainer/${topic.id}`;
                          const testLink = topic.type === 'gram' ? `grammar-test/${topic.id}` : topic.type === 'listen' ? `listening-test/${topic.id}` : `test/${topic.id}`;
                          
                          return (
                            <div key={topic.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-indigo-200 transition-all flex flex-col">
                              <div className="flex items-center gap-3 mb-4">
                                <span className="text-3xl">{topic.icon}</span>
                                <div>
                                  <h3 className="font-bold text-gray-900 text-base leading-tight">{topic.title[lang]}</h3>
                                  <p className="text-xs text-gray-400 mt-0.5">Тема {topic.id}</p>
                                </div>
                              </div>
                              <div className="mt-auto flex flex-col gap-2">
                                <Link to={trainerLink} className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-colors">
                                  🏋️ Тренажер
                                </Link>
                                <Link to={testLink} className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-700 hover:bg-amber-50 hover:border-amber-300 transition-colors">
                                  📝 Тест
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center">
                <p className="text-4xl mb-4">🚧</p>
                <p className="text-xl font-bold text-gray-600">Учебный план в разработке</p>
                <p className="text-sm text-gray-400 mt-2">Тренажеры и тесты по предмету "{currentSubject?.title}" скоро появятся здесь.</p>
              </div>
            )}
          </div>
        )}

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