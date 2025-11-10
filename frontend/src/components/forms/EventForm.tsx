import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { FormError } from '../ui/FormError';
import { Event } from '../../types/calendar';

const formSchema = z.object({
  title: z.string().min(3, 'Название должно быть не менее 3 символов'),
  description: z.string().min(10, 'Описание должно быть не менее 10 символов'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Неверная дата'),
});

type EventFormData = z.infer<typeof formSchema>;
type EventFormProps = { 
  initialData?: Event | null; 
  onSuccess: () => void; 
  onCancel: () => void; 
};

export function EventForm({ initialData, onSuccess, onCancel }: EventFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EventFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      date: initialData ? new Date(initialData.date).toISOString().slice(0, 16) : '',
    },
  });

  const onSubmit = async (data: EventFormData) => {
    try {
      const payload = {
        ...data,
        date: new Date(data.date).toISOString(),
      };

      if (initialData) {
        await api.put(`/api/calendar/${initialData.id}`, payload);
      } else {
        await api.post('/api/calendar', payload);
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
        <label className="block text-sm font-medium mb-1">Название события</label>
        <Input {...register('title')} placeholder="День открытых дверей" />
        <FormError message={errors.title?.message} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Описание</label>
        <textarea
          {...register('description')}
          placeholder="Подробное описание события..."
          className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <FormError message={errors.description?.message} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Дата и время</label>
        <Input type="datetime-local" {...register('date')} />
        <FormError message={errors.date?.message} />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>Отмена</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>
    </form>
  );
}
