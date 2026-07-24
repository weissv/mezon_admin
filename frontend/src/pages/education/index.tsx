import { useState } from "react";
import { Link } from "react-router-dom";

// --- ФЕЙКОВЫЕ ДАННЫЕ (Mock Data) ---
// Ступени обучения
const STAGES = [
  { id: "all", label: "Все классы" },
  { id: "primary", label: "Начальная (1-4)" },
  { id: "middle", label: "Средняя (5-9)" },
  { id: "high", label: "Старшая (10-11)" },
];

// Список классов (заложена структура для будущей консолидации расписания)
const MOCK_CLASSES = [
  { id: 1, name: "1 А", stage: "primary", teacher: "Иванова А.А.", studentsCount: 26 },
  { id: 2, name: "1 Б", stage: "primary", teacher: "Петрова М.С.", studentsCount: 24 },
  { id: 3, name: "2 А", stage: "primary", teacher: "Сидорова Е.В.", studentsCount: 28 },
  { id: 4, name: "2 Б", stage: "primary", teacher: "Кузнецова И.И.", studentsCount: 25 },
  { id: 5, name: "3 А", stage: "primary", teacher: "Смирнова О.П.", studentsCount: 27 },
  { id: 6, name: "4 А", stage: "primary", teacher: "Попова Л.Г.", studentsCount: 30 },
  
  { id: 7, name: "5 А", stage: "middle", teacher: "Васильев К.Ю.", studentsCount: 32 },
  { id: 8, name: "6 А", stage: "middle", teacher: "Михайлов С.В.", studentsCount: 29 },
  { id: 9, name: "7 А", stage: "middle", teacher: "Новикова Д.А.", studentsCount: 31 },
  { id: 10, name: "8 А", stage: "middle", teacher: "Федорова Е.К.", studentsCount: 28 },
  { id: 11, name: "9 А", stage: "middle", teacher: "Соколов А.Б.", studentsCount: 25 },
  
  { id: 12, name: "10 А", stage: "high", teacher: "Лебедев В.Г.", studentsCount: 22 },
  { id: 13, name: "11 А", stage: "high", teacher: "Козлова М.Д.", studentsCount: 18 },
];

export default function EducationPage() {
  const [activeStage, setActiveStage] = useState("all");

  // Фильтрация классов по ступени
  const filteredClasses = activeStage === "all" 
    ? MOCK_CLASSES 
    : MOCK_CLASSES.filter(c => c.stage === activeStage);

  // Считаем общую статистику (демонстрация консолидации)
  const totalStudents = MOCK_CLASSES.reduce((acc, c) => acc + c.studentsCount, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* ЗАГОЛОВОК И БЫСТРАЯ СТАТИСТИКА */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Школа</h1>
          <p className="text-gray-500 mt-1">Учебные параллели, классы и контингент учеников</p>
        </div>
        <div className="flex gap-6 text-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{MOCK_CLASSES.length}</p>
            <p className="text-gray-500">Классов</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
            <p className="text-gray-500">Учеников</p>
          </div>
        </div>
      </div>

      {/* ФИЛЬТРЫ ПО СТУПЕНЯМ */}
      <div className="flex gap-2 flex-wrap">
        {STAGES.map((stage) => (
          <button
            key={stage.id}
            onClick={() => setActiveStage(stage.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeStage === stage.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {stage.label}
          </button>
        ))}
      </div>

      {/* СЕТКА КЛАССОВ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredClasses.map((cls) => (
          <Link
            to={`/education/class/${cls.id}`} // В будущем роут для страницы конкретного класса
            key={cls.id}
            className="group border border-gray-200 rounded-xl p-5 bg-white hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                {cls.name}
              </span>
              <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                {cls.studentsCount} уч.
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500">
                {cls.teacher.charAt(0)}
              </div>
              <span>Кл. рук: {cls.teacher}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* НИЖНИЕ БЛОКИ (Глобальные инструменты) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
        
        <Link to="/clubs" className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all">
          <span className="text-2xl">🎨</span>
          <div>
            <p className="font-semibold text-gray-800">Кружки</p>
            <p className="text-sm text-gray-500">Внешние ученики и секции</p>
          </div>
        </Link>

        <Link to="/education/projects" className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="font-semibold text-gray-800">Проекты и Олимпиады</p>
            <p className="text-sm text-gray-500">Мастер-классы и соревнования</p>
          </div>
        </Link>

        <Link to="/education/seminars" className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all">
          <span className="text-2xl">🎤</span>
          <div>
            <p className="font-semibold text-gray-800">Учителя</p>
            <p className="text-sm text-gray-500">Семинары, вебинары, нагрузка</p>
          </div>
        </Link>

      </div>
    </div>
  );
}