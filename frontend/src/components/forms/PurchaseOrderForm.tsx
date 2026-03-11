import { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { FormError } from '../ui/FormError';
import { PurchaseOrder, purchaseOrderTypeLabels } from '../../types/procurement';
import { PlusCircle, Trash2, Package, Search, ChevronDown, Link2, AlertCircle } from 'lucide-react';

// =====================================================
// ZOD SCHEMA
// =====================================================

const orderItemSchema = z.object({
  name: z.string().min(1, 'Наименование обязательно'),
  quantity: z.coerce.number().positive('Кол-во > 0'),
  unit: z.string().min(1, 'Ед. изм. обязательна'),
  price: z.coerce.number().min(0, 'Цена ≥ 0'),
  ingredientId: z.coerce.number().optional().nullable(),
  inventoryItemId: z.coerce.number().optional().nullable(),
});

const formSchema = z.object({
  type: z.enum(['PLANNED', 'OPERATIONAL']),
  title: z.string().trim().min(3, 'Название обязательно (минимум 3 символа)'),
  description: z.string().optional(),
  supplierId: z.coerce.number().optional().nullable(),
  priority: z.coerce.number().min(0).max(2).default(0),
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

// =====================================================
// SEARCHABLE INVENTORY DROPDOWN
// =====================================================

function InventoryItemCombobox({
  inventoryItems,
  value,
  onSelect,
  placeholder = 'Выберите со склада или введите вручную...',
  disabled = false,
}: {
  inventoryItems: InventoryItemOption[];
  value: string;
  onSelect: (item: InventoryItemOption | null, customName?: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (search && search !== value) {
          onSelect(null, search);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [search, value, onSelect]);

  const filtered = inventoryItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-8 pr-8 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        />
        <ChevronDown
          className={`absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 cursor-pointer transition-transform ${isOpen ? 'rotate-180' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500 italic">
              {search ? `Нет совпадений. "${search}" будет использовано как название` : 'Начните вводить для поиска...'}
            </div>
          ) : (
            filtered.map(item => (
              <button
                key={item.id}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm flex items-center justify-between gap-2 transition-colors"
                onClick={() => {
                  setSearch(item.name);
                  setIsOpen(false);
                  onSelect(item);
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Package className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 text-xs text-gray-500">
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded">{item.unit}</span>
                  <span className={`px-1.5 py-0.5 rounded ${item.quantity > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {item.quantity} {item.unit}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// =====================================================
// MAIN FORM
// =====================================================

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
      supplierId: initialData?.supplierId || null,
      priority: initialData?.priority ?? 0,
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

  // Загрузка поставщиков и складских товаров
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
  const handleInventoryItemSelect = (index: number, invItem: InventoryItemOption | null, customName?: string) => {
    if (invItem) {
      setValue(`items.${index}.inventoryItemId`, invItem.id, { shouldValidate: true });
      setValue(`items.${index}.name`, invItem.name, { shouldValidate: true });
      setValue(`items.${index}.unit`, invItem.unit, { shouldValidate: true });
    } else {
      setValue(`items.${index}.inventoryItemId`, null);
      if (customName !== undefined) {
        setValue(`items.${index}.name`, customName, { shouldValidate: true });
      }
    }
  };

  const onSubmit = async (data: PurchaseOrderFormData) => {
    try {
      const payload = {
        type: data.type,
        title: data.title.trim(),
        description: data.description || undefined,
        supplierId: data.supplierId || undefined,
        priority: data.priority,
        orderDate: initialData?.orderDate || new Date().toISOString(),
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
      const validationMessage = Array.isArray(error?.details)
        ? error.details.map((issue: any) => issue?.message).filter(Boolean).join('\n')
        : undefined;
      toast.error(validationMessage || error?.message || 'Ошибка сохранения');
    }
  };

  const selectedType = watch('type');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-h-[75vh] overflow-y-auto pr-2">
      {/* Тип и приоритет */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Тип закупки</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setValue('type', 'PLANNED')}
              className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                selectedType === 'PLANNED'
                  ? 'bg-blue-50 border-blue-300 text-blue-700 ring-1 ring-blue-200'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              📋 Плановая
            </button>
            <button
              type="button"
              onClick={() => setValue('type', 'OPERATIONAL')}
              className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                selectedType === 'OPERATIONAL'
                  ? 'bg-red-50 border-red-300 text-red-700 ring-1 ring-red-200'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              ⚡ Оперативная
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Приоритет</label>
          <div className="flex gap-2">
            {[
              { value: 0, label: 'Обычный', color: 'gray' },
              { value: 1, label: 'Срочный', color: 'orange' },
              { value: 2, label: 'Крит.', color: 'red' },
            ].map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setValue('priority', p.value)}
                className={`flex-1 py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                  watch('priority') === p.value
                    ? p.color === 'gray'
                      ? 'bg-gray-100 border-gray-300 text-gray-700 ring-1 ring-gray-200'
                      : p.color === 'orange'
                        ? 'bg-orange-50 border-orange-300 text-orange-700 ring-1 ring-orange-200'
                        : 'bg-red-50 border-red-300 text-red-700 ring-1 ring-red-200'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Название */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Название закупки *</label>
        <Input {...register('title')} placeholder="Напр.: Закупка канцтоваров на март" className="text-sm" />
        <FormError message={errors.title?.message} />
      </div>

      {/* Описание */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Обоснование / описание</label>
        <textarea
          {...register('description')}
          className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows={2}
          placeholder="Краткое обоснование или доп. информация..."
        />
      </div>

      {/* Поставщик и дата */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Поставщик <span className="text-gray-400 font-normal">(необязательно)</span>
          </label>
          <select
            {...register('supplierId', { setValueAs: (v) => (v === '' || v === null || v === undefined) ? null : Number(v) })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            disabled={isLoading}
          >
            <option value="">{isLoading ? 'Загрузка...' : '— Без поставщика —'}</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ожид. дата доставки</label>
          <Input type="date" {...register('expectedDeliveryDate')} className="text-sm" />
        </div>
      </div>

      {/* Источник финансирования */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Источник финансирования</label>
        <Input {...register('budgetSource')} placeholder="Бюджет школы, спонсорские и т.д." className="text-sm" />
      </div>

      {/* =====================================================
          ПОЗИЦИИ ЗАКАЗА (главная часть)
          ===================================================== */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-semibold text-gray-800">Позиции заказа</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Выберите товар со склада или введите название вручную
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ name: '', quantity: 1, unit: 'шт', price: 0, ingredientId: null, inventoryItemId: null })}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <PlusCircle className="h-4 w-4 mr-1" /> Добавить позицию
          </Button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => {
            const itemData = items[index];
            const isLinked = !!itemData?.inventoryItemId;
            const linkedItem = isLinked ? inventoryItems.find(i => i.id === itemData.inventoryItemId) : null;

            return (
              <div key={field.id} className={`rounded-lg border p-3 transition-all ${isLinked ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white'}`}>
                {/* Row 1: Наименование (combobox) + кнопка удаления */}
                <div className="flex gap-2 items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Наименование *
                      {isLinked && (
                        <span className="ml-2 inline-flex items-center gap-0.5 text-green-600">
                          <Link2 className="h-3 w-3" />
                          Привязан к складу
                          {linkedItem && ` (остаток: ${linkedItem.quantity} ${linkedItem.unit})`}
                        </span>
                      )}
                    </label>
                    <Controller
                      control={control}
                      name={`items.${index}.name`}
                      render={({ field: nameField }) => (
                        <InventoryItemCombobox
                          inventoryItems={inventoryItems}
                          value={nameField.value || ''}
                          onSelect={(invItem, customName) => handleInventoryItemSelect(index, invItem, customName)}
                          placeholder="Начните вводить или выберите со склада..."
                          disabled={isLoading}
                        />
                      )}
                    />
                    <FormError message={errors.items?.[index]?.name?.message} />
                  </div>
                  <div className="pt-5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 h-9 w-9 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Row 2: Кол-во, Ед, Цена, Итого */}
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Кол-во *</label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      placeholder="0"
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      className="text-sm text-center"
                    />
                    <FormError message={errors.items?.[index]?.quantity?.message} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Ед. изм. *</label>
                    <Controller
                      control={control}
                      name={`items.${index}.unit`}
                      render={({ field: unitField }) => (
                        <select
                          value={unitField.value}
                          onChange={unitField.onChange}
                          className="w-full px-2 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="шт">шт</option>
                          <option value="кг">кг</option>
                          <option value="л">л</option>
                          <option value="м">м</option>
                          <option value="уп">уп</option>
                          <option value="пач">пач</option>
                          <option value="кор">кор</option>
                          <option value="бут">бут</option>
                          <option value="банка">банка</option>
                          <option value="ящ">ящ</option>
                          <option value="рул">рул</option>
                          <option value="комп">комп</option>
                        </select>
                      )}
                    />
                    <FormError message={errors.items?.[index]?.unit?.message} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Цена за ед.</label>
                    <Input
                      type="number"
                      step="100"
                      min="0"
                      placeholder="0"
                      {...register(`items.${index}.price`, { valueAsNumber: true })}
                      className="text-sm text-right"
                    />
                    <FormError message={errors.items?.[index]?.price?.message} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Сумма</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-right font-medium text-gray-700">
                      {currency.format((itemData?.quantity || 0) * (itemData?.price || 0))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {errors.items && typeof errors.items.message === 'string' && (
          <div className="mt-2 flex items-center gap-1.5 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <FormError message={errors.items.message} />
          </div>
        )}
      </div>

      {/* Итого */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Позиций: {fields.length}</span>
          <div className="text-lg font-bold text-gray-800">
            Итого: <span className="text-blue-600">{currency.format(totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Кнопки */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onCancel} className="px-6">
          Отмена
        </Button>
        <Button type="submit" disabled={isSubmitting} className="px-6">
          {isSubmitting ? 'Сохранение...' : isEditing ? 'Обновить заказ' : 'Создать заказ'}
        </Button>
      </div>
    </form>
  );
}
