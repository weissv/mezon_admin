import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { Card } from "../components/Card";
import { Button } from "../components/ui/button";

// Типы для данных, чтобы TypeScript не ругался
interface Child {
  id: number;
  firstName: string;
  lastName: string;
}

interface Group {
  id: number;
  name: string;
}

// Используем Map для более эффективного хранения и обновления статусов
type AttendanceState = Map<number, boolean>;

export default function AttendancePage() {
  // Состояния компонента
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [children, setChildren] = useState<Child[]>([]);
  const [attendance, setAttendance] = useState<AttendanceState>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка списка групп при первом рендере
  useEffect(() => {
    api.get("/api/groups") // Предполагаем, что такой эндпоинт есть или будет
      .then((data) => {
        setGroups(data || []);
        if (data && data.length > 0) {
          setSelectedGroupId(String(data[0].id));
        }
      })
      .catch(() => setError("Не удалось загрузить список групп."));
  }, []);

  // Загрузка списка детей при смене группы
  useEffect(() => {
    if (!selectedGroupId) {
      setChildren([]);
      return;
    }
    setLoading(true);
    setError(null);
    api.get(`/api/children?groupId=${selectedGroupId}&pageSize=200`) // Загружаем всех детей группы
      .then((data) => {
        setChildren(data.items || []);
        // Сбрасываем статусы при смене группы
        setAttendance(new Map());
      })
      .catch(() => setError("Не удалось загрузить список детей."))
      .finally(() => setLoading(false));
  }, [selectedGroupId]);

  // Функция для отметки посещаемости
  const handleSetPresence = useCallback(async (childId: number, isPresent: boolean) => {
    // Оптимистичное обновление UI
    setAttendance(prev => new Map(prev).set(childId, isPresent));

    try {
      await api.post("/api/attendance", {
        date,
        childId,
        isPresent,
        clubId: null, // Мы работаем с группами, а не кружками
      });
    } catch (err) {
      setError(`Ошибка сохранения для ребенка с ID ${childId}`);
      // Откатываем изменение в UI в случае ошибки
      setAttendance(prev => {
        const newMap = new Map(prev);
        newMap.delete(childId);
        return newMap;
      });
    }
  }, [date]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Посещаемость</h1>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label htmlFor="date-select" className="block text-sm font-medium text-gray-700 mb-1">
              Дата
            </label>
            <input
              id="date-select"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label htmlFor="group-select" className="block text-sm font-medium text-gray-700 mb-1">
              Класс
            </label>
            <select
              id="group-select"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
              disabled={groups.length === 0}
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {error && <div className="text-red-600 bg-red-100 p-3 rounded-md">{error}</div>}

      <Card>
        {loading ? (
          <div className="p-4 text-center">Загрузка...</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {children.map((child) => (
              <li key={child.id} className="p-4 flex justify-between items-center">
                <span className="font-medium">{child.lastName} {child.firstName}</span>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSetPresence(child.id, true)}
                    className={`!px-3 !py-1 text-sm ${attendance.get(child.id) === true ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    Присутствует
                  </Button>
                  <Button
                    onClick={() => handleSetPresence(child.id, false)}
                    className={`!px-3 !py-1 text-sm ${attendance.get(child.id) === false ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    Отсутствует
                  </Button>
                </div>
              </li>
            ))}
            {children.length === 0 && !loading && (
              <li className="p-4 text-center text-gray-500">В этом классе нет детей или класс не выбран.</li>
            )}
          </ul>
        )}
      </Card>
    </div>
  );
}