import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { FormError } from '../ui/FormError';
import { PurchaseOrder } from '../../types/procurement';
import { PlusCircle, Trash2 } from 'lucide-react';

const orderItemSchema = z.object({
  ingredientId: z.coerce.number().positive('Выберите ингредиент'),
  quantity: z.coerce.number().positive('Количество должно быть > 0'),
  price: z.coerce.number().positive('Цена должна быть > 0'),
});

const formSchema = z.object({
  supplierId: z.coerce.number().positive('Выберите поставщика'),
  orderDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Неверная дата'),
  deliveryDate: z.string().optional().nullable(),
  status: z.enum(['PENDING', 'APPROVED', 'DELIVERED']),
  items: z.array(orderItemSchema).min(1, 'Добавьте хотя бы один товар'),
});

type PurchaseOrderFormData = z.infer<typeof formSchema>;
type PurchaseOrderFormProps = { 
  initialData?: PurchaseOrder | null; 
  onSuccess: () => void; 
  onCancel: () => void; 
};

interface Supplier { id: number; name: string; }
interface Ingredient { id: number; name: string; unit: string; }

export function PurchaseOrderForm({ initialData, onSuccess, onCancel }: PurchaseOrderFormProps) {
  const currency = new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, control, formState: { errors, isSubmitting }, watch } = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplierId: initialData?.supplierId || undefined,
      orderDate: initialData?.orderDate ? new Date(initialData.orderDate).toISOString().split('T')[0] : '',
      deliveryDate: initialData?.deliveryDate ? new Date(initialData.deliveryDate).toISOString().split('T')[0] : '',
      status: initialData?.status || 'PENDING',
      items: initialData?.items?.map(item => ({
        ingredientId: item.ingredientId,
        quantity: item.quantity,
        price: item.price,
      })) || [{ ingredientId: 0, quantity: 1, price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Загрузка поставщиков и ингредиентов
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.get('/api/procurement/suppliers').catch(() => []),
      api.get('/api/recipes/ingredients').catch(() => []),
    ])
      .then(([suppliersData, ingredientsData]) => {
        setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
        setIngredients(Array.isArray(ingredientsData) ? ingredientsData : []);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const items = watch('items');
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price || 0), 0);

  const onSubmit = async (data: PurchaseOrderFormData) => {
    try {
      const payload = {
        supplierId: data.supplierId,
        orderDate: new Date(data.orderDate).toISOString(),
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate).toISOString() : null,
        status: data.status,
        items: data.items,
      };

      if (initialData) {
        await api.put(`/api/procurement/orders/${initialData.id}`, payload);
      } else {
        await api.post('/api/procurement/orders', payload);
      }
      onSuccess();
    } catch (error: any) {
      const msg = error?.message || 'Ошибка сохранения';
      toast.error('Ошибка', { description: msg });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Поставщик *</label>
        <select
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          {...register('supplierId', { valueAsNumber: true })}
          disabled={isLoading}
        >
          <option value="">{isLoading ? 'Загружаем...' : 'Выберите поставщика'}</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <FormError message={errors.supplierId?.message} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Дата заказа *</label>
          <Input type="date" {...register('orderDate')} />
          <FormError message={errors.orderDate?.message} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Дата доставки</label>
          <Input type="date" {...register('deliveryDate')} />
          <FormError message={errors.deliveryDate?.message} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Статус</label>
        <select 
          {...register('status')} 
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="PENDING">Ожидает</option>
          <option value="APPROVED">Утвержден</option>
          <option value="DELIVERED">Доставлен</option>
        </select>
        <FormError message={errors.status?.message} />
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium">Товары в заказе</h3>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => append({ ingredientId: 0, quantity: 1, price: 0 })}
          >
            <PlusCircle className="h-4 w-4 mr-1" /> Добавить
          </Button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2 mb-2 items-start">
            <div className="flex-1">
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                {...register(`items.${index}.ingredientId`, { valueAsNumber: true })}
                disabled={isLoading}
              >
                <option value="">{isLoading ? 'Загрузка...' : 'Выберите ингредиент'}</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                ))}
              </select>
            </div>
            <Input 
              type="number" 
              step="0.01"
              placeholder="Кол-во" 
              {...register(`items.${index}.quantity`)}
              className="w-24"
            />
            <Input 
              type="number" 
              step="0.01"
              placeholder="Цена" 
              {...register(`items.${index}.price`)}
              className="w-28"
            />
            <Button 
              type="button" 
              variant="destructive" 
              size="sm"
              onClick={() => remove(index)}
              disabled={fields.length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {errors.items && <FormError message={errors.items.message} />}
      </div>

      <div className="border-t pt-4">
        <div className="text-lg font-semibold text-right">
            Итого: {currency.format(totalAmount)}
          </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>Отмена</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Сохранение...' : 'Сохранить заказ'}
        </Button>
      </div>
    </form>
  );
}
