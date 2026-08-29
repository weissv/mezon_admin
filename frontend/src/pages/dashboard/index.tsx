import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { UserCheck, BookOpen, MessageSquare, CreditCard, Clock, AlertTriangle, ClipboardList, Users, Target, Award, Bell } from "lucide-react";

// ==========================================
// ТИПЫ И MOCK-ДАННЫЕ
// ==========================================
interface TestResult {
  id: string;
  date: string;
  topic: string;
  subject: string;
  grade: number;
  comment: string;
}

const MOCK_STUDENT_RESULTS: TestResult[] = [
  { id: "1", date: "24 июля", topic: "Цвета", subject: "🇬🇧 Английский", grade: 4, comment: "Тест по цветам:\nНаписание: 8 из 9 правильно...\nПроизношение: 9 из 9..." },
  { id: "2", date: "22 июля", topic: "Животные", subject: "🇬🇧 Английский", grade: 3, comment: "Тест по животным:\nОшибки в словах: ELEPHANT..." },
  { id: "3", date: "20 июля", topic: "Числа 1-20", subject: "🇺🇿 Узбекский", grade: 5, comment: "Тест по числам:\nБез ошибок." }
];

// Данные для переключения дней (Пункт 2)
const SCHEDULE_DATA: Record<string, Array<{time: string, subject: string, room: string}>> = {
  "Вчера": [
    { time: "08:30", subject: "🇺🇿 Узбекский язык", room: "Каб. 103" },
    { time: "10:20", subject: "🧩 Логика", room: "Каб. 105" },
  ],
  "Сегодня": [
    { time: "08:30", subject: "🇬🇧 Английский язык", room: "Каб. 101" },
    { time: "09:25", subject: "🔢 Математика", room: "Каб. 102" },
    { time: "11:15", subject: "🎨 Рисование", room: "Каб. 204" },
  ],
  "Завтра": [
    { time: "08:30", subject: "🔢 Математика", room: "Каб. 102" },
    { time: "09:25", subject: "⚽ Физкультура", room: "Спортзал" },
  ]
};

// Уведомления для Родителя (Пункт 5)
const MOCK_NOTIFICATIONS = [
  { id: 1, text: "Завтра контрольная по математике. Не забудь циркуль и линейку!", date: "Сегодня, 15:00", type: "important" },
  { id: 2, text: "Не куплена школьная форма для физкультуры (белая футболка, черные шорты).", date: "Вчера", type: "warning" },
  { id: 3, text: "Родительское собрание переносится на четверг.", date: "22 июля", type: "info" }
];

// ==========================================
// КОМПОНЕНТЫ КАРТОЧЕК
// ==========================================
function ResultCard({ result }: { result: TestResult }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-gray-800">{result.topic}</h4>
          <p className="text-xs text-gray-400">{result.subject} • {result.date}</p>
        </div>
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-black text-lg">
          {result.grade}
        </div>
      </div>
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
        <p className="text-sm text-gray-600 leading-relaxed" style={{ whiteSpace: 'pre-line' }}>{result.comment}</p>
      </div>
    </div>
  );
}

