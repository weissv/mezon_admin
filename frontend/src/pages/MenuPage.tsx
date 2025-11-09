// src/pages/MenuPage.tsx
import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../lib/api';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { FormError } from '../components/ui/FormError';

// Схема валидации на основе бэкенд-схемы
const mealSchema = z.object({
  name: z.string().min(1, 'Название приема пищи обязательно'),
  dish: z.string().min(1, 'Название блюда обязательно'),
  calories: z.coerce.number().optional(),
});

const menuFormSchema = z.object({
  date: z.string(), // Будет устанавливаться в формате YYYY-MM-DD
  ageGroup: z.string().min(1, 'Возрастная группа обязательна'),
  meals: z.array(mealSchema).min(1, 'Добавьте хотя бы один прием пищи'),
});

type MenuFormData = z.infer<typeof menuFormSchema>;

// Утилита для получения начала недели
const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
};

export default function MenuPage() {
  const [menus, setMenus] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [weekStart, setWeekStart] = useState(getStartOfWeek(new Date()));

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<MenuFormData>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: {
      ageGroup: '1-3 года',
      meals: [{ name: 'Завтрак', dish: '', calories: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'meals',
  });

  const fetchMenu = async (start: Date) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    try {
      const startDate = start.toISOString();
      const endDate = end.toISOString();
      const response = await api.get(`/menu?startDate=${startDate}&endDate=${endDate}`);
      setMenus(response.data.items || []);
    } catch (error) {
      console.error('Failed to fetch menu:', error);
    }
  };

  useEffect(() => {
    fetchMenu(weekStart);
  }, [weekStart]);

  const handleOpenModal = (date: Date) => {
    const existingMenu = menus.find(m => new Date(m.date).toDateString() === date.toDateString());
    if (existingMenu) {
      reset({
        date: date.toISOString().split('T')[0],
        ageGroup: existingMenu.ageGroup,
        meals: existingMenu.meals.map((m: any) => ({ name: m.name, dish: m.dish, calories: m.calories })),
      });
    } else {
      reset({
        date: date.toISOString().split('T')[0],
        ageGroup: '1-3 года',
        meals: [{ name: 'Завтрак', dish: '', calories: 0 }],
      });
    }
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const onSubmit = async (data: MenuFormData) => {
    try {
      // Дата уже в формате YYYY-MM-DD, добавляем время для соответствия ISO
      const payload = {
        ...data,
        date: new Date(data.date).toISOString(),
      };
      await api.post('/menu', payload);
      setIsModalOpen(false);
      fetchMenu(weekStart); // Обновляем список
    } catch (error) {
      console.error('Failed to save menu:', error);
      alert('Не удалось сохранить меню. Посмотрите в консоль для деталей.');
    }
  };

  const changeWeek = (offset: number) => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(newWeekStart.getDate() + offset);
    setWeekStart(newWeekStart);
  };

  const renderDay = (date: Date) => {
    const menuForDay = menus.find(m => new Date(m.date).toDateString() === date.toDateString());
    return (
      <Card key={date.toISOString()} className="flex-1 min-w-[200px]">
        <div className="p-4">
          <h3 className="font-bold text-lg">{date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
          {menuForDay ? (
            <div className="mt-2">
              <p className="font-semibold text-sm text-gray-600">{menuForDay.ageGroup}</p>
              <ul className="mt-1 list-disc list-inside">
                {menuForDay.meals.map((meal: any, i: number) => (
                  <li key={i}><strong>{meal.name}:</strong> {meal.dish} ({meal.calories} ккал)</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500 mt-2">Меню не составлено</p>
          )}
          <Button onClick={() => handleOpenModal(date)} className="mt-4 w-full">
            {menuForDay ? 'Редактировать' : 'Создать'}
          </Button>
        </div>
      </Card>
    );
  };

  const weekDates = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Меню на неделю</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => changeWeek(-7)}>Пред. неделя</Button>
          <span className="font-semibold">
            {weekStart.toLocaleDateString('ru-RU')} - {new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU')}
          </span>
          <Button onClick={() => changeWeek(7)}>След. неделя</Button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {weekDates.map(date => renderDay(date))}
      </div>

      {isModalOpen && selectedDate && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Меню на ${selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`}>
          <form onSubmit={handleSubmit(onSubmit)} className="p-4">
            <div className="mb-4">
              <label htmlFor="ageGroup" className="block mb-1">Возрастная группа</label>
              <select {...register('ageGroup')} id="ageGroup" className="w-full p-2 border rounded">
                <option>1-3 года</option>
                <option>3-7 лет</option>
              </select>
              {errors.ageGroup && <FormError message={errors.ageGroup.message} />}
            </div>

            <h3 className="font-semibold mb-2">Приемы пищи</h3>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start mb-2 border p-2 rounded">
                <div className="flex-1">
                  <Input {...register(`meals.${index}.name`)} placeholder="Название (напр. Завтрак)" />
                  {errors.meals?.[index]?.name && <FormError message={errors.meals[index]?.name?.message} />}
                  <Input {...register(`meals.${index}.dish`)} placeholder="Блюдо (напр. Каша овсяная)" className="mt-1" />
                  {errors.meals?.[index]?.dish && <FormError message={errors.meals[index]?.dish?.message} />}
                   <Input type="number" {...register(`meals.${index}.calories`)} placeholder="Калории" className="mt-1" />
                  {errors.meals?.[index]?.calories && <FormError message={errors.meals[index]?.calories?.message} />}
                </div>
                <Button type="button" variant="destructive" onClick={() => remove(index)}>Удалить</Button>
              </div>
            ))}
            {errors.meals?.root && <FormError message={errors.meals.root.message} />}


            <Button type="button" onClick={() => append({ name: '', dish: '', calories: 0 })} className="mt-2">
              Добавить прием пищи
            </Button>

            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Отмена</Button>
              <Button type="submit">Сохранить</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
