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
  lastName: z.string().min(1, 'Фамилия обязательна'),
  firstName: z.string().min(1, 'Имя обязательно'),
  middleName: z.string().optional(),
  birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Неверная дата'),
  groupId: z.coerce.number().positive('Выберите класс'),
  address: z.string().optional(),
  nationality: z.string().optional(),
  gender: z.string().optional(),
  birthCertificateNumber: z.string().optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  parentPhone: z.string().optional(),
  contractNumber: z.string().optional(),
  contractDate: z.string().optional(),
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
      lastName: initialData?.lastName || '',
      firstName: initialData?.firstName || '',
      middleName: initialData?.middleName || '',
      birthDate: initialData ? new Date(initialData.birthDate).toISOString().split('T')[0] : '',
      groupId: initialData?.group?.id || undefined,
      address: initialData?.address || '',
      nationality: initialData?.nationality || '',
      gender: initialData?.gender || '',
      birthCertificateNumber: initialData?.birthCertificateNumber || '',
      fatherName: initialData?.fatherName || '',
      motherName: initialData?.motherName || '',
      parentPhone: initialData?.parentPhone || '',
      contractNumber: initialData?.contractNumber || '',
      contractDate: initialData?.contractDate ? new Date(initialData.contractDate).toISOString().split('T')[0] : '',
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
        contractDate: data.contractDate ? new Date(data.contractDate).toISOString() : undefined,
        middleName: data.middleName || undefined,
        address: data.address || undefined,
        nationality: data.nationality || undefined,
        gender: data.gender || undefined,
        birthCertificateNumber: data.birthCertificateNumber || undefined,
        fatherName: data.fatherName || undefined,
        motherName: data.motherName || undefined,
        parentPhone: data.parentPhone || undefined,
        contractNumber: data.contractNumber || undefined,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label>Фамилия *</label>
          <Input {...register('lastName')} />
          <FormError message={errors.lastName?.message} />
        </div>
        <div>
          <label>Имя *</label>
          <Input {...register('firstName')} />
          <FormError message={errors.firstName?.message} />
        </div>
        <div>
          <label>Отчество</label>
          <Input {...register('middleName')} />
          <FormError message={errors.middleName?.message} />
        </div>
        <div>
          <label>Класс *</label>
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
          <label>Дата рождения *</label>
          <Input type="date" {...register('birthDate')} />
          <FormError message={errors.birthDate?.message} />
        </div>
        <div>
          <label>Пол</label>
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            {...register('gender')}
          >
            <option value="">Не указан</option>
            <option value="мужской">Мужской</option>
            <option value="женский">Женский</option>
          </select>
          <FormError message={errors.gender?.message} />
        </div>
        <div>
          <label>Национальность</label>
          <Input {...register('nationality')} placeholder="узбек, русский и т.д." />
          <FormError message={errors.nationality?.message} />
        </div>
        <div>
          <label>Номер метрики</label>
          <Input {...register('birthCertificateNumber')} placeholder="I-TN № 0000000" />
          <FormError message={errors.birthCertificateNumber?.message} />
        </div>
      </div>

      <div>
        <label>Адрес проживания</label>
        <Input {...register('address')} placeholder="Район, улица, дом, квартира" />
        <FormError message={errors.address?.message} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label>ФИО отца</label>
          <Input {...register('fatherName')} />
          <FormError message={errors.fatherName?.message} />
        </div>
        <div>
          <label>ФИО матери</label>
          <Input {...register('motherName')} />
          <FormError message={errors.motherName?.message} />
        </div>
        <div>
          <label>Телефоны родителей</label>
          <Input {...register('parentPhone')} placeholder="90 000 00 00" />
          <FormError message={errors.parentPhone?.message} />
        </div>
        <div>
          <label>№ Договора</label>
          <Input {...register('contractNumber')} />
          <FormError message={errors.contractNumber?.message} />
        </div>
        <div>
          <label>Дата договора</label>
          <Input type="date" {...register('contractDate')} />
          <FormError message={errors.contractDate?.message} />
        </div>
      </div>

      <div>
        <label>Мед. сведения (опционально)</label>
        <textarea
          className="w-full rounded-md border border-gray-300 px-3 py-2"
          rows={2}
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
