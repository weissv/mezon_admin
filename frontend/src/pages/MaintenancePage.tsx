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
import { Trash2, AlertCircle, Edit, Plus, Wrench, ShoppingCart, ClipboardList, Filter } from 'lucide-react';

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

const typeColors: Record<string, string> = {
  REPAIR: 'bg-orange-100 text-orange-800',
  PURCHASE: 'bg-purple-100 text-purple-800',
};

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<MaintenanceRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');

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

  // Фильтрация
  const filteredRequests = requests.filter(req => {
    if (filterStatus && req.status !== filterStatus) return false;
    if (filterType && req.type !== filterType) return false;
    return true;
  });

  // Статистика
  const stats = {
    total: requests.length,
    new: requests.filter(r => r.status === 'NEW').length,
    inProgress: requests.filter(r => r.status === 'IN_PROGRESS').length,
    done: requests.filter(r => r.status === 'DONE').length,
    repair: requests.filter(r => r.type === 'REPAIR').length,
    purchase: requests.filter(r => r.type === 'PURCHASE').length,
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
      render: (row) => (
        <span className={`px-2 py-1 rounded text-sm ${typeColors[row.type]}`}>
          {typeMapping[row.type] || row.type}
        </span>
      ),
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          Хозяйственные заявки
        </h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Создать заявку
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div 
          className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${filterStatus === '' && filterType === '' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => { setFilterStatus(''); setFilterType(''); }}
        >
          <p className="text-sm text-gray-500">Всего</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div 
          className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${filterStatus === 'NEW' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => { setFilterStatus(filterStatus === 'NEW' ? '' : 'NEW'); setFilterType(''); }}
        >
          <p className="text-sm text-gray-500">Новые</p>
          <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
        </div>
        <div 
          className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${filterStatus === 'IN_PROGRESS' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => { setFilterStatus(filterStatus === 'IN_PROGRESS' ? '' : 'IN_PROGRESS'); setFilterType(''); }}
        >
          <p className="text-sm text-gray-500">В работе</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
        </div>
        <div 
          className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${filterStatus === 'DONE' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => { setFilterStatus(filterStatus === 'DONE' ? '' : 'DONE'); setFilterType(''); }}
        >
          <p className="text-sm text-gray-500">Выполнено</p>
          <p className="text-2xl font-bold text-green-600">{stats.done}</p>
        </div>
        <div 
          className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${filterType === 'REPAIR' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => { setFilterType(filterType === 'REPAIR' ? '' : 'REPAIR'); setFilterStatus(''); }}
        >
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-orange-600" />
            <p className="text-sm text-gray-500">Ремонт</p>
          </div>
          <p className="text-2xl font-bold">{stats.repair}</p>
        </div>
        <div 
          className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${filterType === 'PURCHASE' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => { setFilterType(filterType === 'PURCHASE' ? '' : 'PURCHASE'); setFilterStatus(''); }}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-purple-600" />
            <p className="text-sm text-gray-500">Закупка</p>
          </div>
          <p className="text-2xl font-bold">{stats.purchase}</p>
        </div>
      </div>

      {/* Активный фильтр */}
      {(filterStatus || filterType) && (
        <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded-lg">
          <Filter className="h-4 w-4" />
          <span>
            Фильтр: {filterStatus && statusMapping[filterStatus]} {filterType && typeMapping[filterType]}
          </span>
          <button 
            onClick={() => { setFilterStatus(''); setFilterType(''); }} 
            className="ml-2 underline hover:no-underline"
          >
            Сбросить
          </button>
        </div>
      )}

      <Card>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Загрузка...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {filterStatus || filterType ? 'Нет заявок по выбранному фильтру' : 'Нет заявок. Создайте первую заявку.'}
          </div>
        ) : (
          <DataTable columns={columns} data={filteredRequests} page={1} pageSize={filteredRequests.length} total={filteredRequests.length} onPageChange={() => {}} />
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
              {deleteConfirm && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                  <p><strong>Тема:</strong> {deleteConfirm.title}</p>
                  <p><strong>Тип:</strong> {typeMapping[deleteConfirm.type]}</p>
                  <p><strong>Статус:</strong> {statusMapping[deleteConfirm.status]}</p>
                  {deleteConfirm.description && <p><strong>Описание:</strong> {deleteConfirm.description}</p>}
                </div>
              )}
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
