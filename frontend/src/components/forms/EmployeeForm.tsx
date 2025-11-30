import { useState, useEffect } from 'react';
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
  branchId: z.coerce.number().positive('Выберите филиал'),
});

type EmployeeFormData = z.infer<typeof formSchema>;
type Employee = { id: number; firstName: string; lastName: string; position: string; rate: number; hireDate: string, branch: { id: number } };
type EmployeeFormProps = { initialData?: Employee | null; onSuccess: () => void; onCancel: () => void; };

interface Branch {
  id: number;
  name: string;
  address: string;
}

export function EmployeeForm({ initialData, onSuccess, onCancel }: EmployeeFormProps) {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isLoadingBranches, setIsLoadingBranches] = useState(false);
    
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

    useEffect(() => {
        let isMounted = true;
        setIsLoadingBranches(true);
        api.get('/api/branches')
            .then((data) => {
                if (!isMounted) return;
                setBranches(Array.isArray(data) ? data : []);
            })
            .catch((error: any) => {
                const msg = error?.message || 'Не удалось загрузить список филиалов';
                toast.error('Ошибка загрузки филиалов', { description: msg });
            })
            .finally(() => {
                if (isMounted) setIsLoadingBranches(false);
            });
        return () => { isMounted = false; };
    }, []);

    const onSubmit = async (data: EmployeeFormData) => {
        try {
            const payload = {
                ...data,
                hireDate: new Date(data.hireDate).toISOString(),
            };
            if (initialData) {
                await api.put(`/api/employees/${initialData.id}`, payload);
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
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
                <Input {...register('firstName')} placeholder="Введите имя"/>
                <FormError message={errors.firstName?.message} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия *</label>
                <Input {...register('lastName')} placeholder="Введите фамилию"/>
                <FormError message={errors.lastName?.message} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Должность *</label>
                <Input {...register('position')} placeholder="Например: Учитель"/>
                <FormError message={errors.position?.message} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ставка *</label>
                <Input type="number" step="0.1" {...register('rate')} placeholder="1.0"/>
                <FormError message={errors.rate?.message} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата приёма *</label>
                <Input type="date" {...register('hireDate')} />
                <FormError message={errors.hireDate?.message} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Филиал *</label>
                <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    disabled={isLoadingBranches}
                    {...register('branchId', { valueAsNumber: true })}
                >
                    <option value="">{isLoadingBranches ? 'Загружаем...' : 'Выберите филиал'}</option>
                    {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                            {branch.name} — {branch.address}
                        </option>
                    ))}
                </select>
                <FormError message={errors.branchId?.message} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Отмена</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Сохранение...' : 'Сохранить'}</Button>
            </div>
        </form>
    );
}