// ==========================================
// 1. ЛИЧНЫЙ КАБИНЕТ РОДИТЕЛЯ (Обновлен: П.5 и П.6)
// ==========================================
function ParentDashboard() {
  const MY_CHILDREN = [{ id: 1, name: "Алиев Рустам", class: "1 А", avatar: "👦" }];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Добрый день, Каримова Мухлиса!</h1>
        <p className="text-gray-500 mt-1">Вот что происходит у ваших детей.</p>
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
        <Link to="/journal" className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 hover:shadow-sm transition-all">
          <BookOpen className="w-6 h-6 text-blue-600" /><div><p className="font-bold text-blue-800 text-sm">Дневник и оценки</p><p className="text-xs text-blue-500">Журнал, результаты</p></div>
        </Link>
        <Link to="/chat" className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl p-4 hover:shadow-sm transition-all">
          <MessageSquare className="w-6 h-6 text-indigo-600" /><div><p className="font-bold text-indigo-800 text-sm">Чат с учителем</p><p className="text-xs text-indigo-500">Связаться</p></div>
        </Link>
        <Link to="/finances" className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 hover:shadow-sm transition-all">
          <CreditCard className="w-6 h-6 text-green-600" /><div><p className="font-bold text-green-800 text-sm">Оплата и счета</p><p className="text-xs text-green-500">Баланс, договоры</p></div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ПУНКТ 5: Уведомления */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-amber-500" /> Уведомления от школы</h2>
          <div className="space-y-3">
            {MOCK_NOTIFICATIONS.map(n => (
              <div key={n.id} className={`p-3 rounded-lg border ${n.type === 'important' ? 'bg-red-50 border-red-200' : n.type === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                <p className="text-sm text-gray-800">{n.text}</p>
                <p className="text-xs text-gray-400 mt-1">{n.date}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ПУНКТ 6: Историческая успеваемость */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-amber-500" /> Оценки (Все предметы)</h2>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {MOCK_STUDENT_RESULTS.map(res => <ResultCard key={res.id} result={res} />)}
          </div>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// 2. ЛИЧНЫЙ КАБИНЕТ УЧЕНИКА (Обновлен: П.2 и П.3)
// ==========================================
function StudentDashboard() {
  const [selectedDay, setSelectedDay] = useState("Сегодня");
  const schedule = SCHEDULE_DATA[selectedDay] || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Привет, Рустам! 👋</h1>
        <p className="text-gray-500 mt-1">Твой прогресс и задания.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100"><p className="text-2xl font-bold text-blue-700">2</p><p className="text-sm text-blue-500">Задания по ДЗ</p></div>
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100"><p className="text-2xl font-bold text-indigo-700">3</p><p className="text-sm text-indigo-500">Тренажеры/Тесты</p></div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100"><p className="text-2xl font-bold text-green-700">85%</p><p className="text-sm text-green-500">Успеваемость</p></div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ПУНКТ 2: Расписание с выбором дня */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Clock className="w-5 h-5 text-gray-400" /> Расписание</h2>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {["Вчера", "Сегодня", "Завтра"].map(day => (
                <button key={day} onClick={() => setSelectedDay(day)} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${selectedDay === day ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3 min-h-[150px]">
            {schedule.length > 0 ? schedule.map((l, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-mono font-bold text-gray-500 w-12">{l.time}</span>
                <div className="flex-1"><p className="font-medium text-gray-800">{l.subject}</p><p className="text-xs text-gray-400">{l.room}</p></div>
              </div>
            )) : <p className="text-sm text-gray-400 text-center py-8">Нет уроков</p>}
          </div>
        </div>

        {/* Результаты тестов */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-amber-500" /> Мои результаты тестов</h2>
          <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
            {MOCK_STUDENT_RESULTS.map(res => <ResultCard key={res.id} result={res} />)}
          </div>
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
        <button className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left hover:shadow-sm transition-all"><BookOpen className="w-6 h-6 text-blue-600 mb-2" /><p className="font-bold text-blue-800 text-sm">Назначить ДЗ</p></button>
        <button className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left hover:shadow-sm transition-all"><ClipboardList className="w-6 h-6 text-amber-600 mb-2" /><p className="font-bold text-amber-800 text-sm">Создать Тест/Тренажер</p></button>
        <Link to="/journal" className="bg-green-50 border border-green-200 rounded-xl p-4 text-left hover:shadow-sm transition-all"><Users className="w-6 h-6 text-green-600 mb-2" /><p className="font-bold text-green-800 text-sm">Проверить работы / Журнал</p></Link>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Мои классы</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MY_CLASSES.map(cls => (<Link to={`/journal`} key={cls} className="border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all"><h3 className="text-2xl font-bold text-gray-800">{cls}</h3><p className="text-sm text-gray-500 mt-1">28 учеников</p><p className="text-xs text-indigo-600 font-semibold mt-3">Открыть журнал →</p></Link>))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. АДМИН
// ==========================================
function AdminDashboard() {
  const ABSENT_TODAY = [{ name: "Алиев Рустам", cls: "1 А", reason: "Болезнь", status: "Ожидает справку" }];
  const TASKS = [{ title: "Согласовать договор", status: "В процессе", due: "Сегодня" }];
  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold text-gray-900">Панель управления 🛡️</h1><p className="text-gray-500 mt-1">Оперативная сводка.</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-red-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Отсутствующие</h2>
          <div className="space-y-3">{ABSENT_TODAY.map((s, i) => (<div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"><div><p className="font-bold text-gray-800 text-sm">{s.name} ({s.cls})</p><p className="text-xs text-gray-500">{s.reason}</p></div><span className="text-[10px] font-bold bg-white border border-red-200 text-red-700 px-2 py-1 rounded-full">{s.status}</span></div>))}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-gray-400" /> Задачи</h2>
          <div className="space-y-3">{TASKS.map((t, i) => (<div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div><p className="font-medium text-gray-800 text-sm">{t.title}</p><p className="text-xs text-gray-400">Срок: {t.due}</p></div><span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{t.status}</span></div>))}</div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// ГЛАВНЫЙ КОМПОНЕНТ
// ==========================================
export default function DashboardPage() {
  const [localDemoRole, setLocalDemoRole] = useState("STUDENT");
  const role = localDemoRole;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6 p-3 bg-gray-900 text-white rounded-xl flex items-center gap-2 text-xs shadow-lg">
        <span className="font-bold opacity-70 mr-2">🛠 ДЕМО-РЕЖИМ:</span>
        {["PARENT", "STUDENT", "TEACHER", "ADMIN"].map(r => (
          <button key={r} onClick={() => setLocalDemoRole(r)} className={`px-3 py-1.5 rounded-lg font-bold transition-all ${role === r ? 'bg-indigo-600 scale-105 shadow' : 'bg-gray-700 hover:bg-gray-600'}`}>
            {r === "PARENT" ? "Родитель" : r === "STUDENT" ? "Ученик" : r === "TEACHER" ? "Учитель" : "Админ"}
          </button>
        ))}
      </div>

      {role === "PARENT" && <ParentDashboard />}
      {role === "STUDENT" && <StudentDashboard />}
      {role === "TEACHER" && <TeacherDashboard />}
      {(role === "ADMIN" || role === "DIRECTOR" || role === "DEPUTY" || role === "DEVELOPER" || role === "ACCOUNTANT" || role === "ZAVHOZ") && <AdminDashboard />}
    </div>
  );
}