import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { FormError } from '../ui/FormError';

const formSchema = z.object({
  firstName: z.string().min(2, 'Имя обязательно'),
  lastName: z.string().min(2, 'Фамилия обязательна'),
  position: z.string().min(2, 'Должность обязательна'),
  rate: z.coerce.number().positive('Ставка должна быть > 0'),
  hireDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Неверная дата'),
  branchId: z.coerce.number().positive('ID филиала обязательно'),
});

type EmployeeFormData = z.infer<typeof formSchema>;
type Employee = { id: number; firstName: string; lastName: string; position: string; rate: number; hireDate: string, branch: { id: number } };
type EmployeeFormProps = { initialData?: Employee | null; onSuccess: () => void; onCancel: () => void; };

export function EmployeeForm({ initialData, onSuccess, onCancel }: EmployeeFormProps) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EmployeeFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: initialData?.firstName || '',
            lastName: initialData?.lastName || '',
            position: initialData?.position || '',
            rate: initialData?.rate || 1,
            hireDate: initialData ? new Date(initialData.hireDate).toISOString().split('T')[0] : '',
            branchId: initialData?.branch?.id || undefined,
        },
    });

    const onSubmit = async (data: EmployeeFormData) => {
        try {
            const payload = { employee: data };
            if (initialData) {
                // Assuming update logic is different and might not need the wrapper
                await api.put(`/api/employees/${initialData.id}`, data);
            } else {
                await api.post('/api/employees', payload);
            }
            onSuccess();
        } catch (error: any) {
            const msg = error?.message || 'Ошибка сохранения';
            toast.error('Ошибка', { description: msg });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input {...register('firstName')} placeholder="Имя"/>
            <FormError message={errors.firstName?.message} />
            <Input {...register('lastName')} placeholder="Фамилия"/>
            <FormError message={errors.lastName?.message} />
            <Input {...register('position')} placeholder="Должность"/>
            <FormError message={errors.position?.message} />
            <Input type="number" step="0.1" {...register('rate')} placeholder="Ставка"/>
            <FormError message={errors.rate?.message} />
            <Input type="date" {...register('hireDate')} />
            <FormError message={errors.hireDate?.message} />
            <Input type="number" {...register('branchId')} placeholder="ID Филиала"/>
            <FormError message={errors.branchId?.message} />
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onCancel}>Отмена</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Сохранение...' : 'Сохранить'}</Button>
            </div>
        </form>
    );
}