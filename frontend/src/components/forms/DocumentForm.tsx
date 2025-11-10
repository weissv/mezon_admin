import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { FormError } from '../ui/FormError';
import { Document } from '../../types/document';

const formSchema = z.object({
  name: z.string().min(2, 'Название обязательно'),
  fileUrl: z.string().url('Должна быть ссылка на файл'),
  templateId: z.coerce.number().optional().nullable(),
  employeeId: z.coerce.number().optional().nullable(),
  childId: z.coerce.number().optional().nullable(),
});

type DocumentFormData = z.infer<typeof formSchema>;
type DocumentFormProps = { 
  initialData?: Document | null; 
  onSuccess: () => void; 
  onCancel: () => void; 
};

export function DocumentForm({ initialData, onSuccess, onCancel }: DocumentFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<DocumentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      fileUrl: initialData?.fileUrl || '',
      templateId: initialData?.templateId || null,
      employeeId: initialData?.employeeId || null,
      childId: initialData?.childId || null,
    },
  });

  const onSubmit = async (data: DocumentFormData) => {
    try {
      if (initialData) {
        await api.put(`/api/documents/${initialData.id}`, data);
      } else {
        await api.post('/api/documents', data);
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
        <label className="block text-sm font-medium mb-1">Название документа</label>
        <Input {...register('name')} placeholder="Договор №123" />
        <FormError message={errors.name?.message} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Ссылка на файл</label>
        <Input {...register('fileUrl')} placeholder="/uploads/document.pdf" />
        <FormError message={errors.fileUrl?.message} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">ID Шаблона (опционально)</label>
        <Input type="number" {...register('templateId')} placeholder="1" />
        <FormError message={errors.templateId?.message} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">ID Сотрудника (опционально)</label>
        <Input type="number" {...register('employeeId')} placeholder="5" />
        <FormError message={errors.employeeId?.message} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">ID Ребенка (опционально)</label>
        <Input type="number" {...register('childId')} placeholder="10" />
        <FormError message={errors.childId?.message} />
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
