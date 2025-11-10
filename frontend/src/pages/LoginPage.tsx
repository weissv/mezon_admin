import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom'; // <-- 1. ИМПОРТИРУЕМ useNavigate
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
  const navigate = useNavigate(); // <-- 2. ИНИЦИАЛИЗИРУЕМ ЕГО
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Вход в систему</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
          <div>
            <label htmlFor="login">Логин</label>
            <Input 
              id="login" 
              type="text" 
              autoComplete="off"
              {...register('login')} 
            />
            <FormError message={errors.login?.message} />
          </div>
          <div>
            <label htmlFor="password">Пароль</label>
            <Input 
              id="password" 
              type="password" 
              autoComplete="new-password"
              {...register('password')} 
            />
            <FormError message={errors.password?.message} />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Вход...' : 'Войти'}
          </Button>
        </form>
      </div>
    </div>
  );
}