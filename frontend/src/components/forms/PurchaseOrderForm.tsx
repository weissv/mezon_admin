import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { FormError } from '../ui/FormError';
import { PurchaseOrder, purchaseOrderTypeLabels } from '../../types/procurement';
import { PlusCircle, Trash2 } from 'lucide-react';

const orderItemSchema = z.object({
  name: z.string().min(1, 'Наименование обязательно'),
  quantity: z.coerce.number().positive('Количество должно быть > 0'),
  unit: z.string().min(1, 'Единица измерения обязательна'),
  price: z.coerce.number().positive('Цена должна быть > 0'),
  ingredientId: z.coerce.number().optional().nullable(),
  inventoryItemId: z.coerce.number().optional().nullable(),
});

const formSchema = z.object({
  type: z.enum(['PLANNED', 'OPERATIONAL']),
  title: z.string().min(2, 'Название обязательно'),
  description: z.string().optional(),
  supplierId: z.coerce.number().positive('Выберите поставщика'),
  priority: z.coerce.number().min(1).max(5).default(3),
  expectedDeliveryDate: z.string().optional().nullable(),
  budgetSource: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'Добавьте хотя бы один товар'),
});

type PurchaseOrderFormData = z.infer<typeof formSchema>;
type PurchaseOrderFormProps = { 
  initialData?: Partial<PurchaseOrder> | null; 
  onSuccess: () => void; 
  onCancel: () => void; 
};

interface SupplierOption { id: number; name: string; }
interface InventoryItemOption { id: number; name: string; unit: string; quantity: number; }

