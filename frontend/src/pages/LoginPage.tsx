import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Check, ShieldCheck, Sparkles, Lock } from 'lucide-react';
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
    'Оперативные дашборды и реал-тайм аналитика',
    'Автоматизированные контуры питания и закупок',
    'Смарт-расписание, контрольные и LMS дневники',
  ];

  return (
    <div className="relative mx-auto flex min-h-[88vh] max-w-5xl flex-col justify-center px-4 py-8">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[radial-gradient(circle,rgba(0,122,255,0.08),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-0 right-10 w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(175,82,222,0.06),transparent_70%)] blur-3xl" />
      </div>

      <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">

        {/* Left — Brand Hero Panel */}
        <div className="relative flex flex-col justify-between p-8 lg:p-12 rounded-3xl bg-surface-primary/60 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-[0.04em] uppercase bg-tint-blue text-macos-blue border border-macos-blue/20 shadow-subtle">
              <Sparkles className="w-3.5 h-3.5" />
              Mezon ERP // Enterprise
            </div>

            <h1 className="mt-6 text-[30px] lg:text-[40px] font-bold tracking-[-0.035em] text-text-primary leading-[1.15]">
              Управляйте школой{' '}
              <span className="bg-gradient-to-r from-macos-blue via-[#5856D6] to-macos-purple bg-clip-text text-transparent">
                в стиле Mezon
              </span>
            </h1>

            <p className="mt-4 text-[15px] text-text-tertiary max-w-md leading-relaxed">
              Операционная экосистема с эстетикой macOS Sequoia: чистые слои, высокая плотность информации и безупречный UX.
            </p>
          </div>

          <div className="mt-10 space-y-3.5 border-t border-separator/40 pt-8">
            {sellingPoints.map((point) => (
              <div key={point} className="flex items-center gap-3.5 text-text-primary">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-tint-blue text-macos-blue border border-macos-blue/20 shadow-subtle">
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <span className="text-[14px] font-medium tracking-[-0.01em]">{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Login Form Card */}
        <div className="relative p-8 lg:p-10 rounded-3xl bg-surface-primary/90 backdrop-blur-2xl border border-black/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]">
          <div className="mb-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-tint-blue text-macos-blue flex items-center justify-center mb-3 shadow-[0_4px_16px_rgba(0,122,255,0.15)] border border-macos-blue/20">
              <Lock className="w-5 h-5" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.06em] font-bold text-text-tertiary">Школьный контур</p>
            <p className="text-[22px] font-bold text-text-primary tracking-[-0.025em] mt-1">Авторизация</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
            <div>
              <label className="text-[12px] font-semibold text-text-secondary mb-1.5 block tracking-[-0.01em]" htmlFor="login">
                Логин или E-mail
              </label>
              <Input
                id="login"
                type="text"
                autoComplete="off"
                placeholder="Введите ваш логин"
                className="h-11 px-4 text-[14px]"
                {...register('login')}
              />
              <FormError message={errors.login?.message} />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-text-secondary mb-1.5 block tracking-[-0.01em]" htmlFor="password">
                Пароль
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="h-11 px-4 text-[14px]"
                {...register('password')}
              />
              <FormError message={errors.password?.message} />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-[14px] font-semibold shadow-[0_4px_16px_rgba(0,122,255,0.3)] mt-2"
              size="lg"
              isLoading={isSubmitting}
            >
              {isSubmitting ? 'Выполняется вход...' : 'Войти в рабочее пространство'}
            </Button>
          </form>

          <div className="mt-6 text-center pt-4 border-t border-separator/40">
            <span className="inline-flex items-center gap-1.5 text-[12px] text-text-tertiary">
              <ShieldCheck className="w-4 h-4 text-macos-green inline" />
              Защищенное соединение · Mezon Guard
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

