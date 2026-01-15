// src/pages/MaintenancePage.tsx
import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { FormError } from '../components/ui/FormError';
import { InventoryAutocomplete } from '../components/ui/InventoryAutocomplete';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { Trash2, AlertCircle, Edit, Plus, Wrench, Package, ClipboardList, Filter, Sparkles, Settings, CheckCircle, Clock, Loader2, X, Check, PlusCircle, MinusCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
// Импортируем централизованные типы и схемы
import {
  MaintenanceRequest,
  MaintenanceFormData,
  createMaintenanceSchema,
  maintenanceStatusLabels,
  maintenanceStatusColors,
  maintenanceTypeLabels,
  maintenanceTypeColors,
  itemCategoryLabels,
  itemCategoryColors,
  ItemCategory,
} from '../types/maintenance';

// Дополнительные локальные типы для страницы
type CleaningSchedule = {
  id: number;
  area: string;
  frequency: string;
  assignedTo?: { id: number; firstName: string; lastName: string } | null;
  logs: { id: number; timestamp: string }[];
};

type Equipment = {
  id: number;
  name: string;
  location?: string | null;
  lastCheckup: string;
  nextCheckup: string;
};

type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
};

type TabType = 'requests' | 'cleaning' | 'equipment';

export default function MaintenancePage() {
  const { user } = useAuth();
  const userRole = user?.role || 'TEACHER';
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('requests');
  
  // Requests state
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<MaintenanceRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  
  // Модальное окно для одобрения/отклонения
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [actionRequest, setActionRequest] = useState<MaintenanceRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Cleaning state
  const [cleaningSchedules, setCleaningSchedules] = useState<CleaningSchedule[]>([]);
  const [cleaningLoading, setCleaningLoading] = useState(false);
  const [isCleaningModalOpen, setIsCleaningModalOpen] = useState(false);
  const [editingCleaning, setEditingCleaning] = useState<CleaningSchedule | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cleaningFormData, setCleaningFormData] = useState({ area: '', frequency: 'DAILY', assignedToId: '' });
  const [cleaningSubmitting, setCleaningSubmitting] = useState(false);

  // Equipment state
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [equipmentFormData, setEquipmentFormData] = useState({ name: '', location: '', nextCheckup: '' });
  const [equipmentSubmitting, setEquipmentSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(createMaintenanceSchema),
    defaultValues: {
      type: 'REPAIR',
      items: [],
    },
  });
  
  // useFieldArray для динамического управления позициями
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });
  
  // Отслеживаем тип заявки для условного отображения полей
  const watchType = watch('type');

  // Очищаем items при переключении на REPAIR, восстанавливаем при ISSUE
  useEffect(() => {
    if (watchType === 'REPAIR') {
      // Для типа REPAIR убираем все items
      while (fields.length > 0) {
        remove(0);
      }
    } else if (watchType === 'ISSUE' && fields.length === 0) {
      // Для типа ISSUE добавляем хотя бы одну позицию, если их нет
      append({ name: '', quantity: 1, unit: 'шт', category: 'STATIONERY' });
    }
  }, [watchType, fields.length, remove, append]);

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

  const fetchCleaningSchedules = async () => {
    setCleaningLoading(true);
    try {
      const response = await api.get('/api/maintenance/cleaning');
      setCleaningSchedules(response || []);
    } catch (error) {
      console.error('Failed to fetch cleaning schedules:', error);
    } finally {
      setCleaningLoading(false);
    }
  };

  const fetchEquipment = async () => {
    setEquipmentLoading(true);
    try {
      const response = await api.get('/api/maintenance/equipment');
      setEquipment(response || []);
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
    } finally {
      setEquipmentLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/api/employees');
      // Handle both array and {items, total} formats
      const employeesList = Array.isArray(response) 
        ? response 
        : (response?.items || response?.data || []);
      setEmployees(employeesList);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setEmployees([]);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (activeTab === 'cleaning' && cleaningSchedules.length === 0) {
      fetchCleaningSchedules();
      fetchEmployees();
    }
    if (activeTab === 'equipment' && equipment.length === 0) {
      fetchEquipment();
    }
  }, [activeTab]);

  const handleCreate = () => {
    setEditingRequest(null);
    reset({ 
      title: '', 
      description: '', 
      type: 'REPAIR', // По умолчанию ремонт
      items: [], // Пустой массив для REPAIR
    });
    setIsModalOpen(true);
  };

  const handleEdit = (request: MaintenanceRequest) => {
    setEditingRequest(request);
    reset({
      title: request.title,
      description: request.description || '',
      type: request.type,
      status: request.status, // Добавляем текущий статус
      items: request.items && request.items.length > 0 
        ? request.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            category: item.category,
          }))
        : [{ name: '', quantity: 1, unit: 'шт', category: 'STATIONERY' }],
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: MaintenanceFormData) => {
    try {
      // Для заявок типа REPAIR не отправляем items вообще
      const submitData: any = {
        title: data.title,
        description: data.description,
        type: data.type,
      };
      
      // Добавляем status только если он есть (для завхоза при редактировании)
      if (data.status) {
        submitData.status = data.status;
      }
      
      // Добавляем items только для типа ISSUE
      if (data.type === 'ISSUE' && data.items && data.items.length > 0) {
        submitData.items = data.items;
      }
      
      if (editingRequest) {
        await api.put(`/api/maintenance/${editingRequest.id}`, submitData);
        toast.success('Заявка обновлена');
      } else {
        // При создании заявки status устанавливается автоматически в PENDING
        await api.post('/api/maintenance', submitData);
        toast.success('Заявка создана');
      }
      setIsModalOpen(false);
      fetchRequests();
      reset();
    } catch (error: any) {
      console.error('Error submitting maintenance request:', error);
      toast.error('Ошибка сохранения', { description: error?.message || 'Произошла ошибка при сохранении заявки' });
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
  
  // Функции для одобрения/отклонения
  const handleApprove = async () => {
    if (!actionRequest) return;
    setActionLoading(true);
    try {
      await api.post(`/api/maintenance/${actionRequest.id}/approve`);
      toast.success('Заявка одобрена');
      setApproveModalOpen(false);
      setActionRequest(null);
      fetchRequests();
    } catch (error: any) {
      toast.error('Ошибка одобрения', { description: error?.message });
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleReject = async () => {
    if (!actionRequest) return;
    setActionLoading(true);
    try {
      await api.post(`/api/maintenance/${actionRequest.id}/reject`, { reason: rejectionReason });
      toast.success('Заявка отклонена');
      setRejectModalOpen(false);
      setActionRequest(null);
      setRejectionReason('');
      fetchRequests();
    } catch (error: any) {
      toast.error('Ошибка отклонения', { description: error?.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Cleaning handlers
  const openCleaningModal = (schedule?: CleaningSchedule) => {
    if (schedule) {
      setEditingCleaning(schedule);
      setCleaningFormData({
        area: schedule.area,
        frequency: schedule.frequency,
        assignedToId: schedule.assignedTo?.id?.toString() || '',
      });
    } else {
      setEditingCleaning(null);
      setCleaningFormData({ area: '', frequency: 'DAILY', assignedToId: '' });
    }
    setIsCleaningModalOpen(true);
  };

  const handleCleaningSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCleaningSubmitting(true);
    try {
      const payload = {
        area: cleaningFormData.area,
        frequency: cleaningFormData.frequency,
        assignedToId: cleaningFormData.assignedToId ? parseInt(cleaningFormData.assignedToId) : undefined,
      };
      if (editingCleaning) {
        await api.put(`/api/maintenance/cleaning/${editingCleaning.id}`, payload);
        toast.success('График уборки обновлён');
      } else {
        await api.post('/api/maintenance/cleaning', payload);
        toast.success('График уборки создан');
      }
      setIsCleaningModalOpen(false);
      fetchCleaningSchedules();
    } catch (error: any) {
      toast.error('Ошибка сохранения', { description: error?.message });
    } finally {
      setCleaningSubmitting(false);
    }
  };

  const deleteCleaning = async (id: number) => {
    if (!confirm('Удалить запись об уборке?')) return;
    try {
      await api.delete(`/api/maintenance/cleaning/${id}`);
      toast.success('Удалено');
      fetchCleaningSchedules();
    } catch (error: any) {
      toast.error('Ошибка удаления', { description: error?.message });
    }
  };

  const logCleaning = async (id: number) => {
    try {
      await api.post(`/api/maintenance/cleaning/${id}/log`);
      toast.success('Уборка зафиксирована');
      fetchCleaningSchedules();
    } catch (error: any) {
      toast.error('Ошибка', { description: error?.message });
    }
  };

  // Equipment handlers
  const openEquipmentModal = (item?: Equipment) => {
    if (item) {
      setEditingEquipment(item);
      setEquipmentFormData({
        name: item.name,
        location: item.location || '',
        nextCheckup: item.nextCheckup ? new Date(item.nextCheckup).toISOString().split('T')[0] : '',
      });
    } else {
      setEditingEquipment(null);
      setEquipmentFormData({ name: '', location: '', nextCheckup: '' });
    }
    setIsEquipmentModalOpen(true);
  };

  const handleEquipmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEquipmentSubmitting(true);
    try {
      const payload = {
        name: equipmentFormData.name,
        location: equipmentFormData.location || undefined,
        nextCheckup: equipmentFormData.nextCheckup ? new Date(equipmentFormData.nextCheckup).toISOString() : undefined,
      };
      if (editingEquipment) {
        await api.put(`/api/maintenance/equipment/${editingEquipment.id}`, payload);
        toast.success('Оборудование обновлено');
      } else {
        await api.post('/api/maintenance/equipment', payload);
        toast.success('Оборудование добавлено');
      }
      setIsEquipmentModalOpen(false);
      fetchEquipment();
    } catch (error: any) {
      toast.error('Ошибка сохранения', { description: error?.message });
    } finally {
      setEquipmentSubmitting(false);
    }
  };

  const deleteEquipment = async (id: number) => {
    if (!confirm('Удалить оборудование?')) return;
    try {
      await api.delete(`/api/maintenance/equipment/${id}`);
      toast.success('Удалено');
      fetchEquipment();
    } catch (error: any) {
      toast.error('Ошибка удаления', { description: error?.message });
    }
  };

  const logCheckup = async (id: number) => {
    try {
      await api.post(`/api/maintenance/equipment/${id}/checkup`);
      toast.success('Проверка зафиксирована');
      fetchEquipment();
    } catch (error: any) {
      toast.error('Ошибка', { description: error?.message });
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
    pending: requests.filter(r => r.status === 'PENDING').length,
    approved: requests.filter(r => r.status === 'APPROVED').length,
    rejected: requests.filter(r => r.status === 'REJECTED').length,
    inProgress: requests.filter(r => r.status === 'IN_PROGRESS').length,
    done: requests.filter(r => r.status === 'DONE').length,
    repair: requests.filter(r => r.type === 'REPAIR').length,
    issue: requests.filter(r => r.type === 'ISSUE').length,
  };
  
  // Определяем, может ли пользователь одобрять заявки
  const canApprove = userRole === 'DEVELOPER' || userRole === 'DIRECTOR' || userRole === 'DEPUTY';
  const canEditAll = userRole === 'DEVELOPER' || userRole === 'ADMIN';
  const isZavhoz = userRole === 'ZAVHOZ';
  const isTeacher = userRole === 'TEACHER';
  // Показывать колонки "Кто создал" и "Кто одобрил" для всех кроме учителей
  const showCreatorApprover = !isTeacher;

  const columns: Column<MaintenanceRequest>[] = [
    // Наименование
    { 
      key: 'title', 
      header: 'Наименование',
      render: (row) => (
        <div>
          <div className="font-medium">{row.title}</div>
          {row.type === 'ISSUE' && row.items && row.items.length > 0 && (
            <div className="text-sm text-gray-500 mt-1">
              {row.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    item.category === 'STATIONERY' ? 'bg-blue-400' :
                    item.category === 'HOUSEHOLD' ? 'bg-amber-400' : 'bg-gray-400'
                  }`}></span>
                  <span>{item.name} — {item.quantity} {item.unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    // Кол-во позиций (только для ISSUE)
    {
      key: 'itemsCount' as keyof MaintenanceRequest,
      header: 'Позиции',
      render: (row) => row.type === 'ISSUE' && row.items ? (
        <span className="px-2 py-1 rounded text-sm bg-gray-100 text-gray-800">
          {row.items.length} шт
        </span>
      ) : '—',
    },
    // Кто создал (для всех кроме учителей)
    ...(showCreatorApprover ? [{
      key: 'requester' as keyof MaintenanceRequest,
      header: 'Кто создал',
      render: (row: MaintenanceRequest) => row.requester ? `${row.requester.lastName} ${row.requester.firstName}` : '—',
    }] : []),
    {
      key: 'type',
      header: 'Тип',
      render: (row) => (
        <span className={`px-2 py-1 rounded text-sm ${maintenanceTypeColors[row.type]}`}>
          {maintenanceTypeLabels[row.type] || row.type}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Статус',
      render: (row) => (
        <span className={`px-2 py-1 rounded text-sm ${maintenanceStatusColors[row.status]}`}>
          {maintenanceStatusLabels[row.status] || row.status}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Дата',
      render: (row) => new Date(row.createdAt).toLocaleDateString('ru-RU'),
    },
    // Кто одобрил (для всех кроме учителей)
    ...(showCreatorApprover ? [{
      key: 'approver' as keyof MaintenanceRequest,
      header: 'Кто одобрил',
      render: (row: MaintenanceRequest) => row.approvedBy ? `${row.approvedBy.lastName} ${row.approvedBy.firstName}` : '—',
    }] : []),
    {
      key: 'actions',
      header: 'Действия',
      render: (row) => (
        <div className="flex gap-2">
          {/* Кнопки одобрения/отклонения для PENDING заявок */}
          {canApprove && row.status === 'PENDING' && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setActionRequest(row);
                  setApproveModalOpen(true);
                }}
                title="Одобрить"
              >
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setActionRequest(row);
                  setRejectModalOpen(true);
                }}
                title="Отклонить"
              >
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </>
          )}
          
          {/* Редактирование: DEVELOPER и ADMIN всегда, ZAVHOZ для APPROVED/IN_PROGRESS/DONE, учитель для своих не-одобренных */}
          {(canEditAll || 
            (isZavhoz && (row.status === 'APPROVED' || row.status === 'IN_PROGRESS' || row.status === 'DONE')) ||
            (userRole === 'TEACHER' && row.status !== 'APPROVED' && row.status !== 'IN_PROGRESS' && row.status !== 'DONE')
          ) && (
            <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          
          {/* Удаление: только DEVELOPER и ADMIN */}
          {canEditAll && (
            <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(row)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const frequencyMapping: Record<string, string> = {
    DAILY: 'Ежедневно',
    WEEKLY: 'Еженедельно',
    MONTHLY: 'Ежемесячно',
  };

  const tabs = [
    { id: 'requests' as TabType, label: 'Заявки', icon: ClipboardList },
    { id: 'cleaning' as TabType, label: 'График уборки', icon: Sparkles },
    { id: 'equipment' as TabType, label: 'Оборудование', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Header with tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          Техобслуживание
        </h1>
        {activeTab === 'requests' && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> Создать заявку
          </Button>
        )}
        {activeTab === 'cleaning' && (
          <Button onClick={() => openCleaningModal()}>
            <Plus className="mr-2 h-4 w-4" /> Добавить зону уборки
          </Button>
        )}
        {activeTab === 'equipment' && (
          <Button onClick={() => openEquipmentModal()}>
            <Plus className="mr-2 h-4 w-4" /> Добавить оборудование
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <>
          {/* Статистика */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div 
              className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${filterStatus === '' && filterType === '' ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => { setFilterStatus(''); setFilterType(''); }}
            >
              <p className="text-sm text-gray-500">Всего</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            
            {/* Для Директора/Завуча/Разработчика показываем Ожидают одобрения */}
            {canApprove && (
              <div 
                className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${filterStatus === 'PENDING' ? 'ring-2 ring-yellow-500' : ''}`}
                onClick={() => { setFilterStatus(filterStatus === 'PENDING' ? '' : 'PENDING'); setFilterType(''); }}
              >
                <p className="text-sm text-gray-500">Ожидают</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            )}
            
            {/* Для Завхоза показываем Одобренные */}
            {(isZavhoz || canApprove) && (
              <div 
                className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${filterStatus === 'APPROVED' ? 'ring-2 ring-green-500' : ''}`}
                onClick={() => { setFilterStatus(filterStatus === 'APPROVED' ? '' : 'APPROVED'); setFilterType(''); }}
              >
                <p className="text-sm text-gray-500">{isZavhoz ? 'Новые' : 'Одобренные'}</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
            )}
            
            <div 
              className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${filterStatus === 'IN_PROGRESS' ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => { setFilterStatus(filterStatus === 'IN_PROGRESS' ? '' : 'IN_PROGRESS'); setFilterType(''); }}
            >
              <p className="text-sm text-gray-500">В работе</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            
            <div 
              className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${filterStatus === 'DONE' ? 'ring-2 ring-gray-500' : ''}`}
              onClick={() => { setFilterStatus(filterStatus === 'DONE' ? '' : 'DONE'); setFilterType(''); }}
            >
              <p className="text-sm text-gray-500">Выполнено</p>
              <p className="text-2xl font-bold text-gray-600">{stats.done}</p>
            </div>
          </div>
          
          {/* Фильтры по типу */}
          <div className="grid grid-cols-2 gap-4">
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
              className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${filterType === 'ISSUE' ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => { setFilterType(filterType === 'ISSUE' ? '' : 'ISSUE'); setFilterStatus(''); }}
            >
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-600" />
                <p className="text-sm text-gray-500">Выдача</p>
              </div>
              <p className="text-2xl font-bold">{stats.issue}</p>
            </div>
          </div>

          {/* Активный фильтр */}
          {(filterStatus || filterType) && (
            <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded-lg">
              <Filter className="h-4 w-4" />
              <span>
                Фильтр: {filterStatus && maintenanceStatusLabels[filterStatus]} {filterType && maintenanceTypeLabels[filterType]}
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
        </>
      )}

      {/* Cleaning Tab */}
      {activeTab === 'cleaning' && (
        <Card>
          {cleaningLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="mt-2 text-gray-500">Загрузка...</p>
            </div>
          ) : cleaningSchedules.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Sparkles className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Нет графиков уборки. Добавьте первую зону.</p>
            </div>
          ) : (
            <div className="divide-y">
              {cleaningSchedules.map((schedule) => (
                <div key={schedule.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{schedule.area}</h3>
                      <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">
                        {frequencyMapping[schedule.frequency] || schedule.frequency}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      {schedule.assignedTo && (
                        <span>Ответственный: {schedule.assignedTo.lastName} {schedule.assignedTo.firstName}</span>
                      )}
                      {schedule.logs.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Последняя: {new Date(schedule.logs[0].timestamp).toLocaleString('ru-RU')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => logCleaning(schedule.id)} title="Зафиксировать уборку">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openCleaningModal(schedule)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteCleaning(schedule.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Equipment Tab */}
      {activeTab === 'equipment' && (
        <Card>
          {equipmentLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="mt-2 text-gray-500">Загрузка...</p>
            </div>
          ) : equipment.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Нет оборудования. Добавьте первое оборудование.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Расположение</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Последняя проверка</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Следующая проверка</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {equipment.map((item) => {
                    const nextCheckupDate = new Date(item.nextCheckup);
                    const isOverdue = nextCheckupDate < new Date();
                    const isUpcoming = nextCheckupDate < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                    return (
                      <tr key={item.id} className={isOverdue ? 'bg-red-50' : isUpcoming ? 'bg-yellow-50' : ''}>
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-gray-500">{item.location || '—'}</td>
                        <td className="px-4 py-3">{new Date(item.lastCheckup).toLocaleDateString('ru-RU')}</td>
                        <td className="px-4 py-3">
                          <span className={isOverdue ? 'text-red-600 font-medium' : isUpcoming ? 'text-yellow-600' : ''}>
                            {nextCheckupDate.toLocaleDateString('ru-RU')}
                            {isOverdue && <span className="ml-1">(просрочено)</span>}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => logCheckup(item.id)} title="Зафиксировать проверку">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openEquipmentModal(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteEquipment(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRequest ? 'Редактировать заявку' : 'Новая заявка на выдачу'}>
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          <div>
            <label htmlFor="type" className="block mb-1 font-medium">Тип заявки</label>
            <select {...register('type')} id="type" className="w-full p-2 border rounded">
              <option value="ISSUE">Выдача</option>
              <option value="REPAIR">Ремонт</option>
            </select>
            {errors.type && <FormError message={errors.type.message} />}
          </div>

          {/* Поля для заявки на ВЫДАЧУ - динамический список позиций */}
          {watchType === 'ISSUE' && (
            <>
              <div>
                <label htmlFor="title" className="block mb-1 font-medium">Название заявки <span className="text-red-500">*</span></label>
                <Input {...register('title')} id="title" placeholder="Например: Канцтовары для 3А класса" />
                {errors.title && <FormError message={errors.title.message} />}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-medium">Позиции заявки <span className="text-red-500">*</span></label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ name: '', quantity: 1, unit: 'шт', category: 'STATIONERY' })}
                  >
                    <PlusCircle className="h-4 w-4 mr-1" /> Добавить позицию
                  </Button>
                </div>
                
                {errors.items && typeof errors.items === 'object' && 'message' in errors.items && (
                  <FormError message={errors.items.message as string} />
                )}

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-600">Позиция {index + 1}</span>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                          >
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <InventoryAutocomplete
                            name={`items.${index}.name`}
                            control={control}
                            placeholder="Наименование товара"
                            onSelect={(selectedItem) => {
                              setValue(`items.${index}.name`, selectedItem.name);
                              setValue(`items.${index}.unit`, selectedItem.unit);
                            }}
                          />
                          {errors.items?.[index]?.name && (
                            <FormError message={errors.items[index]?.name?.message} />
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Input 
                              {...register(`items.${index}.quantity`, { valueAsNumber: true })} 
                              type="number" 
                              min="0.01"
                              step="0.01"
                              placeholder="Кол-во"
                              className="text-sm"
                            />
                            {errors.items?.[index]?.quantity && (
                              <FormError message={errors.items[index]?.quantity?.message} />
                            )}
                          </div>
                          <div>
                            <Input 
                              {...register(`items.${index}.unit`)} 
                              placeholder="Ед.изм"
                              className="text-sm"
                            />
                            {errors.items?.[index]?.unit && (
                              <FormError message={errors.items[index]?.unit?.message} />
                            )}
                          </div>
                          <div>
                            <select 
                              {...register(`items.${index}.category`)} 
                              className="w-full p-2 border rounded text-sm"
                            >
                              <option value="STATIONERY">Канц.</option>
                              <option value="HOUSEHOLD">Хоз.</option>
                              <option value="OTHER">Прочее</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Поля для заявки на РЕМОНТ */}
          {watchType === 'REPAIR' && (
            <div>
              <label htmlFor="title" className="block mb-1 font-medium">Тема <span className="text-red-500">*</span></label>
              <Input {...register('title')} id="title" placeholder="Кратко опишите проблему" />
              {errors.title && <FormError message={errors.title.message} />}
            </div>
          )}

          <div>
            <label htmlFor="description" className="block mb-1 font-medium">Описание {watchType === 'ISSUE' && '(необязательно)'}</label>
            <textarea {...register('description')} id="description" className="w-full p-2 border rounded" rows={3} placeholder="Подробности..." />
          </div>

          {/* Завхоз может менять статус APPROVED -> IN_PROGRESS -> DONE */}
          {userRole === 'ZAVHOZ' && editingRequest && (editingRequest.status === 'APPROVED' || editingRequest.status === 'IN_PROGRESS' || editingRequest.status === 'DONE') && (
            <div>
              <label htmlFor="status" className="block mb-1 font-medium">Статус заявки</label>
              <select {...register('status')} id="status" className="w-full p-2 border rounded">
                <option value="APPROVED">Одобрено</option>
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

      {/* Approve Modal */}
      <Modal isOpen={approveModalOpen} onClose={() => setApproveModalOpen(false)} title="Одобрение заявки">
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-full">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Вы уверены, что хотите одобрить эту заявку?</p>
              {actionRequest && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                  <p><strong>Наименование:</strong> {actionRequest.title}</p>
                  <p><strong>Тип:</strong> {maintenanceTypeLabels[actionRequest.type]}</p>
                  {actionRequest.type === 'ISSUE' && actionRequest.items && actionRequest.items.length > 0 && (
                    <div className="mt-2">
                      <strong>Позиции:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {actionRequest.items.map((item, idx) => (
                          <li key={idx}>
                            {item.name} — {item.quantity} {item.unit} 
                            <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${itemCategoryColors[item.category]}`}>
                              {itemCategoryLabels[item.category]}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p><strong>Заявитель:</strong> {actionRequest.requester ? `${actionRequest.requester.lastName} ${actionRequest.requester.firstName}` : '—'}</p>
                  {actionRequest.description && <p><strong>Описание:</strong> {actionRequest.description}</p>}
                </div>
              )}
              <p className="text-sm text-gray-600 mt-2">После одобрения заявка будет доступна завхозу для обработки.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setApproveModalOpen(false)} disabled={actionLoading}>Отмена</Button>
            <Button onClick={handleApprove} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
              {actionLoading ? 'Одобрение...' : 'Одобрить'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Отклонение заявки">
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-full">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Вы уверены, что хотите отклонить эту заявку?</p>
              {actionRequest && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                  <p><strong>Наименование:</strong> {actionRequest.title}</p>
                  <p><strong>Тип:</strong> {maintenanceTypeLabels[actionRequest.type]}</p>
                  {actionRequest.type === 'ISSUE' && actionRequest.items && actionRequest.items.length > 0 && (
                    <div className="mt-2">
                      <strong>Позиции:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {actionRequest.items.map((item, idx) => (
                          <li key={idx}>
                            {item.name} — {item.quantity} {item.unit}
                            <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${itemCategoryColors[item.category]}`}>
                              {itemCategoryLabels[item.category]}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p><strong>Заявитель:</strong> {actionRequest.requester ? `${actionRequest.requester.lastName} ${actionRequest.requester.firstName}` : '—'}</p>
                  {actionRequest.description && <p><strong>Описание:</strong> {actionRequest.description}</p>}
                </div>
              )}
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="rejectionReason" className="block mb-1 font-medium text-sm">Причина отклонения (необязательно)</label>
            <textarea 
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-2 border rounded text-sm" 
              rows={3} 
              placeholder="Укажите причину отклонения..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRejectModalOpen(false)} disabled={actionLoading}>Отмена</Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
              {actionLoading ? 'Отклонение...' : 'Отклонить'}
            </Button>
          </div>
        </div>
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
                  <p><strong>Тип:</strong> {maintenanceTypeLabels[deleteConfirm.type]}</p>
                  <p><strong>Статус:</strong> {maintenanceStatusLabels[deleteConfirm.status]}</p>
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

      {/* Cleaning Modal */}
      <Modal isOpen={isCleaningModalOpen} onClose={() => setIsCleaningModalOpen(false)} title={editingCleaning ? 'Редактировать график уборки' : 'Добавить зону уборки'}>
        <form onSubmit={handleCleaningSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="area" className="block mb-1 font-medium">Зона/Помещение</label>
            <Input
              id="area"
              value={cleaningFormData.area}
              onChange={(e) => setCleaningFormData(prev => ({ ...prev, area: e.target.value }))}
              placeholder="Например: Игровая комната, Спальня"
              required
            />
          </div>

          <div>
            <label htmlFor="frequency" className="block mb-1 font-medium">Частота</label>
            <select
              id="frequency"
              value={cleaningFormData.frequency}
              onChange={(e) => setCleaningFormData(prev => ({ ...prev, frequency: e.target.value }))}
              className="w-full p-2 border rounded"
            >
              <option value="DAILY">Ежедневно</option>
              <option value="WEEKLY">Еженедельно</option>
              <option value="MONTHLY">Ежемесячно</option>
            </select>
          </div>

          <div>
            <label htmlFor="assignedTo" className="block mb-1 font-medium">Ответственный</label>
            <select
              id="assignedTo"
              value={cleaningFormData.assignedToId}
              onChange={(e) => setCleaningFormData(prev => ({ ...prev, assignedToId: e.target.value }))}
              className="w-full p-2 border rounded"
            >
              <option value="">Не назначен</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.lastName} {emp.firstName} — {emp.position}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsCleaningModalOpen(false)}>Отмена</Button>
            <Button type="submit" disabled={cleaningSubmitting}>
              {cleaningSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Сохранение...</> : 'Сохранить'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Equipment Modal */}
      <Modal isOpen={isEquipmentModalOpen} onClose={() => setIsEquipmentModalOpen(false)} title={editingEquipment ? 'Редактировать оборудование' : 'Добавить оборудование'}>
        <form onSubmit={handleEquipmentSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="equipName" className="block mb-1 font-medium">Название</label>
            <Input
              id="equipName"
              value={equipmentFormData.name}
              onChange={(e) => setEquipmentFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Например: Холодильник, Стиральная машина"
              required
            />
          </div>

          <div>
            <label htmlFor="location" className="block mb-1 font-medium">Расположение</label>
            <Input
              id="location"
              value={equipmentFormData.location}
              onChange={(e) => setEquipmentFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Например: Кухня, Прачечная"
            />
          </div>

          <div>
            <label htmlFor="nextCheckup" className="block mb-1 font-medium">Следующая проверка</label>
            <Input
              id="nextCheckup"
              type="date"
              value={equipmentFormData.nextCheckup}
              onChange={(e) => setEquipmentFormData(prev => ({ ...prev, nextCheckup: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsEquipmentModalOpen(false)}>Отмена</Button>
            <Button type="submit" disabled={equipmentSubmitting}>
              {equipmentSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Сохранение...</> : 'Сохранить'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
