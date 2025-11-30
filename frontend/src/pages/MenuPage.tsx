// src/pages/MenuPage.tsx
import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { FormError } from '../components/ui/FormError';
import { Calculator, ShoppingCart, Trash2, AlertTriangle } from 'lucide-react';

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
  const [kbzhuData, setKbzhuData] = useState<any>(null);
  const [shoppingList, setShoppingList] = useState<any>(null);
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      const response = await api.get(`/api/menu?startDate=${startDate}&endDate=${endDate}`);
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

  const handleCalculateKBZHU = async (menuId: number) => {
    try {
      const result = await api.post(`/api/menu/${menuId}/calculate-kbju`, {});
      setKbzhuData(result);
      setSelectedMenuId(menuId);
      toast.success('КБЖУ рассчитано успешно');
    } catch (error: any) {
      toast.error('Ошибка расчета КБЖУ', { description: error?.message });
    }
  };

  const handleGenerateShoppingList = async (menuId: number, portions: number = 25) => {
    try {
      const result = await api.get(`/api/menu/${menuId}/shopping-list?portions=${portions}`);
      setShoppingList(result);
      setSelectedMenuId(menuId);
      toast.success('Список покупок сформирован');
    } catch (error: any) {
      toast.error('Ошибка генерации списка', { description: error?.message });
    }
  };

  const handleDeleteMenu = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/menu/${deleteConfirm.id}`);
      toast.success('Меню удалено');
      setDeleteConfirm(null);
      fetchMenu(weekStart);
    } catch (error: any) {
      toast.error('Ошибка удаления меню', { description: error?.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderDay = (date: Date) => {
    const menuForDay = menus.find(m => new Date(m.date).toDateString() === date.toDateString());
    return (
      <div key={date.toISOString()}>
        <Card className="flex-1 min-w-[200px]">
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
              <div className="flex gap-2 mt-3">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleCalculateKBZHU(menuForDay.id)}
                  className="flex-1"
                >
                  <Calculator className="h-3 w-3 mr-1" /> КБЖУ
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleGenerateShoppingList(menuForDay.id)}
                  className="flex-1"
                >
                  <ShoppingCart className="h-3 w-3 mr-1" /> Список
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setDeleteConfirm(menuForDay)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 mt-2">Меню не составлено</p>
          )}
          <Button onClick={() => handleOpenModal(date)} className="mt-4 w-full">
            {menuForDay ? 'Редактировать' : 'Создать'}
          </Button>
          </div>
        </Card>
      </div>
    );
  };

  const weekDates = Array.from({ length: 5 }).map((_, i) => {
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
            {weekStart.toLocaleDateString('ru-RU')} - {new Date(weekStart.getTime() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU')}
          </span>
          <Button onClick={() => changeWeek(7)}>След. неделя</Button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {weekDates.map(date => renderDay(date))}
      </div>

      {/* КБЖУ Modal */}
      <Modal isOpen={!!kbzhuData} onClose={() => setKbzhuData(null)} title="Пищевая ценность меню">
        {kbzhuData && (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-orange-50 rounded-md">
                <div className="text-sm text-gray-600">Калорийность</div>
                <div className="text-2xl font-bold">{kbzhuData.kbju?.calories?.toFixed(1) || 0} ккал</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-md">
                <div className="text-sm text-gray-600">Белки</div>
                <div className="text-2xl font-bold">{kbzhuData.kbju?.protein?.toFixed(1) || 0} г</div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-md">
                <div className="text-sm text-gray-600">Жиры</div>
                <div className="text-2xl font-bold">{kbzhuData.kbju?.fat?.toFixed(1) || 0} г</div>
              </div>
              <div className="p-3 bg-green-50 rounded-md">
                <div className="text-sm text-gray-600">Углеводы</div>
                <div className="text-2xl font-bold">{kbzhuData.kbju?.carbs?.toFixed(1) || 0} г</div>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Возрастная группа: {kbzhuData.ageGroup}
            </p>
          </div>
        )}
      </Modal>

      {/* Shopping List Modal */}
      <Modal isOpen={!!shoppingList} onClose={() => setShoppingList(null)} title="Список покупок">
        {shoppingList && (
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-4">
              Порций: {shoppingList.portions} | Дата: {shoppingList.date && new Date(shoppingList.date).toLocaleDateString('ru-RU')}
            </p>
            <div className="space-y-2">
              {shoppingList.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between p-2 border rounded">
                  <span className="font-medium">{item.ingredientName}</span>
                  <div className="text-right">
                    <div className="text-sm">
                      Нужно: <span className="font-semibold">{item.requiredQty} {item.unit}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      На складе: {item.inStock} {item.unit}
                    </div>
                    {item.toBuy > 0 && (
                      <div className="text-sm font-bold text-red-600">
                        Купить: {item.toBuy} {item.unit}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

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

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Удаление меню">
        <div className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Вы уверены, что хотите удалить это меню?</p>
              {deleteConfirm && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium">
                    {new Date(deleteConfirm.date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Возрастная группа: {deleteConfirm.ageGroup}
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2">Это действие нельзя отменить.</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteMenu} disabled={isDeleting}>
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
