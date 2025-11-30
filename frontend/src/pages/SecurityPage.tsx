// src/pages/SecurityPage.tsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { FormError } from '../components/ui/FormError';
import { DataTable } from '../components/DataTable/DataTable';
import { Trash2, AlertCircle } from 'lucide-react';

const eventTypeLabels: Record<string, string> = {
  INCIDENT: 'Происшествие',
  FIRE_CHECK: 'Проверка ПБ',
  VISITOR_LOG: 'Учёт посетителей',
  DOCUMENT: 'Документ по охране',
};

// Схема на основе createSecurityLogSchema
const securityLogFormSchema = z.object({
  eventType: z.enum(['INCIDENT', 'FIRE_CHECK', 'VISITOR_LOG', 'DOCUMENT']),
  description: z.string().optional(),
  date: z.string(),
  documentUrl: z.string().url('Некорректный URL').optional().or(z.literal('')),
});

type SecurityLogFormData = z.infer<typeof securityLogFormSchema>;
type SecurityLog = { id: number; eventType: string; description?: string; date: string; documentUrl?: string };

export default function SecurityPage() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<SecurityLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SecurityLogFormData>({
    resolver: zodResolver(securityLogFormSchema),
    defaultValues: {
      eventType: 'INCIDENT',
      date: new Date().toISOString().slice(0, 16),
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
      toast.success('Запись добавлена');
      setIsModalOpen(false);
      fetchLogs();
      reset({ eventType: 'INCIDENT', date: new Date().toISOString().slice(0, 16) });
    } catch (error: any) {
      toast.error('Ошибка сохранения', { description: error?.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/security/${deleteConfirm.id}`);
      toast.success('Запись удалена');
      setDeleteConfirm(null);
      fetchLogs();
    } catch (error: any) {
      toast.error('Ошибка удаления', { description: error?.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'eventType',
      header: 'Тип',
      render: (row: SecurityLog) => eventTypeLabels[row.eventType] || row.eventType,
    },
    {
      key: 'description',
      header: 'Описание',
    },
    {
      key: 'date',
      header: 'Дата',
      render: (row: SecurityLog) => new Date(row.date).toLocaleString('ru-RU'),
    },
    {
      key: 'documentUrl',
      header: 'Документ',
      render: (row: SecurityLog) => row.documentUrl ? (
        <a href={row.documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
          Ссылка
        </a>
      ) : '—',
    },
    {
      key: 'actions',
      header: 'Действия',
      render: (row: SecurityLog) => (
        <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(row)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
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

      {/* Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Новая запись">
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          <div>
            <label htmlFor="date" className="block mb-1 font-medium">Дата и время</label>
            <Input type="datetime-local" {...register('date')} id="date" />
            {errors.date && <FormError message={errors.date.message} />}
          </div>

          <div>
            <label htmlFor="eventType" className="block mb-1 font-medium">Тип события</label>
            <select {...register('eventType')} id="eventType" className="w-full p-2 border rounded">
              <option value="INCIDENT">Происшествие</option>
              <option value="FIRE_CHECK">Проверка пожарной безопасности</option>
              <option value="VISITOR_LOG">Учёт посетителей</option>
              <option value="DOCUMENT">Документ по охране труда</option>
            </select>
            {errors.eventType && <FormError message={errors.eventType.message} />}
          </div>

          <div>
            <label htmlFor="description" className="block mb-1 font-medium">Описание</label>
            <textarea {...register('description')} id="description" className="w-full p-2 border rounded" rows={3} />
          </div>

          <div>
            <label htmlFor="documentUrl" className="block mb-1 font-medium">Ссылка на документ (необязательно)</label>
            <Input {...register('documentUrl')} id="documentUrl" placeholder="https://example.com/doc.pdf" />
            {errors.documentUrl && <FormError message={errors.documentUrl.message} />}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Отмена</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Сохранение...' : 'Сохранить'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Удаление записи">
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Вы уверены, что хотите удалить эту запись?</p>
              <p className="text-sm text-gray-600 mt-1">
                <strong>{deleteConfirm && eventTypeLabels[deleteConfirm.eventType]}</strong> от {deleteConfirm && new Date(deleteConfirm.date).toLocaleDateString('ru-RU')}
              </p>
              <p className="text-sm text-red-600 mt-2">Это действие нельзя отменить!</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>Отмена</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
