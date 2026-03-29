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
      await login(data.login, data.password);
      toast.success('Вход выполнен успешно');
      navigate('/');
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
    <div className="relative mx-auto flex min-h-[85vh] max-w-5xl flex-col justify-center px-6">
      <div className="relative grid gap-10 rounded-[18px] bg-white/78 backdrop-blur-[40px] saturate-[1.8] border border-white/50 shadow-[0_24px_80px_rgba(0,0,0,0.10),0_0_0_0.5px_rgba(0,0,0,0.06)] p-10 lg:grid-cols-2">
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-[18px] pointer-events-none overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-white/30 to-transparent" />
        </div>

        {/* Left — Brand */}
        <div className="relative flex flex-col justify-between">
          <div>
            <span className="mezon-badge">Mezon // inspired.School</span>
            <h1 className="mt-4 text-[28px] lg:text-[34px] font-bold tracking-[-0.03em] text-[#1D1D1F] leading-tight">
              Управляйте школой{' '}
              <span className="bg-gradient-to-r from-[#007AFF] to-[#AF52DE] bg-clip-text text-transparent">
                в стиле Mezon
              </span>
            </h1>
            <p className="mt-3 text-[15px] text-[#86868B] max-w-md leading-relaxed">
              Админ-панель с эстетикой macOS: прозрачные панели, чистая типографика и внимание к каждой детали.
            </p>
          </div>
          <ul className="mt-8 space-y-3">
            {sellingPoints.map((point) => (
              <li key={point} className="flex items-center gap-3 text-[#1D1D1F]">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] bg-[rgba(0,122,255,0.08)] text-[#007AFF]">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                <span className="text-[14px] font-medium tracking-[-0.01em]">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — Login form */}
        <div className="relative rounded-[14px] bg-white/82 backdrop-blur-sm border border-[rgba(0,0,0,0.06)] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6">
          <div className="mb-6 text-center">
            <p className="text-[11px] uppercase tracking-[0.06em] font-semibold text-[#86868B]">Вход в ERP</p>
            <p className="text-[20px] font-semibold text-[#1D1D1F] tracking-[-0.02em] mt-1">Авторизация</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
            <div>
              <label className="text-[12px] font-medium text-[#6E6E73] mb-1.5 block" htmlFor="login">
                Логин
              </label>
              <Input id="login" type="text" autoComplete="off" {...register('login')} />
              <FormError message={errors.login?.message} />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#6E6E73] mb-1.5 block" htmlFor="password">
                Пароль
              </label>
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
