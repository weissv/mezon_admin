// src/pages/MaintenancePage.tsx
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
import { DataTable, Column } from '../components/DataTable/DataTable'; // Предполагаем, что DataTable готов к использованию

// Схема на основе createMaintenanceSchema
const maintenanceFormSchema = z.object({
  title: z.string().min(3, 'Тема заявки обязательна'),
  description: z.string().optional(),
  type: z.enum(['REPAIR', 'PURCHASE']),
});

type MaintenanceFormData = z.infer<typeof maintenanceFormSchema>;

const statusMapping = {
  NEW: 'Новая',
  IN_PROGRESS: 'В работе',
  DONE: 'Выполнено',
};

const typeMapping = {
  REPAIR: 'Ремонт',
  PURCHASE: 'Закупка',
};

export default function MaintenancePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      type: 'REPAIR',
    },
  });

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/maintenance');
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch maintenance requests:', error);
      alert('Не удалось загрузить заявки.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const onSubmit = async (data: MaintenanceFormData) => {
    try {
      await api.post('/maintenance', data);
      setIsModalOpen(false);
      fetchRequests(); // Обновляем список
      reset();
    } catch (error) {
      console.error('Failed to create request:', error);
      alert('Не удалось создать заявку.');
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Тема',
    },
    {
      key: 'requester',
      header: 'Заявитель',
      render: (row: any) => `${row.requester?.lastName || ''} ${row.requester?.firstName || ''}`
    },
    {
      key: 'type',
      header: 'Тип',
      render: (row: any) => typeMapping[row.type as keyof typeof typeMapping] || row.type,
    },
    {
      key: 'status',
      header: 'Статус',
      render: (row: any) => statusMapping[row.status as keyof typeof statusMapping] || row.status,
    },
    {
      key: 'createdAt',
      header: 'Дата создания',
      render: (row: any) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Хозяйственные заявки</h1>
        <Button onClick={() => setIsModalOpen(true)}>Создать заявку</Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-4 text-center">Загрузка...</div>
        ) : (
          <DataTable columns={columns} data={requests} page={1} pageSize={requests.length} total={requests.length} onPageChange={() => {}} />
        )}
      </Card>

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Новая заявка">
          <form onSubmit={handleSubmit(onSubmit)} className="p-4">
            <div className="mb-4">
              <label htmlFor="title" className="block mb-1">Тема</label>
              <Input {...register('title')} id="title" />
              {errors.title && <FormError message={errors.title.message} />}
            </div>

            <div className="mb-4">
              <label htmlFor="description" className="block mb-1">Описание</label>
              <textarea {...register('description')} id="description" className="w-full p-2 border rounded" />
            </div>

            <div className="mb-4">
              <label htmlFor="type" className="block mb-1">Тип заявки</label>
              <select {...register('type')} id="type" className="w-full p-2 border rounded">
                <option value="REPAIR">Ремонт</option>
                <option value="PURCHASE">Закупка</option>
              </select>
              {errors.type && <FormError message={errors.type.message} />}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Отмена</Button>
              <Button type="submit">Отправить</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
