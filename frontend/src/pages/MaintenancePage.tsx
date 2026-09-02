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
import { RequestItemsBuilder } from '../components/maintenance/RequestItemsBuilder';
import { FulfillRequestModal } from '../components/modals/FulfillRequestModal';
import { DataTable, Column } from '../components/DataTable/DataTable';
import {
  Trash2,
  AlertCircle,
  Edit,
  Plus,
  Wrench,
  Package,
  ClipboardList,
  Filter,
  Sparkles,
  Settings,
  CheckCircle,
  Clock,
  Loader2,
  X,
  Check,
  ShoppingCart,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { PageHeader, PageSection, PageStack, PageToolbar } from '../components/ui/page';
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
  isPartiallyFulfilled,
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
  const [confirmReceiptLoading, setConfirmReceiptLoading] = useState<number | null>(null);

  // Модальное окно частичной/полной выдачи для завхоза
  const [fulfillModalOpen, setFulfillModalOpen] = useState(false);
  const [fulfillingRequest, setFulfillingRequest] = useState<MaintenanceRequest | null>(null);

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
      type: 'ISSUE',
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

  // Очищаем items при переключении на REPAIR
  useEffect(() => {
    if (watchType === 'REPAIR') {
      while (fields.length > 0) {
        remove(0);
      }
    }
  }, [watchType, remove]);

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
      type: 'ISSUE', // По умолчанию выдача
      items: [],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (request: MaintenanceRequest) => {
    setEditingRequest(request);
    reset({
      title: request.title,
      description: request.description || '',
      type: request.type,
      status: request.status,
      items: request.items && request.items.length > 0 
        ? request.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            category: item.category,
            inventoryItemId: item.inventoryItemId || null,
          }))
        : [],
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: MaintenanceFormData) => {
    try {
      const submitData: any = {
        title: data.title,
        description: data.description,
        type: data.type,
      };
      
      // Добавляем status только если он есть (для завхоза или при редактировании)
      if (data.status) {
        submitData.status = data.status;
      }
      
      // Добавляем items для типа ISSUE и PURCHASE
      if ((data.type === 'ISSUE' || data.type === 'PURCHASE') && data.items && data.items.length > 0) {
        submitData.items = data.items;
      }
      
      if (editingRequest) {
        const result = await api.put(`/api/maintenance/${editingRequest.id}`, submitData);
        toast.success('Заявка успешно обновлена');
        
        // Показываем информацию о складской синхронизации
        if (result?.stockDeduction) {
          const sd = result.stockDeduction;
          if (sd.transactions && sd.transactions.length > 0) {
            const itemsList = sd.transactions.map((t: any) => `${t.itemName}: -${t.deducted}`).join(', ');
            toast.info(`Списано со склада: ${itemsList}`, { duration: 5000 });
          }
          if (sd.warnings && sd.warnings.length > 0) {
            for (const w of sd.warnings) {
              toast.warning(w, { duration: 6000 });
            }
          }
        }
      } else {
        await api.post('/api/maintenance', submitData);
        toast.success('Заявка успешно создана');
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

  const handleConfirmReceipt = async (id: number) => {
    setConfirmReceiptLoading(id);
    try {
      await api.post(`/api/maintenance/${id}/confirm-receipt`);
      toast.success('Получение подтверждено');
      fetchRequests();
    } catch (error: any) {
      toast.error('Ошибка подтверждения', { description: error?.message });
    } finally {
      setConfirmReceiptLoading(null);
    }
  };

  const handleQuickStatusChange = async (id: number, status: 'IN_PROGRESS' | 'DONE') => {
    try {
      const result = await api.put(`/api/maintenance/${id}`, { status });
      toast.success('Статус изменен');
      if (result?.stockDeduction) {
        const sd = result.stockDeduction;
        if (sd.transactions && sd.transactions.length > 0) {
          const itemsList = sd.transactions.map((t: any) => `${t.itemName}: -${t.deducted}`).join(', ');
          toast.info(`Списано со склада: ${itemsList}`, { duration: 5000 });
        }
        if (sd.warnings && sd.warnings.length > 0) {
          for (const w of sd.warnings) {
            toast.warning(w, { duration: 6000 });
          }
        }
      }
      fetchRequests();
    } catch (error: any) {
      toast.error('Ошибка изменения статуса', { description: error?.message });
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
    completed: requests.filter(r => r.status === 'COMPLETED').length,
    issue: requests.filter(r => r.type === 'ISSUE').length,
    purchase: requests.filter(r => r.type === 'PURCHASE').length,
    repair: requests.filter(r => r.type === 'REPAIR').length,
  };
  
  // Права доступа
  const canApprove = userRole === 'DEVELOPER' || userRole === 'DIRECTOR' || userRole === 'DEPUTY';
  const canEditAll = userRole === 'DEVELOPER' || userRole === 'ADMIN';
  const isZavhoz = userRole === 'ZAVHOZ';
  const canDelete = canEditAll || isZavhoz;

  // Компактная адаптивная структура колонок таблицы без горизонтального скролла
  const columns: Column<MaintenanceRequest>[] = [
    // Колонка 1: Заявка и позиции
    { 
      key: 'title', 
      header: 'Заявка и ТМЦ',
      render: (row) => (
        <div className="space-y-1.5 py-1">
          {/* Header row with Type badge, ID and Title */}
          <div className="flex flex-wrap items-center gap-1.5">
            {row.type === 'PURCHASE' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                <ShoppingCart className="h-3 w-3 text-emerald-600" />
                Покупка
              </span>
            ) : row.type === 'ISSUE' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 shrink-0">
                <Package className="h-3 w-3 text-purple-600" />
                Выдача
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 border border-orange-200 shrink-0">
                <Wrench className="h-3 w-3 text-orange-600" />
                Ремонт
              </span>
            )}

            <span className="font-mono text-[11px] font-bold text-text-tertiary">
              #{row.id}
            </span>

            <span className="font-bold text-[13.5px] text-text-primary">
              {row.title}
            </span>
          </div>

          {/* Items Preview for ISSUE and PURCHASE */}
          {(row.type === 'ISSUE' || row.type === 'PURCHASE') && row.items && row.items.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {row.items.slice(0, 3).map((item, idx) => {
                const isDone = row.status === 'DONE' || row.status === 'COMPLETED';
                const isPartial = item.issuedQuantity != null && item.issuedQuantity < item.quantity;
                const isZeroIssued = item.issuedQuantity === 0;

                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-0.5 rounded-md bg-fill-quaternary border border-separator/60"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        item.category === 'STATIONERY'
                          ? 'bg-blue-500'
                          : item.category === 'HOUSEHOLD'
                          ? 'bg-amber-500'
                          : 'bg-gray-500'
                      }`}
                    />
                    <span className="text-text-primary font-semibold truncate max-w-[130px]">{item.name}</span>
                    <span className="text-text-secondary">({item.quantity} {item.unit})</span>

                    {/* Отметка выдачи */}
                    {row.type === 'ISSUE' && isDone && item.issuedQuantity != null && (
                      <span className="ml-0.5 text-[10.5px] font-bold">
                        {isZeroIssued ? (
                          <span className="text-rose-600">✕ 0</span>
                        ) : isPartial ? (
                          <span className="text-amber-700">⚠️ {item.issuedQuantity}</span>
                        ) : (
                          <span className="text-emerald-700">✓</span>
                        )}
                      </span>
                    )}
                  </span>
                );
              })}

              {row.items.length > 3 && (
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-fill-tertiary text-text-secondary">
                  +{row.items.length - 3} ещё
                </span>
              )}
            </div>
          )}

          {/* Description snippet */}
          {row.description && (
            <p className="text-[11.5px] text-text-tertiary line-clamp-1 italic">
              {row.description}
            </p>
          )}
        </div>
      ),
    },

    // Колонка 2: Заявитель и дата
    {
      key: 'requester' as keyof MaintenanceRequest,
      header: 'Заявитель и дата',
      render: (row: MaintenanceRequest) => (
        <div className="space-y-0.5 text-[12.5px]">
          <div className="font-semibold text-text-primary">
            {row.requester ? `${row.requester.lastName} ${row.requester.firstName}` : '—'}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
            {row.requester?.user?.role && (
              <span className="px-1.5 py-0.2 rounded bg-fill-tertiary text-text-secondary font-medium">
                {row.requester.user.role === 'TEACHER' ? 'Учитель' :
                 row.requester.user.role === 'DEPUTY' ? 'Завуч' :
                 row.requester.user.role === 'DIRECTOR' ? 'Директор' :
                 row.requester.user.role === 'ZAVHOZ' ? 'Завхоз' : row.requester.user.role}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(row.createdAt).toLocaleDateString('ru-RU')}
            </span>
          </div>
        </div>
      ),
    },

    // Колонка 3: Статус и согласование
    {
      key: 'status',
      header: 'Статус',
      render: (row) => (
        <div className="space-y-1">
          <div>
            {isPartiallyFulfilled(row) ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11.5px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 shadow-xs">
                ⚠️ Частично выдано
              </span>
            ) : (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11.5px] font-semibold ${maintenanceStatusColors[row.status]}`}>
                {maintenanceStatusLabels[row.status] || row.status}
              </span>
            )}
          </div>

          {/* Subtext with approver/receiver info */}
          {row.approvedBy && row.status !== 'REJECTED' && (
            <div className="text-[11px] text-text-tertiary truncate">
              Одобрил: <span className="text-text-secondary font-medium">{row.approvedBy.lastName} {row.approvedBy.firstName?.[0]}.</span>
            </div>
          )}
          {row.status === 'COMPLETED' && row.receivedBy && (
            <div className="text-[11px] text-text-tertiary truncate">
              Получил: <span className="text-text-secondary font-medium">{row.receivedBy.lastName} {row.receivedBy.firstName?.[0]}.</span>
            </div>
          )}
          {row.status === 'REJECTED' && row.rejectionReason && (
            <div className="text-[11px] text-rose-600 truncate" title={row.rejectionReason}>
              Причина: {row.rejectionReason}
            </div>
          )}
        </div>
      ),
    },

    // Колонка 4: Действия
    {
      key: 'actions',
      header: 'Действия',
      render: (row) => {
        const canEditThisRequest =
          canEditAll ||
          isZavhoz ||
          (userRole === 'TEACHER' && row.status === 'PENDING') ||
          ((userRole === 'DIRECTOR' || userRole === 'DEPUTY') && (row.requesterId === user?.employee?.id || row.status === 'PENDING'));

        return (
          <div className="flex flex-wrap items-center gap-1.5 justify-end">
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
                  title="Одобрить заявку"
                  className="h-8 px-2.5 text-macos-green border-macos-green/40 hover:bg-macos-green hover:text-white"
                >
                  <Check className="h-3.5 w-3.5 mr-1" /> Одобрить
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActionRequest(row);
                    setRejectModalOpen(true);
                  }}
                  title="Отклонить заявку"
                  className="h-8 px-2 text-macos-red border-macos-red/40 hover:bg-macos-red hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            
            {/* Выдача завхозом для заявок ISSUE */}
            {isZavhoz && (row.status === 'APPROVED' || row.status === 'IN_PROGRESS') && row.type === 'ISSUE' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFulfillingRequest(row);
                  setFulfillModalOpen(true);
                }}
                title="Оформить выдачу со склада"
                className="h-8 px-2.5 border-macos-green text-macos-green hover:bg-macos-green hover:text-white font-semibold"
              >
                <Package className="h-3.5 w-3.5 mr-1" /> Выдать
              </Button>
            )}

            {/* Действия для завхоза для заявок REPAIR и PURCHASE */}
            {isZavhoz && row.status === 'APPROVED' && (row.type === 'REPAIR' || row.type === 'PURCHASE') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickStatusChange(row.id, 'IN_PROGRESS')}
                title="Взять в работу"
                className="h-8 px-2.5 border-macos-blue text-macos-blue hover:bg-macos-blue hover:text-white"
              >
                <Clock className="h-3.5 w-3.5 mr-1" /> В работу
              </Button>
            )}
            {isZavhoz && row.status === 'IN_PROGRESS' && (row.type === 'REPAIR' || row.type === 'PURCHASE') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickStatusChange(row.id, 'DONE')}
                title="Отметить как выполненное / закупленное"
                className="h-8 px-2.5 border-macos-green text-macos-green hover:bg-macos-green hover:text-white"
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Выполнить
              </Button>
            )}

            {/* Кнопка подтверждения получения для создателя, если статус DONE */}
            {row.status === 'DONE' && (row.requesterId === user?.employee?.id || canEditAll) && (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => handleConfirmReceipt(row.id)} 
                disabled={confirmReceiptLoading === row.id}
                title="Подтвердить получение"
                className="h-8 px-2.5 border-macos-green text-macos-green hover:bg-macos-green hover:text-white font-semibold"
              >
                {confirmReceiptLoading === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                Получил
              </Button>
            )}

            {/* Редактирование (Завхоз, Админ, Создатель) */}
            {canEditThisRequest && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(row)}
                title="Редактировать заявку"
                className="h-8 w-8 p-0"
              >
                <Edit className="h-3.5 w-3.5 text-text-secondary" />
              </Button>
            )}
            
            {/* Удаление: Завхоз, Админ, Разработчик */}
            {canDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteConfirm(row)}
                title="Удалить заявку"
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        );
      },
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
    <PageStack>
      <PageHeader
        eyebrow="Maintenance & Supply"
        title="Заявки и обслуживание"
        description="Заявки на выдачу ТМЦ, закупки, ремонты, графики уборки и оборудование."
        icon={<Wrench className="h-5 w-5" />}
        meta={<span className="mezon-badge macos-badge-neutral">{activeTab === 'requests' ? 'Заявки' : activeTab === 'cleaning' ? 'Уборка' : 'Оборудование'}</span>}
      />

      <PageToolbar className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex w-fit max-w-full gap-1 overflow-x-auto rounded-[16px] border border-card bg-surface-primary p-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.06)] backdrop-blur-[24px]">
          <nav className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[11px] font-medium uppercase tracking-widest macos-transition ${
                    activeTab === tab.id
                      ? 'bg-[rgba(255,255,255,0.9)] text-primary shadow-[0_8px_20px_rgba(15,23,42,0.08)]'
                      : 'text-secondary hover:bg-[rgba(255,255,255,0.58)] hover:text-primary'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {activeTab === 'requests' ? (
          <Button onClick={handleCreate} className="bg-macos-blue hover:bg-macos-blue/90 text-white shadow-sm font-semibold">
            <Plus className="mr-2 h-4 w-4" /> Создать заявку
          </Button>
        ) : activeTab === 'cleaning' ? (
          <Button onClick={() => openCleaningModal()}>
            <Plus className="mr-2 h-4 w-4" /> Добавить зону уборки
          </Button>
        ) : (
          <Button onClick={() => openEquipmentModal()}>
            <Plus className="mr-2 h-4 w-4" /> Добавить оборудование
          </Button>
        )}
      </PageToolbar>

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <PageSection className="space-y-4">
          {/* Статистика по статусам и типам */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div 
              className={`bg-white rounded-2xl border p-3.5 cursor-pointer macos-transition hover:shadow-subtle ${filterStatus === '' && filterType === '' ? 'ring-2 ring-macos-blue border-transparent' : 'border-separator/80'}`}
              onClick={() => { setFilterStatus(''); setFilterType(''); }}
            >
              <p className="text-[11.5px] font-medium text-text-tertiary">Всего заявок</p>
              <p className="text-[22px] font-bold tracking-tight text-text-primary">{stats.total}</p>
            </div>
            
            {/* Для Директора/Завуча показываем Ожидают одобрения */}
            {canApprove && (
              <div 
                className={`bg-white rounded-2xl border p-3.5 cursor-pointer macos-transition hover:shadow-subtle ${filterStatus === 'PENDING' ? 'ring-2 ring-yellow-500 border-transparent' : 'border-separator/80'}`}
                onClick={() => { setFilterStatus(filterStatus === 'PENDING' ? '' : 'PENDING'); setFilterType(''); }}
              >
                <p className="text-[11.5px] font-medium text-text-tertiary">Ожидают</p>
                <p className="text-[22px] font-bold tracking-tight text-macos-orange">{stats.pending}</p>
              </div>
            )}
            
            {/* Для Завхоза показываем Одобренные / Новые */}
            {(isZavhoz || canApprove) && (
              <div 
                className={`bg-white rounded-2xl border p-3.5 cursor-pointer macos-transition hover:shadow-subtle ${filterStatus === 'APPROVED' ? 'ring-2 ring-green-500 border-transparent' : 'border-separator/80'}`}
                onClick={() => { setFilterStatus(filterStatus === 'APPROVED' ? '' : 'APPROVED'); setFilterType(''); }}
              >
                <p className="text-[11.5px] font-medium text-text-tertiary">{isZavhoz ? 'К исполнению' : 'Одобрены'}</p>
                <p className="text-[22px] font-bold tracking-tight text-macos-green">{stats.approved}</p>
              </div>
            )}
            
            <div 
              className={`bg-white rounded-2xl border p-3.5 cursor-pointer macos-transition hover:shadow-subtle ${filterStatus === 'IN_PROGRESS' ? 'ring-2 ring-blue-500 border-transparent' : 'border-separator/80'}`}
              onClick={() => { setFilterStatus(filterStatus === 'IN_PROGRESS' ? '' : 'IN_PROGRESS'); setFilterType(''); }}
            >
              <p className="text-[11.5px] font-medium text-text-tertiary">В работе</p>
              <p className="text-[22px] font-bold tracking-tight text-macos-blue">{stats.inProgress}</p>
            </div>
            
            <div 
              className={`bg-white rounded-2xl border p-3.5 cursor-pointer macos-transition hover:shadow-subtle ${filterStatus === 'DONE' ? 'ring-2 ring-gray-500 border-transparent' : 'border-separator/80'}`}
              onClick={() => { setFilterStatus(filterStatus === 'DONE' ? '' : 'DONE'); setFilterType(''); }}
            >
              <p className="text-[11.5px] font-medium text-text-tertiary">Выполнено</p>
              <p className="text-[22px] font-bold tracking-tight text-text-secondary">{stats.done}</p>
            </div>

            <div 
              className={`bg-white rounded-2xl border p-3.5 cursor-pointer macos-transition hover:shadow-subtle ${filterStatus === 'COMPLETED' ? 'ring-2 ring-emerald-500 border-transparent' : 'border-separator/80'}`}
              onClick={() => { setFilterStatus(filterStatus === 'COMPLETED' ? '' : 'COMPLETED'); setFilterType(''); }}
            >
              <p className="text-[11.5px] font-medium text-text-tertiary">Завершено</p>
              <p className="text-[22px] font-bold tracking-tight text-emerald-600">{stats.completed}</p>
            </div>
          </div>
          
          {/* Фильтры по категориям (Типам заявок) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div 
              className={`bg-white rounded-2xl border p-3.5 cursor-pointer macos-transition hover:shadow-subtle flex items-center justify-between ${filterType === 'ISSUE' ? 'ring-2 ring-purple-500 border-transparent bg-purple-50/20' : 'border-separator/80'}`}
              onClick={() => { setFilterType(filterType === 'ISSUE' ? '' : 'ISSUE'); setFilterStatus(''); }}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100/80 text-purple-700">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11.5px] font-semibold text-text-secondary uppercase">Выдача со склада</p>
                  <p className="text-[18px] font-bold text-text-primary leading-none mt-0.5">{stats.issue}</p>
                </div>
              </div>
            </div>

            <div 
              className={`bg-white rounded-2xl border p-3.5 cursor-pointer macos-transition hover:shadow-subtle flex items-center justify-between ${filterType === 'PURCHASE' ? 'ring-2 ring-emerald-500 border-transparent bg-emerald-50/20' : 'border-separator/80'}`}
              onClick={() => { setFilterType(filterType === 'PURCHASE' ? '' : 'PURCHASE'); setFilterStatus(''); }}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100/80 text-emerald-700">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11.5px] font-semibold text-text-secondary uppercase">Заявки на покупку</p>
                  <p className="text-[18px] font-bold text-text-primary leading-none mt-0.5">{stats.purchase}</p>
                </div>
              </div>
            </div>

            <div 
              className={`bg-white rounded-2xl border p-3.5 cursor-pointer macos-transition hover:shadow-subtle flex items-center justify-between ${filterType === 'REPAIR' ? 'ring-2 ring-orange-500 border-transparent bg-orange-50/20' : 'border-separator/80'}`}
              onClick={() => { setFilterType(filterType === 'REPAIR' ? '' : 'REPAIR'); setFilterStatus(''); }}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-100/80 text-orange-700">
                  <Wrench className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11.5px] font-semibold text-text-secondary uppercase">Ремонт и хозработы</p>
                  <p className="text-[18px] font-bold text-text-primary leading-none mt-0.5">{stats.repair}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Активный фильтр */}
          {(filterStatus || filterType) && (
            <div className="flex items-center justify-between text-sm bg-blue-50/80 border border-blue-200 text-blue-900 px-3.5 py-2 rounded-xl">
              <div className="flex items-center gap-2 text-[12.5px] font-medium">
                <Filter className="h-4 w-4 text-blue-600" />
                <span>
                  Активный фильтр: {filterStatus && maintenanceStatusLabels[filterStatus as keyof typeof maintenanceStatusLabels]} {filterType && maintenanceTypeLabels[filterType as keyof typeof maintenanceTypeLabels]}
                </span>
              </div>
              <button 
                onClick={() => { setFilterStatus(''); setFilterType(''); }} 
                className="text-[12px] font-bold text-blue-700 hover:underline"
              >
                Сбросить фильтр
              </button>
            </div>
          )}

          {/* Таблица заявок без горизонтального скролла */}
          <Card className="p-0 overflow-hidden border-separator/80">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-macos-blue" />
                <p className="mt-2 text-sm text-text-secondary">Загрузка заявок...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-12 text-center text-text-secondary">
                <ClipboardList className="h-10 w-10 mx-auto text-text-tertiary mb-2" />
                <p className="font-semibold text-text-primary">
                  {filterStatus || filterType ? 'Нет заявок по выбранному фильтру' : 'Список заявок пуст'}
                </p>
                <p className="text-xs text-text-tertiary mt-1">
                  Нажмите кнопку «Создать заявку» для оформления запроса на выдачу, покупку или ремонт.
                </p>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filteredRequests}
                page={1}
                pageSize={filteredRequests.length}
                total={filteredRequests.length}
                onPageChange={() => {}}
              />
            )}
          </Card>
        </PageSection>
      )}

      {/* Cleaning Tab */}
      {activeTab === 'cleaning' && (
        <PageSection className="p-0">
          <Card>
            {cleaningLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-macos-blue" />
                <p className="mt-2 text-secondary">Загрузка...</p>
              </div>
            ) : cleaningSchedules.length === 0 ? (
              <div className="p-8 text-center text-secondary">
                <Sparkles className="h-12 w-12 mx-auto mb-3 text-tertiary" />
                <p>Нет графиков уборки. Добавьте первую зону.</p>
              </div>
            ) : (
              <div className="divide-y">
                {cleaningSchedules.map((schedule) => (
                  <div key={schedule.id} className="p-4 flex justify-between items-center hover:bg-fill-quaternary">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{schedule.area}</h3>
                        <span className="px-2 py-0.5 text-xs rounded bg-fill-tertiary text-secondary">
                          {frequencyMapping[schedule.frequency] || schedule.frequency}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-secondary">
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
                        <CheckCircle className="h-4 w-4 text-macos-green" />
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
        </PageSection>
      )}

      {/* Equipment Tab */}
      {activeTab === 'equipment' && (
        <PageSection className="p-0">
          <Card>
            {equipmentLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-macos-blue" />
                <p className="mt-2 text-secondary">Загрузка...</p>
              </div>
            ) : equipment.length === 0 ? (
              <div className="p-8 text-center text-secondary">
                <Settings className="h-12 w-12 mx-auto mb-3 text-tertiary" />
                <p>Нет оборудования. Добавьте первое оборудование.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-fill-quaternary">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase">Название</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase">Расположение</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase">Последняя проверка</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase">Следующая проверка</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {equipment.map((item) => {
                      const nextCheckupDate = new Date(item.nextCheckup);
                      const isOverdue = nextCheckupDate < new Date();
                      const isUpcoming = nextCheckupDate < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                      return (
                        <tr key={item.id} className={isOverdue ? 'bg-[rgba(255,59,48,0.06)]' : isUpcoming ? 'bg-[rgba(255,204,0,0.06)]' : ''}>
                          <td className="px-4 py-3 font-medium">{item.name}</td>
                          <td className="px-4 py-3 text-secondary">{item.location || '—'}</td>
                          <td className="px-4 py-3">{new Date(item.lastCheckup).toLocaleDateString('ru-RU')}</td>
                          <td className="px-4 py-3">
                            <span className={isOverdue ? 'text-macos-red font-medium' : isUpcoming ? 'text-macos-orange' : ''}>
                              {nextCheckupDate.toLocaleDateString('ru-RU')}
                              {isOverdue && <span className="ml-1">(просрочено)</span>}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => logCheckup(item.id)} title="Зафиксировать проверку">
                                <CheckCircle className="h-4 w-4 text-macos-green" />
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
        </PageSection>
      )}

      {/* Create/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={
          editingRequest
            ? 'Редактировать заявку'
            : watchType === 'PURCHASE'
            ? 'Новая заявка на покупку (закупку)'
            : watchType === 'ISSUE'
            ? 'Новая заявка на выдачу ТМЦ'
            : 'Новая заявка на ремонт'
        }
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-5 space-y-4">
          {/* Тройной переключатель типа заявки (Segmented Control) */}
          <div>
            <label className="block text-[11px] uppercase font-bold text-text-tertiary mb-1.5 tracking-wider">
              Тип заявки
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-fill-quaternary/80 rounded-2xl border border-separator/60">
              <button
                type="button"
                onClick={() => setValue('type', 'ISSUE')}
                className={`py-2 px-2 rounded-xl font-semibold text-[12.5px] flex items-center justify-center gap-1.5 transition-all ${
                  watchType === 'ISSUE'
                    ? 'bg-white text-purple-700 shadow-sm border border-black/5'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Package className="h-4 w-4 shrink-0" />
                <span className="truncate">Выдача</span>
              </button>

              <button
                type="button"
                onClick={() => setValue('type', 'PURCHASE')}
                className={`py-2 px-2 rounded-xl font-semibold text-[12.5px] flex items-center justify-center gap-1.5 transition-all ${
                  watchType === 'PURCHASE'
                    ? 'bg-white text-emerald-700 shadow-sm border border-black/5'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <ShoppingCart className="h-4 w-4 shrink-0" />
                <span className="truncate">Покупка</span>
              </button>

              <button
                type="button"
                onClick={() => setValue('type', 'REPAIR')}
                className={`py-2 px-2 rounded-xl font-semibold text-[12.5px] flex items-center justify-center gap-1.5 transition-all ${
                  watchType === 'REPAIR'
                    ? 'bg-white text-orange-700 shadow-sm border border-black/5'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Wrench className="h-4 w-4 shrink-0" />
                <span className="truncate">Ремонт</span>
              </button>
            </div>
            {errors.type && <FormError message={errors.type.message} />}
          </div>

          {/* Поля для заявки на ВЫДАЧУ или ПОКУПКУ */}
          {(watchType === 'ISSUE' || watchType === 'PURCHASE') && (
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block mb-1 text-[13px] font-bold text-text-primary">
                  Название заявки <span className="text-macos-red">*</span>
                </label>
                <Input 
                  {...register('title')} 
                  id="title" 
                  placeholder={
                    watchType === 'PURCHASE'
                      ? 'Например: Закупка бумаги А4 и картриджей для учительской'
                      : 'Например: Канцтовары для 3А класса (на 1-ю четверть)'
                  } 
                  className="h-10 text-[13.5px]"
                />
                {errors.title && <FormError message={errors.title.message} />}
              </div>

              {/* Интерактивный билдер позиций с поддержкой режима ISSUE / PURCHASE */}
              <RequestItemsBuilder
                items={(watch('items') as any) || []}
                mode={watchType === 'PURCHASE' ? 'PURCHASE' : 'ISSUE'}
                onAdd={(item) => append(item)}
                onRemove={(index) => remove(index)}
                onUpdateQuantity={(index, quantity) => {
                  setValue(`items.${index}.quantity`, quantity, { shouldValidate: true });
                }}
                error={errors.items && typeof errors.items === 'object' && 'message' in errors.items ? (errors.items.message as string) : undefined}
              />
            </div>
          )}

          {/* Поля для заявки на РЕМОНТ */}
          {watchType === 'REPAIR' && (
            <div className="space-y-3">
              <div>
                <label htmlFor="title" className="block mb-1 text-[13px] font-bold text-text-primary">
                  Тема / Описание неисправности <span className="text-macos-red">*</span>
                </label>
                <Input 
                  {...register('title')} 
                  id="title" 
                  placeholder="Например: Замена лампы в каб. 204 или ремонт дверного замка" 
                  className="h-10 text-[13.5px]"
                />
                {errors.title && <FormError message={errors.title.message} />}
              </div>
            </div>
          )}

          {/* Описание / Примечание */}
          <div>
            <label htmlFor="description" className="block mb-1 text-[12.5px] font-semibold text-text-secondary">
              Примечание / комментарий {watchType !== 'REPAIR' && '(необязательно)'}
            </label>
            <textarea 
              {...register('description')} 
              id="description" 
              className="w-full p-2.5 border border-separator/80 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-macos-blue/40 bg-white" 
              rows={2} 
              placeholder="Дополнительные пожелания или комментарий для завхоза..." 
            />
          </div>

          {/* Завхоз / Руководитель может менять статус заявки */}
          {editingRequest && (isZavhoz || canEditAll) && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
              <label htmlFor="status" className="block text-[12px] font-bold uppercase text-amber-900">
                Статус выполнения заявки:
              </label>
              <select 
                {...register('status')} 
                id="status" 
                className="w-full p-2 border border-amber-300 rounded-lg text-sm bg-white font-medium"
              >
                <option value="PENDING">Ожидает одобрения</option>
                <option value="APPROVED">Одобрено</option>
                <option value="IN_PROGRESS">В работе</option>
                <option value="DONE">Выполнено</option>
                <option value="COMPLETED">Завершено</option>
                <option value="REJECTED">Отклонено</option>
              </select>
              {errors.status && <FormError message={errors.status.message} />}
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-separator/60">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Отмена
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-macos-blue hover:bg-macos-blue/90 text-white font-semibold px-5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Сохранение...
                </>
              ) : editingRequest ? (
                'Сохранить изменения'
              ) : (
                'Создать заявку'
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Approve Modal */}
      <Modal isOpen={approveModalOpen} onClose={() => setApproveModalOpen(false)} title="Одобрение заявки">
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-[rgba(52,199,89,0.12)] rounded-full">
              <Check className="h-6 w-6 text-macos-green"/>
            </div>
            <div className="flex-1">
              <p className="font-medium text-primary">Вы уверены, что хотите одобрить эту заявку?</p>
              {actionRequest && (
                <div className="mt-2 p-3 bg-fill-quaternary rounded-lg text-sm space-y-1">
                  <p><strong>Наименование:</strong> {actionRequest.title}</p>
                  <p><strong>Тип:</strong> {maintenanceTypeLabels[actionRequest.type]}</p>
                  {(actionRequest.type === 'ISSUE' || actionRequest.type === 'PURCHASE') && actionRequest.items && actionRequest.items.length > 0 && (
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
              <p className="text-sm text-secondary mt-2">После одобрения заявка будет направлена завхозу для обработки.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setApproveModalOpen(false)} disabled={actionLoading}>Отмена</Button>
            <Button onClick={handleApprove} disabled={actionLoading} className="bg-macos-green hover:bg-macos-green">
              {actionLoading ? 'Одобрение...' : 'Одобрить'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Отклонение заявки">
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-[rgba(255,59,48,0.12)] rounded-full">
              <X className="h-6 w-6 text-macos-red"/>
            </div>
            <div className="flex-1">
              <p className="font-medium text-primary">Вы уверены, что хотите отклонить эту заявку?</p>
              {actionRequest && (
                <div className="mt-2 p-3 bg-fill-quaternary rounded-lg text-sm space-y-1">
                  <p><strong>Наименование:</strong> {actionRequest.title}</p>
                  <p><strong>Тип:</strong> {maintenanceTypeLabels[actionRequest.type]}</p>
                  {(actionRequest.type === 'ISSUE' || actionRequest.type === 'PURCHASE') && actionRequest.items && actionRequest.items.length > 0 && (
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
            <div className="p-2 bg-[rgba(255,59,48,0.12)] rounded-full">
              <AlertCircle className="h-6 w-6 text-macos-red"/>
            </div>
            <div>
              <p className="font-medium text-primary">Вы уверены, что хотите удалить эту заявку?</p>
              {deleteConfirm && (
                <div className="mt-2 p-3 bg-fill-quaternary rounded-lg text-sm">
                  <p><strong>Тема:</strong> {deleteConfirm.title}</p>
                  <p><strong>Тип:</strong> {maintenanceTypeLabels[deleteConfirm.type]}</p>
                  <p><strong>Статус:</strong> {maintenanceStatusLabels[deleteConfirm.status]}</p>
                  {deleteConfirm.description && <p><strong>Описание:</strong> {deleteConfirm.description}</p>}
                </div>
              )}
              <p className="text-sm text-macos-red mt-2">Это действие нельзя отменить!</p>
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

      {/* Fulfill Request Modal (Завхоз - выдача товаров) */}
      <FulfillRequestModal
        isOpen={fulfillModalOpen}
        onClose={() => {
          setFulfillModalOpen(false);
          setFulfillingRequest(null);
        }}
        request={fulfillingRequest}
        onSuccess={() => {
          fetchRequests();
        }}
      />
    </PageStack>
  );
}
