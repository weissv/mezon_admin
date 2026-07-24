import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { UserCheck, BookOpen, MessageSquare, CreditCard, Clock, AlertTriangle, Play, ClipboardList, Users, Settings, FileText, Target } from "lucide-react";

// ==========================================
// ВРЕМЕННЫЙ ПЕРЕКЛЮЧАТЕЛЬ ДЕМО-РОЛЕЙ
// ==========================================
const DEMO_ROLES = ["PARENT", "STUDENT", "TEACHER", "ADMIN"];

// ==========================================
// 1. ЛИЧНЫЙ КАБИНЕТ РОДИТЕЛЯ
// ==========================================
function ParentDashboard() {
  const MY_CHILDREN = [{ id: 1, name: "Алиев Рустам", class: "1 А", avatar: "👦" }];
  const TODAY_SCHEDULE = [
    { time: "08:30", subject: "🇬🇧 Английский язык", room: "Каб. 101" },
    { time: "09:25", subject: "🔢 Математика", room: "Каб. 102" },
  ];
  const ACTIVE_HW = [
    { subject: "🇬🇧 Англ. язык", task: "Стр. 45, упр. 2 (Past Simple)", dueDate: "Завтра" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Добрый день, Каримова Мухлиса!</h1>
        <p className="text-gray-500 mt-1">Вот что происходит у ваших детей сегодня.</p>
      </div>

      <div className="flex gap-4">
        {MY_CHILDREN.map(child => (
          <div key={child.id} className="flex items-center gap-3 bg-white border-2 border-indigo-200 rounded-xl px-5 py-3 text-indigo-800">
            <span className="text-3xl">{child.avatar}</span>
            <div><p className="font-bold">{child.name}</p><p className="text-xs text-indigo-500">Класс {child.class}</p></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link to="/chat" className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 hover:shadow-sm transition-all">
          <UserCheck className="w-6 h-6 text-red-600" /><div><p className="font-bold text-red-800 text-sm">Отметить отсутствие</p><p className="text-xs text-red-500">Заболел, опоздание</p></div>
        </Link>
        <Link to="/education" className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 hover:shadow-sm transition-all">
          <BookOpen className="w-6 h-6 text-blue-600" /><div><p className="font-bold text-blue-800 text-sm">Дневник и ДЗ</p><p className="text-xs text-blue-500">Оценки, задания</p></div>
        </Link>
        <Link to="/chat" className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl p-4 hover:shadow-sm transition-all">
          <MessageSquare className="w-6 h-6 text-indigo-600" /><div><p className="font-bold text-indigo-800 text-sm">Объявления</p><p className="text-xs text-indigo-500">От классного руководителя</p></div>
        </Link>
        <Link to="/finances" className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 hover:shadow-sm transition-all">
          <CreditCard className="w-6 h-6 text-green-600" /><div><p className="font-bold text-green-800 text-sm">Оплата и счета</p><p className="text-xs text-green-500">Баланс, договоры</p></div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-gray-400" /> Расписание сегодня</h2>
          <div className="space-y-3">{TODAY_SCHEDULE.map((l, i) => (<div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"><span className="text-sm font-mono font-bold text-gray-500 w-12">{l.time}</span><div className="flex-1"><p className="font-medium text-gray-800">{l.subject}</p><p className="text-xs text-gray-400">{l.room}</p></div></div>))}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-gray-400" /> Требует внимания (ДЗ)</h2>
          <div className="space-y-3">{ACTIVE_HW.map((hw, i) => (<div key={i} className="flex items-start gap-4 p-3 border border-amber-200 bg-amber-50/30 rounded-lg"><div className="text-2xl">{hw.subject.split(' ')[0]}</div><div className="flex-1"><p className="font-medium text-gray-800 text-sm">{hw.subject.split(' ').slice(1).join(' ')}</p><p className="text-sm text-gray-600 mt-1">{hw.task}</p></div><span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">{hw.dueDate}</span></div>))}</div>
        </div>
      </div>

      <div className="bg-white border border-dashed border-gray-300 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Требуется от вас (Чек-листы)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-3"><div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">👕</div><div><p className="font-semibold text-gray-800 text-sm">Школьная форма</p><p className="text-xs text-red-500 font-medium">Не куплено: белая футболка (поло)</p></div></div>
          <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-3"><div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">✏️</div><div><p className="font-semibold text-gray-800 text-sm">Канцтовары (Математика)</p><p className="text-xs text-red-500 font-medium">Не куплено: линейка, циркуль</p></div></div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. ЛИЧНЫЙ КАБИНЕТ УЧЕНИКА (С ТРЕНАЖЕРАМИ)
// ==========================================
function StudentDashboard() {
  const MY_MEZON_TASKS = [
    { id: 1, type: "Тренажер", title: "Лексика: Еда и напитки", subject: "🇬🇧 Английский", status: "Не начат" },
    { id: 2, type: "Тест (на оценку)", title: "Грамматика: Past Simple", subject: "🇬🇧 Английский", status: "Назначен" },
    { id: 3, type: "Тренажер", title: "Аудирование: Транспорт", subject: "🇺🇿 Узбекский", status: "В процессе" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Привет, Рустам! 👋</h1>
        <p className="text-gray-500 mt-1">Твой прогресс и задания на сегодня.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100"><p className="text-2xl font-bold text-blue-700">2</p><p className="text-sm text-blue-500">Задания по ДЗ</p></div>
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100"><p className="text-2xl font-bold text-indigo-700">3</p><p className="text-sm text-indigo-500">Тренажеры/Тесты</p></div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100"><p className="text-2xl font-bold text-green-700">85%</p><p className="text-sm text-green-500">Успеваемость</p></div>
      </div>

      {/* НОВОЕ: КЛИКАБЕЛЬНЫЕ ПРЕДМЕТЫ */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-indigo-500" /> Мои предметы (1 А класс)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/education/class/1/subject/english" className="border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all text-center group">
            <div className="text-4xl mb-2">🇬🇧</div>
            <p className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">Английский язык</p>
            <p className="text-xs text-gray-400 mt-1">Открыть темы →</p>
          </Link>
          <Link to="/education/class/1/subject/uzbek" className="border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all text-center group">
            <div className="text-4xl mb-2">🇺🇿</div>
            <p className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">Узбекский язык</p>
            <p className="text-xs text-gray-400 mt-1">Открыть темы →</p>
          </Link>
          <Link to="/education/class/1/subject/logic" className="border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all text-center group">
            <div className="text-4xl mb-2">🧩</div>
            <p className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">Логика</p>
            <p className="text-xs text-gray-400 mt-1">Открыть темы →</p>
          </Link>
        </div>
      </div>

      {/* СТАРОЕ: ЗАДАНИЯ (Пока просто для красоты) */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Play className="w-5 h-5 text-indigo-500" /> Мои интерактивы (Mezon)</h2>
        <div className="space-y-4">
          {MY_MEZON_TASKS.map(task => (
            <div key={task.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-sm transition-all">
              <div className="flex items-center gap-4">
                <div className="text-2xl">{task.subject.split(' ')[0]}</div>
                <div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">{task.type}</span>
                  <p className="font-bold text-gray-800 mt-1">{task.title}</p>
                  <p className="text-xs text-gray-400">{task.subject}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-400">{task.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. ЛИЧНЫЙ КАБИНЕТ УЧИТЕЛЯ
// ==========================================
function TeacherDashboard() {
  const MY_CLASSES = ["1 А", "2 А", "3 А"];
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Доброе утро, Каримова Л.А. 📚</h1>
        <p className="text-gray-500 mt-1">У вас сегодня 4 урока. 15 домашних заданий ожидают проверки.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left hover:shadow-sm transition-all">
          <BookOpen className="w-6 h-6 text-blue-600 mb-2" /><p className="font-bold text-blue-800 text-sm">Назначить ДЗ</p>
        </button>
        <button className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left hover:shadow-sm transition-all">
          <ClipboardList className="w-6 h-6 text-amber-600 mb-2" /><p className="font-bold text-amber-800 text-sm">Создать Тест/Тренажер</p>
        </button>
        <button className="bg-green-50 border border-green-200 rounded-xl p-4 text-left hover:shadow-sm transition-all">
          <Users className="w-6 h-6 text-green-600 mb-2" /><p className="font-bold text-green-800 text-sm">Проверить работы</p>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Мои классы (Доступ только к моим ученикам)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MY_CLASSES.map(cls => (
            <Link to={`/education/class/1`} key={cls} className="border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all">
              <h3 className="text-2xl font-bold text-gray-800">{cls}</h3>
              <p className="text-sm text-gray-500 mt-1">28 учеников</p>
              <p className="text-xs text-indigo-600 font-semibold mt-3">Открыть журнал →</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. ЛИЧНЫЙ КАБИНЕТ АДМИНА
// ==========================================
function AdminDashboard() {
  const ABSENT_TODAY = [
    { name: "Алиев Рустам", cls: "1 А", reason: "Болезнь (по заявке)", status: "Ожидает справку" },
    { name: "Усманов Бекзод", cls: "1 А", reason: "Неизвестно (Триггер отправлен)", status: "Ждем ответа" },
  ];
  const TASKS = [
    { title: "Согласовать договор с поставщиком формы", status: "В процессе", due: "Сегодня" },
    { title: "Выгрузить отчет для директора", status: "Новая", due: "Завтра" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Панель управления (Админ) 🛡️</h1>
        <p className="text-gray-500 mt-1">Оперативная сводка по школе.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Отсутствующие */}
        <div className="bg-white border border-red-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Отсутствующие сегодня</h2>
          <div className="space-y-3">
            {ABSENT_TODAY.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                <div><p className="font-bold text-gray-800 text-sm">{s.name} <span className="font-normal text-gray-500">({s.cls})</span></p><p className="text-xs text-gray-500">{s.reason}</p></div>
                <span className="text-[10px] font-bold bg-white border border-red-200 text-red-700 px-2 py-1 rounded-full">{s.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Задачи Админа */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-gray-400" /> Мои задачи</h2>
          <div className="space-y-3">
            {TASKS.map((t, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div><p className="font-medium text-gray-800 text-sm">{t.title}</p><p className="text-xs text-gray-400">Срок: {t.due}</p></div>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


// ==========================================
// ГЛАВНЫЙ КОМПОНЕНТ (РОУТЕР ДАШБОРДОВ)
// ==========================================

export default function DashboardPage() {
  // Берем роль из глобального переключателя в шапке (или по умолчанию ADMIN)
  const context = useOutletContext<{ demoRole?: string }>();
  const role = context?.demoRole || "ADMIN";

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {role === "PARENT" && <ParentDashboard />}
      {role === "STUDENT" && <StudentDashboard />}
      {role === "TEACHER" && <TeacherDashboard />}
      {(role === "ADMIN" || role === "DIRECTOR" || role === "DEPUTY" || role === "DEVELOPER" || role === "ACCOUNTANT" || role === "ZAVHOZ") && <AdminDashboard />}
    </div>
  );
}