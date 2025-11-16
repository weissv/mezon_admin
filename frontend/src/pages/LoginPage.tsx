import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { FormError } from '../components/ui/FormError';

const loginSchema = z.object({
  login: z.string().min(1, 'Логин обязателен'),
  password: z.string().min(1, 'Пароль обязателен'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Передаём первое поле как login — бэкенд принимает login или email
      await login(data.login, data.password);
      toast.success('Вход выполнен успешно');
      navigate('/'); // Перенаправляем пользователя на главную
    } catch (error: any) {
      const msg = error?.message || 'Неверные учетные данные';
      toast.error('Ошибка входа', { description: msg });
    }
  };

  const sellingPoints = [
    'Цифровые дашборды и аналитика',
    'Контуры питания и закупок',
    'Документооборот и уведомления',
  ];

  return (
    <div className="relative mx-auto flex min-h-[85vh] max-w-6xl flex-col justify-center px-6">
      <div className="absolute inset-x-4 inset-y-8 -z-10 rounded-[48px] bg-white/40 blur-3xl" />
      <div className="relative grid gap-10 rounded-[40px] bg-white/90 p-10 shadow-mezon lg:grid-cols-2">
        <div className="flex flex-col justify-between">
          <div>
            <span className="mezon-badge">Mezon // inspired.School</span>
            <h1 className="mezon-section-title text-4xl lg:text-5xl">
              Управляйте школой <span>в стиле Mezon</span>
            </h1>
            <p className="mezon-subtitle text-lg">
              Админ-панель повторяет эстетику маркетингового сайта: нежные переходы, акценты цвета фуксии и чувство заботы.
            </p>
          </div>
          <ul className="mt-8 space-y-4">
            {sellingPoints.map((point) => (
              <li key={point} className="flex items-center gap-3 text-[var(--mezon-dark)]">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(160,74,132,0.12)] text-[var(--mezon-accent)]">
                  <Check className="h-4 w-4" />
                </span>
                <span className="font-medium">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mezon-card shadow-mezon">
          <div className="mb-6 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-[var(--mezon-text-soft)]">Вход в ERP</p>
            <p className="text-2xl font-semibold text-[var(--mezon-dark)]">Авторизация</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
            <div>
              <label className="text-sm font-semibold text-[var(--mezon-dark)]" htmlFor="login">Логин</label>
              <Input id="login" type="text" autoComplete="off" {...register('login')} />
              <FormError message={errors.login?.message} />
            </div>
            <div>
              <label className="text-sm font-semibold text-[var(--mezon-dark)]" htmlFor="password">Пароль</label>
              <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
              <FormError message={errors.password?.message} />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Входим...' : 'Войти'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}