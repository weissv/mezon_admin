// src/components/forms/ChildForm.tsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { FormError } from '../ui/FormError';

const formSchema = z.object({
  firstName: z.string().min(2, 'Минимум 2 символа'),
  lastName: z.string().min(2, 'Минимум 2 символа'),
  birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Неверная дата'),
  groupId: z.coerce.number().positive('Выберите группу'),
  healthInfo: z.string().optional(),
});

type ChildFormData = z.infer<typeof formSchema>;
type Child = { id: number; firstName: string; lastName: string; birthDate: string; group: {id: number}, healthInfo?: string; };
type ChildFormProps = { initialData?: Child | null; onSuccess: () => void; onCancel: () => void; };

export function ChildForm({ initialData, onSuccess, onCancel }: ChildFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ChildFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      birthDate: initialData ? new Date(initialData.birthDate).toISOString().split('T')[0] : '',
      groupId: initialData?.group?.id || undefined,
      healthInfo: initialData?.healthInfo || '',
    },
  });

  const onSubmit = async (data: ChildFormData) => {
    try {
      if (initialData) { await api.put(`/api/children/${initialData.id}`, data); }
      else { await api.post('/api/children', data); }
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
        <label>ID Группы</label>
        <Input type="number" {...register('groupId')} />
        <FormError message={errors.groupId?.message} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Отмена</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Сохранение...' : 'Сохранить'}</Button>
      </div>
    </form>
  );
}
