import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, ExternalLink, LockKeyhole, MessageCircle, Shield, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { AvailableEmployee, UpdateUserPayload, User } from '../../types/user';
import { ModalNotice, ModalSection } from '../Modal';
import { Button } from '../ui/button';
import { FormError } from '../ui/FormError';
import { Input } from '../ui/input';

// Имя бота для Telegram Deep Link (из Vite env переменных)
const TELEGRAM_BOT_NAME = import.meta.env.VITE_TELEGRAM_BOT_NAME || 'mezon_erpbot';

const ROLES = [
 { value: 'DEVELOPER', label: 'Разработчик'},
 { value: 'DIRECTOR', label: 'Директор'},
 { value: 'DEPUTY', label: 'Завуч'},
 { value: 'ADMIN', label: 'Администратор'},
 { value: 'TEACHER', label: 'Учитель'},
 { value: 'ACCOUNTANT', label: 'Бухгалтер'},
 { value: 'ZAVHOZ', label: 'Завхоз'},
] as const;

const createUserSchema = z.object({
 email: z.string().min(3, 'Логин обязателен (минимум 3 символа)'),
 password: z.string().min(8, 'Пароль должен быть минимум 8 символов'),
 role: z.enum(['DEVELOPER', 'DIRECTOR', 'DEPUTY', 'ADMIN', 'TEACHER', 'ACCOUNTANT', 'ZAVHOZ']),
 employeeId: z.coerce.number().positive('Выберите сотрудника'),
});

