import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { FormError } from '../ui/FormError';
import { Supplier } from '../../types/procurement';

const formSchema = z.object({
  name: z.string().min(2, 'Название обязательно'),
  contactInfo: z.string().min(5, 'Контактная информация обязательна'),
});

type SupplierFormData = z.infer<typeof formSchema>;
type SupplierFormProps = { 
  initialData?: Supplier | null; 
  onSuccess: () => void; 
  onCancel: () => void; 
};

export function SupplierForm({ initialData, onSuccess, onCancel }: SupplierFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SupplierFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      contactInfo: initialData?.contactInfo || '',
    },
  });

  const onSubmit = async (data: SupplierFormData) => {
    try {
      const payload = {
        ...data,
        pricelist: initialData?.pricelist || {},
      };

      if (initialData) {
        await api.put(`/api/procurement/suppliers/${initialData.id}`, payload);
      } else {
        await api.post('/api/procurement/suppliers', payload);
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
        <label className="block text-sm font-medium mb-1">Название поставщика</label>
        <Input {...register('name')} placeholder="ООО Продукты" />
        <FormError message={errors.name?.message} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Контактная информация</label>
        <Input {...register('contactInfo')} placeholder="тел: +7(999)123-45-67, email: info@example.com" />
        <FormError message={errors.contactInfo?.message} />
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
