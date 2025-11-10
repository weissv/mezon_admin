import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { Button } from '../ui/button';
import { FormError } from '../ui/FormError';
import { Feedback } from '../../types/feedback';

const formSchema = z.object({
  response: z.string().min(10, 'Ответ должен быть не менее 10 символов'),
  status: z.enum(['IN_PROGRESS', 'RESOLVED']),
});

type FeedbackResponseFormData = z.infer<typeof formSchema>;
type FeedbackResponseFormProps = { 
  feedback: Feedback;
  onSuccess: () => void; 
  onCancel: () => void; 
};

export function FeedbackResponseForm({ feedback, onSuccess, onCancel }: FeedbackResponseFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FeedbackResponseFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      response: feedback.response || '',
      status: feedback.status === 'NEW' ? 'IN_PROGRESS' : feedback.status,
    },
  });

  const onSubmit = async (data: FeedbackResponseFormData) => {
    try {
      await api.put(`/api/feedback/${feedback.id}`, data);
      onSuccess();
    } catch (error: any) {
      const msg = error?.message || 'Ошибка сохранения';
      toast.error('Ошибка', { description: msg });
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-md">
        <h3 className="font-medium mb-2">Исходное обращение:</h3>
        <p className="text-sm text-gray-700 mb-2">
          <strong>От:</strong> {feedback.parentName} ({feedback.contactInfo})
        </p>
        <p className="text-sm text-gray-700 mb-2">
          <strong>Тип:</strong> {feedback.type}
        </p>
        <p className="text-sm text-gray-700">
          <strong>Сообщение:</strong> {feedback.message}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Ответ</label>
          <textarea
            {...register('response')}
            placeholder="Ваш ответ на обращение..."
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FormError message={errors.response?.message} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Статус</label>
          <select 
            {...register('status')} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="IN_PROGRESS">В работе</option>
            <option value="RESOLVED">Решено</option>
          </select>
          <FormError message={errors.status?.message} />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>Отмена</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Сохранение...' : 'Сохранить ответ'}
          </Button>
        </div>
      </form>
    </div>
  );
}
