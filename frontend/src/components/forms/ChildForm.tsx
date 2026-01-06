// src/components/forms/ChildForm.tsx
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { FormError } from '../ui/FormError';
import type { Child } from '../../types/child';

const formSchema = z.object({
  firstName: z.string().min(2, 'Минимум 2 символа'),
  lastName: z.string().min(2, 'Минимум 2 символа'),
  birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Неверная дата'),
  groupId: z.coerce.number().positive('Выберите класс'),
  healthInfo: z.string().optional(),
});

type ChildFormData = z.infer<typeof formSchema>;
type ChildFormProps = { initialData?: Child | null; onSuccess: () => void; onCancel: () => void; };

// Helper to convert HealthInfo object to string for the form
const getHealthInfoString = (healthInfo: Child['healthInfo']): string => {
  if (!healthInfo) return '';
  if (typeof healthInfo === 'string') return healthInfo;
  // If it's an object, serialize relevant parts
  const parts: string[] = [];
  if (healthInfo.allergies?.length) parts.push(`Аллергии: ${healthInfo.allergies.join(', ')}`);
  if (healthInfo.specialConditions?.length) parts.push(`Особые условия: ${healthInfo.specialConditions.join(', ')}`);
  if (healthInfo.medications?.length) parts.push(`Медикаменты: ${healthInfo.medications.join(', ')}`);
  if (healthInfo.notes) parts.push(`Примечания: ${healthInfo.notes}`);
  return parts.join('; ');
};

export function ChildForm({ initialData, onSuccess, onCancel }: ChildFormProps) {
  const [groups, setGroups] = useState<Array<{ id: number; name: string }>>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ChildFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      birthDate: initialData ? new Date(initialData.birthDate).toISOString().split('T')[0] : '',
      groupId: initialData?.group?.id || undefined,
      healthInfo: getHealthInfoString(initialData?.healthInfo),
    },
  });

  useEffect(() => {
    let isMounted = true;
    setIsLoadingGroups(true);
    api.get('/api/groups')
      .then((data) => {
        if (!isMounted) return;
        setGroups(Array.isArray(data) ? data : []);
      })
      .catch((error: any) => {
        const msg = error?.message || 'Не удалось загрузить список классов';
        toast.error('Ошибка загрузки классов', { description: msg });
      })
      .finally(() => {
        if (isMounted) setIsLoadingGroups(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const onSubmit = async (data: ChildFormData) => {
    try {
      const payload = {
        ...data,
        birthDate: new Date(data.birthDate).toISOString(),
      }

      if (initialData) {
        await api.put(`/api/children/${initialData.id}`, payload);
      } else {
        await api.post('/api/children', payload);
      }
      onSuccess();
    } catch (error: any) {
      const msg = error?.message || error?.issues?.[0]?.message || 'Ошибка сохранения';
      toast.error('Ошибка сохранения', { description: msg });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label>Имя</label>
        <Input {...register('firstName')} />
        <FormError message={errors.firstName?.message} />
      </div>
      <div>
        <label>Фамилия</label>
        <Input {...register('lastName')} />
        <FormError message={errors.lastName?.message} />
      </div>
      <div>
        <label>Дата рождения</label>
        <Input type="date" {...register('birthDate')} />
        <FormError message={errors.birthDate?.message} />
      </div>
      <div>
        <label>Класс</label>
        <select
          className="w-full rounded-md border border-gray-300 px-3 py-2"
          disabled={isLoadingGroups}
          {...register('groupId', { valueAsNumber: true })}
        >
          <option value="">{isLoadingGroups ? 'Загружаем...' : 'Выберите класс'}</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        <FormError message={errors.groupId?.message} />
      </div>
      <div>
        <label>Мед. сведения (опционально)</label>
        <textarea
          className="w-full rounded-md border border-gray-300 px-3 py-2"
          rows={3}
          placeholder="Аллергии, рекомендации..."
          {...register('healthInfo')}
        />
        <FormError message={errors.healthInfo?.message} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Отмена</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Сохранение...' : 'Сохранить'}</Button>
      </div>
    </form>
  );
}
