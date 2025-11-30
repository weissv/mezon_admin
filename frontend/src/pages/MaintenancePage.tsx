// src/pages/MaintenancePage.tsx
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
import { DataTable, Column } from '../components/DataTable/DataTable';
import { Trash2, AlertCircle, Edit } from 'lucide-react';

// Схема на основе createMaintenanceSchema
const maintenanceFormSchema = z.object({
  title: z.string().min(3, 'Тема заявки обязательна'),
  description: z.string().optional(),
  type: z.enum(['REPAIR', 'PURCHASE']),
  status: z.enum(['NEW', 'IN_PROGRESS', 'DONE']).optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceFormSchema>;

type MaintenanceRequest = {
  id: number;
  title: string;
  description?: string;
  type: 'REPAIR' | 'PURCHASE';
  status: 'NEW' | 'IN_PROGRESS' | 'DONE';
  createdAt: string;
  requester?: { id: number; firstName: string; lastName: string };
};

const statusMapping: Record<string, string> = {
  NEW: 'Новая',
  IN_PROGRESS: 'В работе',
  DONE: 'Выполнено',
};

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  DONE: 'bg-green-100 text-green-800',
};

const typeMapping: Record<string, string> = {
  REPAIR: 'Ремонт',
  PURCHASE: 'Закупка',
};

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<MaintenanceRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      type: 'REPAIR',
      status: 'NEW',
    },
  });

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/maintenance');
      setRequests(response || []);
    } catch (error) {
      console.error('Failed to fetch maintenance requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCreate = () => {
    setEditingRequest(null);
    reset({ title: '', description: '', type: 'REPAIR', status: 'NEW' });
    setIsModalOpen(true);
  };

  const handleEdit = (request: MaintenanceRequest) => {
    setEditingRequest(request);
    reset({
      title: request.title,
      description: request.description || '',
      type: request.type,
      status: request.status,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: MaintenanceFormData) => {
    try {
      if (editingRequest) {
        await api.put(`/api/maintenance/${editingRequest.id}`, data);
        toast.success('Заявка обновлена');
      } else {
        await api.post('/api/maintenance', data);
        toast.success('Заявка создана');
      }
      setIsModalOpen(false);
      fetchRequests();
      reset();
    } catch (error: any) {
      toast.error('Ошибка сохранения', { description: error?.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/maintenance/${deleteConfirm.id}`);
      toast.success('Заявка удалена');
      setDeleteConfirm(null);
      fetchRequests();
    } catch (error: any) {
      toast.error('Ошибка удаления', { description: error?.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<MaintenanceRequest>[] = [
    { key: 'title', header: 'Тема' },
    {
      key: 'requester',
      header: 'Заявитель',
      render: (row) => row.requester ? `${row.requester.lastName} ${row.requester.firstName}` : '—',
    },
    {
      key: 'type',
      header: 'Тип',
      render: (row) => typeMapping[row.type] || row.type,
    },
    {
      key: 'status',
      header: 'Статус',
      render: (row) => (
        <span className={`px-2 py-1 rounded text-sm ${statusColors[row.status]}`}>
          {statusMapping[row.status] || row.status}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Дата создания',
      render: (row) => new Date(row.createdAt).toLocaleDateString('ru-RU'),
    },
    {
      key: 'actions',
      header: 'Действия',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(row)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Хозяйственные заявки</h1>
        <Button onClick={handleCreate}>Создать заявку</Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-4 text-center">Загрузка...</div>
        ) : (
          <DataTable columns={columns} data={requests} page={1} pageSize={requests.length} total={requests.length} onPageChange={() => {}} />
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRequest ? 'Редактировать заявку' : 'Новая заявка'}>
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          <div>
            <label htmlFor="title" className="block mb-1 font-medium">Тема</label>
            <Input {...register('title')} id="title" placeholder="Кратко опишите проблему" />
            {errors.title && <FormError message={errors.title.message} />}
          </div>

          <div>
            <label htmlFor="description" className="block mb-1 font-medium">Описание</label>
            <textarea {...register('description')} id="description" className="w-full p-2 border rounded" rows={3} placeholder="Подробности..." />
          </div>

          <div>
            <label htmlFor="type" className="block mb-1 font-medium">Тип заявки</label>
            <select {...register('type')} id="type" className="w-full p-2 border rounded">
              <option value="REPAIR">Ремонт</option>
              <option value="PURCHASE">Закупка</option>
            </select>
            {errors.type && <FormError message={errors.type.message} />}
          </div>

          {editingRequest && (
            <div>
              <label htmlFor="status" className="block mb-1 font-medium">Статус</label>
              <select {...register('status')} id="status" className="w-full p-2 border rounded">
                <option value="NEW">Новая</option>
                <option value="IN_PROGRESS">В работе</option>
                <option value="DONE">Выполнено</option>
              </select>
              {errors.status && <FormError message={errors.status.message} />}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Отмена</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Сохранение...' : 'Сохранить'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Удаление заявки">
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Вы уверены, что хотите удалить эту заявку?</p>
              <p className="text-sm text-gray-600 mt-1">
                <strong>{deleteConfirm?.title}</strong>
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
