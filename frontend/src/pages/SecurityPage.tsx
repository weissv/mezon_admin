// src/pages/SecurityPage.tsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../lib/api';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { FormError } from '../components/ui/FormError';
import { DataTable } from '../components/DataTable/DataTable';

// Схема на основе createSecurityLogSchema
const securityLogFormSchema = z.object({
  eventType: z.string().min(2, 'Тип происшествия обязателен'),
  description: z.string().optional(),
  date: z.string(), // Будет преобразована в ISO
  documentUrl: z.string().url('Некорректный URL').optional().or(z.literal('')),
});

type SecurityLogFormData = z.infer<typeof securityLogFormSchema>;

export default function SecurityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SecurityLogFormData>({
    resolver: zodResolver(securityLogFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/security');
      setLogs(response || []);
    } catch (error) {
      console.error('Failed to fetch security logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const onSubmit = async (data: SecurityLogFormData) => {
    try {
      const payload = {
        ...data,
        date: new Date(data.date).toISOString(),
        documentUrl: data.documentUrl || null,
      };
      await api.post('/api/security', payload);
      setIsModalOpen(false);
      fetchLogs(); // Обновляем список
      reset({ date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      console.error('Failed to create log:', error);
    }
  };

  const columns = [
    {
      key: 'eventType',
      header: 'Тип происшествия',
    },
    {
      key: 'description',
      header: 'Описание',
    },
    {
      key: 'date',
      header: 'Дата',
      render: (row: any) => new Date(row.date).toLocaleString(),
    },
    {
      key: 'documentUrl',
      header: 'Документ',
      render: (row: any) => row.documentUrl ? (
        <a href={row.documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
          Ссылка
        </a>
      ) : 'Нет',
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Журнал происшествий</h1>
        <Button onClick={() => setIsModalOpen(true)}>Зафиксировать происшествие</Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-4 text-center">Загрузка...</div>
        ) : (
          <DataTable columns={columns} data={logs} page={1} pageSize={logs.length} total={logs.length} onPageChange={() => {}} />
        )}
      </Card>

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Добавить запись">
          <form onSubmit={handleSubmit(onSubmit)} className="p-4">
            <h2 className="text-xl font-bold mb-4">Новая запись</h2>
            
            <div className="mb-4">
              <label htmlFor="date" className="block mb-1">Дата и время</label>
              <Input type="datetime-local" {...register('date')} id="date" />
              {errors.date && <FormError message={errors.date.message} />}
            </div>

            <div className="mb-4">
              <label htmlFor="eventType" className="block mb-1">Тип происшествия</label>
              <Input {...register('eventType')} id="eventType" />
              {errors.eventType && <FormError message={errors.eventType.message} />}
            </div>

            <div className="mb-4">
              <label htmlFor="description" className="block mb-1">Описание</label>
              <textarea {...register('description')} id="description" className="w-full p-2 border rounded" />
            </div>

            <div className="mb-4">
              <label htmlFor="documentUrl" className="block mb-1">Ссылка на документ (необязательно)</label>
              <Input {...register('documentUrl')} id="documentUrl" placeholder="https://example.com/doc.pdf" />
              {errors.documentUrl && <FormError message={errors.documentUrl.message} />}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Отмена</Button>
              <Button type="submit">Сохранить</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
