import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, MapPin, UserCheck } from "lucide-react";

// --- ФЕЙКОВЫЕ ДАННЫЕ ---
const TIME_SLOTS = ["08:30", "09:25", "10:30", "11:35", "12:30"];
const CLASSES = ["1 А", "1 Б", "2 А"];

const TEACHERS = [
  { id: "t1", name: "Каримова Л.А.", subject: "🇬🇧 Англ. язык" },
  { id: "t2", name: "Сидорова Е.В.", subject: "🔢 Математика" },
  { id: "t3", name: "Михайлов С.В.", subject: "⚽ Физра" },
  { id: "t4", name: "Иванова А.А.", subject: "🧩 Логика" },
];

const ROOMS = [
  { id: "r1", name: "Кабинет 101" },
  { id: "r2", name: "Кабинет 102" },
  { id: "r3", name: "Спортзал" },
  { id: "r4", name: "Бассейн" },
];

// Фейковое расписание на Понедельник
// ВНИМАНИЕ: Здесь специально допущен конфликт! Каримова и Каб. 101 стоят в 1А и 2А в 08:30
const INITIAL_SCHEDULE = {
  "1 А_08:30": { teacherId: "t1", roomId: "r1" }, 
  "1 Б_08:30": { teacherId: "t2", roomId: "r2" },
  "2 А_08:30": { teacherId: "t1", roomId: "r1" }, // КОНФЛИКТ УЧИТЕЛЯ И КАБИНЕТА
  
  "1 А_09:25": { teacherId: "t4", roomId: "r2" },
  "1 Б_09:25": { teacherId: "t1", roomId: "r1" },
  "2 А_09:25": { teacherId: "t3", roomId: "r3" },
};

export default function ScheduleConstructor() {
  const [schedule, setSchedule] = useState(INITIAL_SCHEDULE);

  // Функция проверки конфликтов
  const getConflicts = (targetClass, targetTime, teacherId, roomId) => {
    let conflicts = [];
    
    for (const key in schedule) {
      if (key === `${targetClass}_${targetTime}`) continue; // Пропускаем саму ячейку
      const [cls, time] = key.split("_");
      
      if (time === targetTime) {
        const cell = schedule[key];
        if (cell.teacherId === teacherId) {
          const teacher = TEACHERS.find(t => t.id === teacherId);
          conflicts.push(`⚠️ Учитель (${teacher?.name}) уже в классе ${cls}`);
        }
        if (cell.roomId === roomId) {
          const room = ROOMS.find(r => r.id === roomId);
          conflicts.push(`⚠️ Кабинет (${room?.name}) занят классом ${cls}`);
        }
      }
    }
    return conflicts;
  };

  const renderCell = (cls, time) => {
    const key = `${cls}_${time}`;
    const cellData = schedule[key];
    
    if (!cellData) return <div className="h-full min-h-[60px]"></div>;

    const teacher = TEACHERS.find(t => t.id === cellData.teacherId);
    const room = ROOMS.find(r => r.id === cellData.roomId);
    const conflicts = getConflicts(cls, time, cellData.teacherId, cellData.roomId);

    const hasConflict = conflicts.length > 0;

    return (
      <div className={"p-2 rounded-lg border-2 h-full min-h-[60px] " + (hasConflict ? "border-red-400 bg-red-50" : "border-gray-200 bg-white")}>
        <div className="text-xs font-bold text-gray-800">{teacher?.subject}</div>
        <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
          <UserCheck className="w-3 h-3" /> {teacher?.name}
        </div>
        <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {room?.name}
        </div>
        
        {/* ВЫВОД КОНФЛИКТОВ */}
        {hasConflict && (
          <div className="mt-2 space-y-0.5">
            {conflicts.map((c, i) => (
              <div key={i} className="text-[9px] text-red-600 font-bold flex items-start gap-0.5">
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span>{c}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-full mx-auto space-y-6">
      
      <div className="flex items-center justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/education" className="hover:text-indigo-600">Образование</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Конструктор расписания</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            Расписание: Понедельник
            <span className="text-sm font-normal text-gray-400 bg-gray-100 px-3 py-1 rounded-full">1 четверть</span>
          </h1>
        </div>
        
        <div className="flex gap-2">
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option>Понедельник</option>
            <option>Вторник</option>
            <option>Среда</option>
          </select>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Сохранить черновик
          </button>
        </div>
      </div>

      {/* ЛЕГЕНДА КОНФЛИКТОВ */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-4 text-sm text-red-800">
        <AlertTriangle className="w-6 h-6 flex-shrink-0" />
        <div>
          <span className="font-bold">Внимание:</span> Обнаружены конфликты! Учитель или кабинет назначены в два разных класса одновременно. Устраните их перед публикацией.
        </div>
      </div>

      {/* СЕТКА РАСПИСАНИЯ */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 w-24 text-left">Время</th>
              {CLASSES.map(cls => (
                <th key={cls} className="px-4 py-3 text-center border-l border-gray-200">{cls}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {TIME_SLOTS.map(time => (
              <tr key={time} className="hover:bg-gray-50/50">
                <td className="px-4 py-2 font-bold text-gray-600 text-center align-top pt-4">
                  {time}
                </td>
                {CLASSES.map(cls => (
                  <td key={cls} className="px-2 py-2 border-l border-gray-100 align-top">
                    {renderCell(cls, time)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}