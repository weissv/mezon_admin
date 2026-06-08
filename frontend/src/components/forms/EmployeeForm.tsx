import { BriefcaseBusiness, Save, UserRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { ModalNotice, ModalSection } from '../Modal';
import { Button } from '../ui/button';
import { FormError } from '../ui/FormError';
import { Input } from '../ui/input';

const contractSchema = z.object({
  id: z.number().optional(),
  type: z.enum(['MAIN', 'PART_TIME', 'CONTRACTOR']),
  number: z.string().min(1, 'Номер обязателен'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Неверная дата'),
  isActive: z.boolean().optional(),
});

const formSchema = z.object({
  firstName: z.string().min(2, 'Имя обязательно'),
  lastName: z.string().min(2, 'Фамилия обязательна'),
  middleName: z.string().optional(),
  birthDate: z.string().optional(),
  position: z.string().min(2, 'Должность обязательна'),
  rate: z.coerce.number().positive('Ставка должна быть > 0'),
  hireDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Неверная дата'),
 
  hireOrderNumber: z.string().optional(),
  hireOrderDate: z.string().optional(),
  fireOrderNumber: z.string().optional(),
  fireOrderDate: z.string().optional(),
 
  contracts: z.array(contractSchema).optional(),
});

type EmployeeFormData = z.infer<typeof formSchema>;
type Employee = { 
  id: number; 
  firstName: string; 
  lastName: string; 
  middleName?: string;
  birthDate?: string; 
  position: string; 
  rate: number; 
  hireDate: string;
  hireOrderNumber?: string;
  hireOrderDate?: string;
  fireOrderNumber?: string;
  fireOrderDate?: string;
  contracts?: any[];
};
type EmployeeFormProps = { initialData?: Employee | null; onSuccess: () => void; onCancel: () => void };

export function EmployeeForm({ initialData, onSuccess, onCancel }: EmployeeFormProps) {
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<EmployeeFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      middleName: initialData?.middleName || '',
      birthDate: initialData?.birthDate ? new Date(initialData.birthDate).toISOString().split('T')[0] : '',
      position: initialData?.position || '',
      rate: initialData?.rate || 1,
      hireDate: initialData ? new Date(initialData.hireDate).toISOString().split('T')[0] : '',
      hireOrderNumber: initialData?.hireOrderNumber || '',
      hireOrderDate: initialData?.hireOrderDate ? new Date(initialData.hireOrderDate).toISOString().split('T')[0] : '',
      fireOrderNumber: initialData?.fireOrderNumber || '',
      fireOrderDate: initialData?.fireOrderDate ? new Date(initialData.fireOrderDate).toISOString().split('T')[0] : '',
      contracts: initialData?.contracts?.map(c => ({
        id: c.id,
        type: c.type,
        number: c.number,
        date: new Date(c.date).toISOString().split('T')[0],
        isActive: c.isActive ?? true,
      })) || [],
    },
  });

  const { fields: contractFields, append: appendContract, remove: removeContract } = useFieldArray({
    control,
    name: "contracts"
  });

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      const payload = {
        ...data,
        birthDate: data.birthDate ? new Date(data.birthDate).toISOString() : null,
        hireDate: new Date(data.hireDate).toISOString(),
        hireOrderNumber: data.hireOrderNumber || undefined,
        hireOrderDate: data.hireOrderDate ? new Date(data.hireOrderDate).toISOString() : undefined,
        fireOrderNumber: data.fireOrderNumber || undefined,
        fireOrderDate: data.fireOrderDate ? new Date(data.fireOrderDate).toISOString() : undefined,
        contracts: data.contracts?.map(c => ({
          ...(c.id ? { id: c.id } : {}),
          type: c.type,
          number: c.number,
          date: new Date(c.date).toISOString(),
          isActive: c.isActive ?? true,
        })),
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
    <form onSubmit={handleSubmit(onSubmit)} className="mezon-modal-form">
      <ModalSection
        title="Личные данные"
        description="Заполните имя и дату рождения так, как эти данные должны отображаться в кадровых карточках и связанных документах."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mezon-form-label">Имя *</label>
            <Input {...register('firstName')} placeholder="Введите имя" />
            <FormError message={errors.firstName?.message} />
          </div>
          <div>
            <label className="mezon-form-label">Фамилия <span className="text-macos-red">*</span></label>
            <Input {...register('lastName')} placeholder="Введите фамилию" />
            <FormError message={errors.lastName?.message} />
          </div>
          <div>
            <label className="mezon-form-label">Отчество</label>
            <Input {...register('middleName')} placeholder="Введите отчество" />
            <FormError message={errors.middleName?.message} />
          </div>
          <div className="sm:col-span-2">
            <label className="mezon-form-label">Дата рождения</label>
            <Input type="date" {...register('birthDate')} />
            <FormError message={errors.birthDate?.message} />
          </div>
        </div>
      </ModalSection>

      <ModalSection
        title="Кадровые параметры"
        description="Должность и ставка влияют на справочники, подбор ролей и внутренние HR-отчёты."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mezon-form-label">Должность *</label>
            <Input {...register('position')} placeholder="Например: Учитель" />
            <FormError message={errors.position?.message} />
          </div>
          <div>
            <label className="mezon-form-label">Ставка *</label>
            <Input type="number" step="0.1" {...register('rate')} placeholder="1.0" />
            <FormError message={errors.rate?.message} />
          </div>
        </div>
      </ModalSection>

      <ModalSection
        title="Трудовой цикл"
        description="Укажите дату приёма, чтобы запись сразу корректно участвовала в кадровых отчётах и напоминаниях."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mezon-form-label">Дата приёма *</label>
            <Input type="date" {...register('hireDate')} />
            <FormError message={errors.hireDate?.message} />
          </div>
          <div>
            <label className="mezon-form-label">№ Приказа о приёме</label>
            <Input {...register('hireOrderNumber')} />
          </div>
          <div>
            <label className="mezon-form-label">Дата приказа о приёме</label>
            <Input type="date" {...register('hireOrderDate')} />
          </div>
          <div>
            <label className="mezon-form-label">№ Приказа об увольнении</label>
            <Input {...register('fireOrderNumber')} />
          </div>
          <div>
            <label className="mezon-form-label">Дата приказа об увольнении</label>
            <Input type="date" {...register('fireOrderDate')} />
          </div>
          <div className="sm:col-span-2 rounded-[18px] border border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.78)] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tint-blue text-macos-blue">
                {initialData ? <BriefcaseBusiness className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-[13px] font-semibold tracking-[-0.01em] text-primary">
                  {initialData ? 'Обновление карточки сотрудника' : 'Новая кадровая запись'}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-secondary">
                  {initialData
                    ? 'Проверьте должность и дату приёма перед сохранением, чтобы не исказить кадровую историю.'
                    : 'После создания запись станет доступна в сотрудниках, пользователях и кадровых напоминаниях.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ModalSection>

      <ModalSection
        title="Договоры"
        description="Управление трудовыми и прочими договорами сотрудника."
      >
        <div className="space-y-4">
          {contractFields.map((field: any, index: number) => (
            <div key={field.id} className="relative rounded-[18px] border border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.82)] p-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 text-macos-red h-7 w-7 p-0"
                onClick={() => removeContract(index)}
              >
                ✕
              </Button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mezon-form-label">Тип договора</label>
                  <select className="mezon-field" {...register(`contracts.${index}.type`)}>
                    <option value="MAIN">Основной (ТД)</option>
                    <option value="PART_TIME">По совместительству</option>
                    <option value="CONTRACTOR">ГПХ</option>
                  </select>
                </div>
                <div>
                  <label className="mezon-form-label">Номер договора *</label>
                  <Input {...register(`contracts.${index}.number`)} />
                </div>
                <div>
                  <label className="mezon-form-label">Дата договора *</label>
                  <Input type="date" {...register(`contracts.${index}.date`)} />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input type="checkbox" id={`emp-active-${index}`} {...register(`contracts.${index}.isActive`)} />
                  <label htmlFor={`emp-active-${index}`} className="text-sm">Действующий</label>
                </div>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendContract({ type: 'MAIN', number: '', date: '', isActive: true })}
          >
            Добавить договор
          </Button>
        </div>
      </ModalSection>

      <ModalNotice title="Проверка перед сохранением" tone="info">
        Убедитесь, что имя, должность и дата приёма совпадают с кадровыми документами. Это уменьшает количество правок в связанных разделах.
      </ModalNotice>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4" />
          {isSubmitting ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>
    </form>
  );
}
