import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { FormError } from '../ui/FormError';
import { DocumentTemplate } from '../../types/document';

const formSchema = z.object({
  name: z.string().min(2, 'Название обязательно'),
  content: z.string().min(10, 'Содержимое должно быть не менее 10 символов'),
});

type DocumentTemplateFormData = z.infer<typeof formSchema>;
type DocumentTemplateFormProps = { 
  initialData?: DocumentTemplate | null; 
  onSuccess: () => void; 
  onCancel: () => void; 
};

export function DocumentTemplateForm({ initialData, onSuccess, onCancel }: DocumentTemplateFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<DocumentTemplateFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      content: initialData?.content || '',
    },
  });

  const onSubmit = async (data: DocumentTemplateFormData) => {
    try {
      if (initialData) {
        await api.put(`/api/documents/templates/${initialData.id}`, data);
      } else {
        await api.post('/api/documents/templates', data);
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
        <label className="block text-sm font-medium mb-1">Название шаблона</label>
        <Input {...register('name')} placeholder="Договор стандартный" />
        <FormError message={errors.name?.message} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Содержимое</label>
        <textarea
          {...register('content')}
          placeholder="Шаблон документа..."
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <FormError message={errors.content?.message} />
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