export function PurchaseOrderForm({ initialData, onSuccess, onCancel }: PurchaseOrderFormProps) {
  const currency = new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 });
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!(initialData?.id);

  const { register, handleSubmit, control, formState: { errors, isSubmitting }, watch, setValue } = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: initialData?.type || 'PLANNED',
      title: initialData?.title || '',
      description: initialData?.description || '',
      supplierId: initialData?.supplierId || undefined,
      priority: initialData?.priority || 3,
      expectedDeliveryDate: initialData?.expectedDeliveryDate ? new Date(initialData.expectedDeliveryDate).toISOString().split('T')[0] : '',
      budgetSource: initialData?.budgetSource || '',
      items: initialData?.items?.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        ingredientId: item.ingredientId || null,
        inventoryItemId: item.inventoryItemId || null,
      })) || [{ name: '', quantity: 1, unit: 'шт', price: 0, ingredientId: null, inventoryItemId: null }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.get('/api/procurement/suppliers').catch(() => []),
      api.get('/api/inventory').catch(() => []),
    ])
      .then(([suppliersData, inventoryData]) => {
        setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
        const invItems = Array.isArray(inventoryData) ? inventoryData : (inventoryData?.items || []);
        setInventoryItems(invItems);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const items = watch('items');
  const totalAmount = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);

  // Автозаполнение из складского товара
  const handleInventoryItemChange = (index: number, itemId: string) => {
    if (!itemId) {
      setValue(`items.${index}.inventoryItemId`, null);
      return;
    }
    const invItem = inventoryItems.find(i => i.id === parseInt(itemId));
    if (invItem) {
      setValue(`items.${index}.inventoryItemId`, invItem.id);
      setValue(`items.${index}.name`, invItem.name);
      setValue(`items.${index}.unit`, invItem.unit);
    }
  };

  const onSubmit = async (data: PurchaseOrderFormData) => {
    try {
      const payload = {
        type: data.type,
        title: data.title,
        description: data.description || undefined,
        supplierId: data.supplierId,
        priority: data.priority,
        expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate).toISOString() : undefined,
        budgetSource: data.budgetSource || undefined,
        items: data.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          ingredientId: item.ingredientId || undefined,
          inventoryItemId: item.inventoryItemId || undefined,
        })),
      };

      if (isEditing) {
        await api.put(`/api/procurement/orders/${initialData!.id}`, payload);
        toast.success('Заказ обновлён');
      } else {
        await api.post('/api/procurement/orders', payload);
        toast.success('Заказ создан');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || 'Ошибка сохранения');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {/* Тип закупки */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Тип закупки *</label>
          <select {...register('type')} className="w-full px-3 py-2 border rounded-md text-sm">
            <option value="PLANNED">{purchaseOrderTypeLabels['PLANNED']}</option>
            <option value="OPERATIONAL">{purchaseOrderTypeLabels['OPERATIONAL']}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Приоритет</label>
          <select {...register('priority', { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-md text-sm">
            <option value={1}>1 — Низкий</option>
            <option value={2}>2 — Ниже среднего</option>
            <option value={3}>3 — Обычный</option>
            <option value={4}>4 — Высокий</option>
            <option value={5}>5 — Срочный</option>
          </select>
        </div>
      </div>

      {/* Название и обоснование */}
      <div>
        <label className="block text-sm font-medium mb-1">Название *</label>
        <Input {...register('title')} placeholder="Закупка канцтоваров на февраль" />
        <FormError message={errors.title?.message} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Обоснование / описание</label>
        <textarea
          {...register('description')}
          className="w-full p-2 border rounded-md text-sm"
          rows={2}
          placeholder="Доп. информация или обоснование закупки..."
        />
      </div>

      {/* Поставщик и дата */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Поставщик *</label>
          <select
            {...register('supplierId', { valueAsNumber: true })}
            className="w-full px-3 py-2 border rounded-md text-sm"
            disabled={isLoading}
          >
            <option value="">{isLoading ? 'Загрузка...' : 'Выберите поставщика'}</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <FormError message={errors.supplierId?.message} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ожид. дата доставки</label>
          <Input type="date" {...register('expectedDeliveryDate')} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Источник финансирования</label>
        <Input {...register('budgetSource')} placeholder="Бюджет школы, спонсорские и т.д." />
      </div>

      {/* Позиции заказа */}
      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium">Позиции заказа</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ name: '', quantity: 1, unit: 'шт', price: 0, ingredientId: null, inventoryItemId: null })}
          >
            <PlusCircle className="h-4 w-4 mr-1" /> Добавить
          </Button>
        </div>

        {fields.length > 0 && (
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-1 mb-1 text-xs text-gray-500 font-medium px-1">
            <span>Наименование</span>
            <span className="w-20 text-center">Кол-во</span>
            <span className="w-16 text-center">Ед.</span>
            <span className="w-24 text-center">Цена</span>
            <span className="w-32 text-center">Со склада</span>
            <span className="w-8"></span>
          </div>
        )}

        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-1 mb-2 items-start">
            <Input
              {...register(`items.${index}.name`)}
              placeholder="Наименование"
              className="text-sm"
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Кол-во"
              {...register(`items.${index}.quantity`)}
              className="w-20 text-sm"
            />
            <Input
              {...register(`items.${index}.unit`)}
              placeholder="Ед."
              className="w-16 text-sm"
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Цена"
              {...register(`items.${index}.price`)}
              className="w-24 text-sm"
            />
            <select
              className="w-32 px-2 py-2 border rounded-md text-xs"
              onChange={(e) => handleInventoryItemChange(index, e.target.value)}
              defaultValue={initialData?.items?.[index]?.inventoryItemId?.toString() || ''}
            >
              <option value="">— нет —</option>
              {inventoryItems.map((inv) => (
                <option key={inv.id} value={inv.id}>{inv.name}</option>
              ))}
            </select>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => remove(index)}
              disabled={fields.length === 1}
              className="h-9"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {errors.items && <FormError message={typeof errors.items.message === 'string' ? errors.items.message : 'Проверьте позиции'} />}
      </div>

      <div className="border-t pt-3">
        <div className="text-lg font-semibold text-right">
          Итого: {currency.format(totalAmount)}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Отмена</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Сохранение...' : isEditing ? 'Обновить заказ' : 'Создать заказ'}
        </Button>
      </div>
    </form>
  );
}