const updateUserSchema = z.object({
 email: z.string().min(3, 'Логин обязателен (минимум 3 символа)').optional(),
 password: z.string().min(8, 'Пароль должен быть минимум 8 символов').optional().or(z.literal('')),
 role: z.enum(['DEVELOPER', 'DIRECTOR', 'DEPUTY', 'ADMIN', 'TEACHER', 'ACCOUNTANT', 'ZAVHOZ']).optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;
type UpdateUserFormData = z.infer<typeof updateUserSchema>;

type UserFormProps = {
  initialData?: User | null;
  onSuccess: () => void;
  onCancel: () => void;
};

export function UserForm({ initialData, onSuccess, onCancel }: UserFormProps) {
  const isEditing = !!initialData;
  const [showPassword, setShowPassword] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<AvailableEmployee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const selectClassName = 'mezon-field';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormData | UpdateUserFormData>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: isEditing
      ? {
          email: initialData.email,
          password: '',
          role: initialData.role,
        }
      : {
          email: '',
          password: '',
          role: 'TEACHER',
          employeeId: undefined,
        },
  });

  useEffect(() => {
    if (!isEditing) {
      loadAvailableEmployees();
    }
  }, [isEditing]);

  const loadAvailableEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const employees = await api.get('/api/users/employees/available');
      setAvailableEmployees(employees);
    } catch {
      toast.error('Не удалось загрузить список сотрудников');
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const onSubmit = async (data: CreateUserFormData | UpdateUserFormData) => {
    try {
      if (isEditing) {
        const updatePayload: UpdateUserPayload = {};
        if (data.email) updatePayload.email = data.email;
        if (data.role) updatePayload.role = data.role;
        if (data.password && data.password.length > 0) updatePayload.password = data.password;

        await api.put(`/api/users/${initialData.id}`, updatePayload);
      } else {
        await api.post('/api/users', data);
      }
      onSuccess();
    } catch (error: any) {
      const msg = error?.message || 'Ошибка сохранения';
      toast.error('Ошибка', { description: msg });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mezon-modal-form">
      {!isEditing && !isLoadingEmployees && availableEmployees.length === 0 ? (
        <ModalNotice title="Некого привязать к учётной записи" tone="warning">
          Нет доступных сотрудников без аккаунта. Сначала создайте карточку сотрудника, а затем вернитесь к созданию пользователя.
        </ModalNotice>
      ) : null}

      <ModalSection
        title="Учётные данные"
        description="Логин и пароль используются для входа в систему, поэтому задайте их в понятном и поддерживаемом формате."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mezon-form-label">Логин</label>
            <Input {...register('email')} placeholder="Введите логин для входа" />
            <FormError message={errors.email?.message} />
          </div>
          <div className="sm:col-span-2">
            <label className="mezon-form-label">
              Пароль {isEditing ? <span className="text-secondary font-normal">(оставьте пустым, чтобы не менять)</span> : null}
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder={isEditing ? '••••••••' : 'Минимум 8 символов'}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <FormError message={errors.password?.message} />
          </div>
        </div>
      </ModalSection>

      <ModalSection
        title="Роль и доступ"
        description="Роль определяет набор доступных модулей и операций. Назначайте её осознанно, чтобы не расширять права без необходимости."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mezon-form-label">Роль</label>
            <select {...register('role')} className={selectClassName}>
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            <FormError message={errors.role?.message} />
          </div>
          <div className="rounded-[18px] border border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.78)] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tint-blue text-macos-blue">
                {isEditing ? <Shield className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-[13px] font-semibold tracking-[-0.01em] text-primary">
                  {isEditing ? 'Изменение доступа' : 'Создание новой учётной записи'}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-secondary">
                  {isEditing
                    ? 'При редактировании можно сменить логин, роль или обновить пароль без перевыпуска карточки сотрудника.'
                    : 'Новая учётная запись сразу попадёт в каталог пользователей и будет связана с выбранным сотрудником.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ModalSection>

      <ModalSection
        title={isEditing ? 'Привязка и уведомления' : 'Привязка к сотруднику'}
        description={
          isEditing
            ? 'Проверьте связанного сотрудника и при необходимости подключите Telegram для уведомлений.'
            : 'Учётная запись должна быть связана с сотрудником, чтобы роли, карточки и внутренние процессы оставались синхронизированными.'
        }
      >
        {!isEditing ? (
          <div>
            <label className="mezon-form-label">Сотрудник</label>
            {isLoadingEmployees ? (
              <div className="rounded-[18px] border border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.78)] p-4 text-sm text-secondary">
                Загружаем список сотрудников...
              </div>
            ) : availableEmployees.length === 0 ? (
              <div className="rounded-[18px] border border-[rgba(255,149,0,0.24)] bg-[rgba(255,149,0,0.08)] p-4 text-sm text-secondary">
                Нет доступных сотрудников без учётной записи. Сначала добавьте сотрудника в разделе «Сотрудники».
              </div>
            ) : (
              <select {...register('employeeId' as const)} className={selectClassName}>
                <option value="">Выберите сотрудника</option>
                {availableEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.lastName} {emp.firstName} — {emp.position}
                  </option>
                ))}
              </select>
            )}
            <FormError message={(errors as any).employeeId?.message} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="rounded-[18px] border border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.78)] p-4">
              <div className="mb-3 flex items-center gap-2">
                <UserRound className="h-4 w-4 text-macos-blue" />
                <p className="text-[13px] font-semibold tracking-[-0.01em] text-primary">Привязанный сотрудник</p>
              </div>
              <p className="text-sm text-secondary">
                {initialData?.employee
                  ? `${initialData.employee.lastName} ${initialData.employee.firstName} — ${initialData.employee.position}`
                  : 'Сотрудник не привязан'}
              </p>
            </div>

            <div className="rounded-[18px] border border-[rgba(10,132,255,0.18)] bg-[rgba(10,132,255,0.06)] p-4">
              <div className="mb-3 flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-macos-blue" />
                <p className="text-[13px] font-semibold tracking-[-0.01em] text-primary">Telegram уведомления</p>
              </div>
              {(initialData as User).telegramChatId ? (
                <p className="text-sm font-medium text-macos-green">Telegram уже подключён к этой учётной записи.</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-secondary">
                    Подключите Telegram, чтобы пользователь получал уведомления о заявках и рабочих событиях.
                  </p>
                  <a
                    href={`https://t.me/${TELEGRAM_BOT_NAME}?start=${initialData?.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md bg-macos-blue px-4 py-2 text-[11px] font-medium uppercase tracking-widest text-white macos-transition hover:bg-macos-blue-hover"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Подключить Telegram
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </ModalSection>

      <ModalNotice title="Проверка доступа" tone="info">
        Перед сохранением проверьте логин, роль и сотрудника. Эти поля влияют на доступ к модулям, уведомления и историю действий пользователя.
      </ModalNotice>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit" disabled={isSubmitting || (!isEditing && availableEmployees.length === 0)}>
          {isSubmitting ? 'Сохранение...' : isEditing ? 'Сохранить' : 'Создать'}
        </Button>
      </div>
    </form>
  );
}
