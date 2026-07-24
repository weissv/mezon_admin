import { useState } from "react";
import { Megaphone, ClipboardList, Bot, Send, Clock, UserCheck } from "lucide-react";

// --- ФЕЙКОВЫЕ ДАННЫЕ ---

// 1. Объявления учителя
const ANNOUNCEMENTS = [
  { id: 1, date: "22.10.2024", text: "Завтра контрольная по математике. Принесите линейку и карандаши.", author: "Иванова А.А." },
  { id: 2, date: "20.10.2024", text: "В пятницу экскурсия в музей. Дети должны быть в школьной форме.", author: "Иванова А.А." },
];

// 2. Запросы от родителей (история)
const REQUESTS_HISTORY = [
  { id: 1, child: "Алиев Рустам", type: "Полный день", reason: "Заболел (ОРВИ)", status: "Авто-обработано", date: "22.10.2024" },
  { id: 2, child: "Алиев Рустам", type: "Опоздание", details: "Придет к 10:00", reason: "К врачу", status: "Обработано", date: "15.10.2024" },
];

// 3. Системные уведомления
const SYSTEM_LOG = [
  { id: 1, type: "trigger", text: "⚠️ Алиев Рустам отсутствует на уроке в 08:30. Родители не отмечали отсутствие. Отправлено напоминание.", time: "08:35" },
  { id: 2, type: "auto-reply", text: "✅ Родитель отметил: 'Заболел'. Автоматически проставлена отметка в журнале. Отправлено: 'Скорейшего выздоровления!'", time: "08:40" },
];

const TABS = [
  { id: "announcements", label: "Объявления класса", icon: <Megaphone className="w-4 h-4" /> },
  { id: "requests", label: "Отметить отсутствие", icon: <ClipboardList className="w-4 h-4" /> },
  { id: "system", label: "Лог системы", icon: <Bot className="w-4 h-4" /> },
];

export default function CommunicationHub() {
  const [activeTab, setActiveTab] = useState("announcements");
  
  // Состояния для формы отсутствия
  const [reqType, setReqType] = useState("full_day");
  const [reqReason, setReqReason] = useState("sick");
  const [reqDetails, setReqDetails] = useState("");

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      
      {/* --- ЛЕВАЯ ПАНЕЛЬ: НАВИГАЦИЯ --- */}
      <div className="w-1/4 border-r border-gray-200 bg-gray-50/50 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-bold text-gray-900">Связь (1 А класс)</h2>
        </div>

        <div className="flex-1 p-2 space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="p-4 m-2 bg-indigo-50 rounded-xl border border-indigo-100">
          <p className="text-xs text-indigo-700 font-semibold">⚠️ Важно</p>
          <p className="text-[10px] text-indigo-600 mt-1">Свободный чат с учителем запрещен. Используйте только заявки на отсутствие и объявления.</p>
        </div>
      </div>

      {/* --- ПРАВАЯ ПАНЕЛЬ: КОНТЕНТ --- */}
      <div className="flex-1 flex flex-col bg-white">
        
        {/* --- ВКЛАДКА: ОБЪЯВЛЕНИЯ --- */}
        {activeTab === "announcements" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Доска объявлений</h3>
            {ANNOUNCEMENTS.map((a) => (
              <div key={a.id} className="border border-gray-200 rounded-xl p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{a.author}</span>
                  <span className="text-xs text-gray-400">{a.date}</span>
                </div>
                <p className="text-gray-800 text-sm leading-relaxed">{a.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* --- ВКЛАДКА: ОТСУТСТВИЕ (СТРОГАЯ ФОРМА) --- */}
        {activeTab === "requests" && (
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Уведомить об отсутствии</h3>
            
            {/* ФОРМА */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Тип отсутствия */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Тип отсутствия</label>
                  <select 
                    value={reqType} 
                    onChange={(e) => setReqType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="full_day">Не придет весь день</option>
                    <option value="late">Опоздание (указать время)</option>
                    <option value="early_pickup">Нужно забрать с урока (указать время)</option>
                    <option value="one_lesson">Пропуск одного/нескольких уроков</option>
                  </select>
                </div>

                {/* Причина */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Причина</label>
                  <select 
                    value={reqReason} 
                    onChange={(e) => setReqReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="sick">Заболел</option>
                    <option value="doctor">Поход к врачу</option>
                    <option value="family">Семейные обстоятельства</option>
                    <option value="other">Другое (указать)</option>
                  </select>
                </div>
              </div>

              {/* Дополнительные детали (появляется при опоздании/заборе) */}
              {(reqType === "late" || reqType === "early_pickup" || reqType === "one_lesson") && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Время / Детали</label>
                  <input 
                    type="text" 
                    value={reqDetails}
                    onChange={(e) => setReqDetails(e.target.value)}
                    placeholder={reqType === "late" ? "Например: будет к 10:00" : "Например: забрать в 14:00 после 3 урока"}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              {reqReason === "other" && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Уточнение причины</label>
                  <input 
                    type="text" 
                    value={reqDetails}
                    onChange={(e) => setReqDetails(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              <button className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                <Send className="w-4 h-4" />
                Отправить в журнал посещаемости
              </button>
            </div>

            {/* ИСТОРИЯ ЗАПРОСОВ */}
            <h4 className="text-md font-bold text-gray-700 mb-3">Предыдущие заявки</h4>
            <div className="space-y-3">
              {REQUESTS_HISTORY.map((r) => (
                <div key={r.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                      {r.type === "Полный день" ? <UserCheck className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{r.child} — {r.type}</p>
                      <p className="text-xs text-gray-500">{r.reason} {r.details && `(${r.details})`}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">{r.status}</span>
                    <p className="text-[10px] text-gray-400 mt-1">{r.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- ВКЛАДКА: ЛОГИ СИСТЕМЫ --- */}
        {activeTab === "system" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Автоматизация и триггеры</h3>
            <p className="text-sm text-gray-500 mb-6">Как система работает в фоновом режиме (Лог для администратора)</p>
            
            {SYSTEM_LOG.map((log) => (
              <div key={log.id} className={`border rounded-xl p-4 flex gap-4 ${
                log.type === "trigger" ? "border-red-200 bg-red-50/30" : "border-green-200 bg-green-50/30"
              }`}>
                <Bot className={`w-5 h-5 flex-shrink-0 mt-0.5 ${log.type === "trigger" ? "text-red-500" : "text-green-500"}`} />
                <div>
                  <p className="text-sm text-gray-800">{log.text}</p>
                  <p className="text-xs text-gray-400 mt-1">{log.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}