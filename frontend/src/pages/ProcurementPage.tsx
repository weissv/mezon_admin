// src/pages/ProcurementPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Modal } from '../components/Modal';
import { 
  ShoppingCart, Users, PlusCircle, AlertTriangle, Search, 
  Package, Check, X, Truck, ClipboardCheck, ArrowRight,
  BarChart3, Edit, Trash2, Eye, Send, Ban, RefreshCw
} from 'lucide-react';
import { 
  PurchaseOrder, Supplier, PurchaseOrderStatus,
  purchaseOrderStatusLabels, purchaseOrderStatusColors,
  purchaseOrderTypeLabels, purchaseOrderTypeColors,
  priorityLabels, priorityColors,
} from '../types/procurement';
import { PurchaseOrderForm } from '../components/forms/PurchaseOrderForm';
import { SupplierForm } from '../components/forms/SupplierForm';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export default function ProcurementPage() {
  const [viewMode, setViewMode] = useState<'orders' | 'suppliers'>('orders');

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-6 w-6" />
          Закупки
        </h1>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'orders' ? 'default' : 'outline'}
            onClick={() => setViewMode('orders')}
          >
            <Package className="mr-2 h-4 w-4" />
            Заказы
          </Button>
          <Button
            variant={viewMode === 'suppliers' ? 'default' : 'outline'}
            onClick={() => setViewMode('suppliers')}
          >
            <Users className="mr-2 h-4 w-4" /> Поставщики
          </Button>
        </div>
      </div>

      {viewMode === 'orders' ? <OrdersView /> : <SuppliersView />}
    </div>
  );
}

// =====================================================
// Заказы
// =====================================================
function OrdersView() {
  const { user } = useAuth();
  const userRole = user?.role || 'TEACHER';
  const canApprove = ['DEVELOPER', 'DIRECTOR', 'DEPUTY'].includes(userRole);
  const canCreate = ['DEVELOPER', 'DIRECTOR', 'DEPUTY', 'ADMIN', 'ZAVHOZ'].includes(userRole);
  const canReceive = ['DEVELOPER', 'DIRECTOR', 'ADMIN', 'ZAVHOZ'].includes(userRole);

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [viewOrder, setViewOrder] = useState<PurchaseOrder | null>(null);

  // Фильтры
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Модалы действий
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionOrder, setActionOrder] = useState<PurchaseOrder | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Модал удаления
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState<PurchaseOrder | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Модал приёмки
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [receiveOrder, setReceiveOrderState] = useState<PurchaseOrder | null>(null);
  const [receiveNote, setReceiveNote] = useState('');

  const currency = new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterType) params.set('type', filterType);
      if (searchQuery) params.set('search', searchQuery);
      const data = await api.get(`/api/procurement/orders?${params.toString()}`);
      setOrders(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error('Ошибка загрузки заказов');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType, searchQuery]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCreate = (type: 'PLANNED' | 'OPERATIONAL') => {
    setEditingOrder({ type } as any);
    setIsModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    setEditingOrder(null);
    fetchOrders();
  };

  // Workflow actions
  const performAction = async (orderId: number, action: string, body?: any) => {
    setActionLoading(true);
    try {
      await api.post(`/api/procurement/orders/${orderId}/${action}`, body || {});
      toast.success('Действие выполнено');
      fetchOrders();
      setRejectModalOpen(false);
      setRejectReason('');
      setActionOrder(null);
    } catch (error: any) {
      toast.error(error?.message || 'Ошибка');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReceiveSubmit = async () => {
    if (!receiveOrder) return;
    setActionLoading(true);
    try {
      const result = await api.post(`/api/procurement/orders/${receiveOrder.id}/receive`, {
        receiveNote,
      });
      toast.success('Товар принят на склад!');
      if (result?.warnings?.length > 0) {
        result.warnings.forEach((w: string) => toast.warning(w, { duration: 5000 }));
      }
      if (result?.receivedItems?.length > 0) {
        const summary = result.receivedItems.map((i: any) => `${i.itemName}: +${i.received}`).join(', ');
        toast.info(`Добавлено на склад: ${summary}`, { duration: 5000 });
      }
      setReceiveModalOpen(false);
      setReceiveOrderState(null);
      setReceiveNote('');
      fetchOrders();
    } catch (error: any) {
      toast.error(error?.message || 'Ошибка приёмки');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingOrder) return;
    setDeleting(true);
    try {
      await api.delete(`/api/procurement/orders/${deletingOrder.id}`);
      toast.success('Заказ удалён');
      setDeleteModalOpen(false);
      setDeletingOrder(null);
      fetchOrders();
    } catch (error: any) {
      toast.error(error?.message || 'Ошибка удаления');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: PurchaseOrderStatus) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${purchaseOrderStatusColors[status] || 'bg-gray-100'}`}>
      {purchaseOrderStatusLabels[status] || status}
    </span>
  );

  // Кнопки действий для каждого заказа
  const renderActions = (order: PurchaseOrder) => {
    const actions: JSX.Element[] = [];

    // Просмотр — всем
    actions.push(
      <Button key="view" variant="outline" size="sm" onClick={() => setViewOrder(order)}>
        <Eye className="h-4 w-4" />
      </Button>
    );

    // DRAFT -> Отправить на одобрение
    if (order.status === 'DRAFT' && canCreate) {
      actions.push(
        <Button key="submit" variant="outline" size="sm" className="text-blue-600" onClick={() => performAction(order.id, 'submit')}>
          <Send className="h-4 w-4 mr-1" /> На одобрение
        </Button>
      );
    }

    // PENDING -> Одобрить / Отклонить (только DIRECTOR/DEPUTY)
    if (order.status === 'PENDING' && canApprove) {
      actions.push(
        <Button key="approve" variant="outline" size="sm" className="text-green-600" onClick={() => performAction(order.id, 'approve')}>
          <Check className="h-4 w-4 mr-1" /> Одобрить
        </Button>
      );
      actions.push(
        <Button key="reject" variant="outline" size="sm" className="text-red-600" onClick={() => { setActionOrder(order); setRejectModalOpen(true); }}>
          <X className="h-4 w-4 mr-1" /> Отклонить
        </Button>
      );
    }

    // APPROVED -> Заказано
    if (order.status === 'APPROVED' && canCreate) {
      actions.push(
        <Button key="order" variant="outline" size="sm" className="text-blue-600" onClick={() => performAction(order.id, 'order')}>
          <Truck className="h-4 w-4 mr-1" /> Заказано
        </Button>
      );
    }

    // ORDERED -> Доставлено
    if ((order.status === 'ORDERED' || order.status === 'PARTIALLY_DELIVERED') && canCreate) {
      actions.push(
        <Button key="deliver" variant="outline" size="sm" className="text-indigo-600" onClick={() => performAction(order.id, 'deliver')}>
          <Package className="h-4 w-4 mr-1" /> Доставлено
        </Button>
      );
    }

    // DELIVERED/ORDERED/PARTIALLY_DELIVERED -> Принять на склад
    if (['DELIVERED', 'ORDERED', 'PARTIALLY_DELIVERED'].includes(order.status) && canReceive) {
      actions.push(
        <Button key="receive" variant="outline" size="sm" className="text-emerald-600" onClick={() => { setReceiveOrderState(order); setReceiveModalOpen(true); }}>
          <ClipboardCheck className="h-4 w-4 mr-1" /> Принять
        </Button>
      );
    }

    // Редактировать (DRAFT, REJECTED)
    if ((order.status === 'DRAFT' || order.status === 'REJECTED') && canCreate) {
      actions.push(
        <Button key="edit" variant="outline" size="sm" onClick={() => { setEditingOrder(order); setIsModalOpen(true); }}>
          <Edit className="h-4 w-4" />
        </Button>
      );
    }

    // Отменить (не RECEIVED и не CANCELLED)
    if (!['RECEIVED', 'CANCELLED'].includes(order.status) && canApprove) {
      actions.push(
        <Button key="cancel" variant="ghost" size="sm" className="text-gray-500" onClick={() => performAction(order.id, 'cancel')}>
          <Ban className="h-4 w-4" />
        </Button>
      );
    }

    // Удалить (DRAFT, CANCELLED)
    if ((order.status === 'DRAFT' || order.status === 'CANCELLED') && ['DEVELOPER', 'DIRECTOR', 'ADMIN'].includes(userRole)) {
      actions.push(
        <Button key="delete" variant="ghost" size="sm" className="text-red-500" onClick={() => { setDeletingOrder(order); setDeleteModalOpen(true); }}>
          <Trash2 className="h-4 w-4" />
        </Button>
      );
    }

    return <div className="flex gap-1 flex-wrap">{actions}</div>;
  };

  return (
    <>
      {/* Фильтры */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск по номеру, названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
          <option value="">Все статусы</option>
          {Object.entries(purchaseOrderStatusLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
          <option value="">Все типы</option>
          <option value="PLANNED">Плановая</option>
          <option value="OPERATIONAL">Оперативная</option>
        </select>

        {canCreate && (
          <div className="flex gap-2">
            <Button onClick={() => handleCreate('PLANNED')} className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="mr-2 h-4 w-4" /> Плановая закупка
            </Button>
            <Button onClick={() => handleCreate('OPERATIONAL')} className="bg-red-600 hover:bg-red-700">
              <PlusCircle className="mr-2 h-4 w-4" /> Оперативная
            </Button>
          </div>
        )}
      </div>

      {/* Таблица заказов */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">Загрузка...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-10 text-gray-400">Заказов пока нет</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3">№</th>
                <th className="text-left p-3">Тип</th>
                <th className="text-left p-3">Название</th>
                <th className="text-left p-3">Поставщик</th>
                <th className="text-left p-3">Дата</th>
                <th className="text-right p-3">Сумма</th>
                <th className="text-left p-3">Приоритет</th>
                <th className="text-left p-3">Статус</th>
                <th className="text-left p-3">Создатель</th>
                <th className="text-left p-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{order.orderNumber}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${purchaseOrderTypeColors[order.type]}`}>
                      {purchaseOrderTypeLabels[order.type]}
                    </span>
                  </td>
                  <td className="p-3 font-medium max-w-[200px] truncate">{order.title}</td>
                  <td className="p-3">{order.supplier?.name || '—'}</td>
                  <td className="p-3 text-xs whitespace-nowrap">{new Date(order.orderDate).toLocaleDateString('ru-RU')}</td>
                  <td className="p-3 text-right whitespace-nowrap font-medium">{currency.format(order.totalAmount)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${priorityColors[order.priority] || 'bg-gray-100'}`}>
                      {priorityLabels[order.priority] || 'Обычный'}
                    </span>
                  </td>
                  <td className="p-3">{getStatusBadge(order.status)}</td>
                  <td className="p-3 text-xs">
                    {order.createdBy ? `${order.createdBy.firstName} ${order.createdBy.lastName}` : '—'}
                  </td>
                  <td className="p-3">{renderActions(order)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Модал создания/редактирования */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingOrder(null); }}
        title={editingOrder?.id ? `Редактировать заказ ${editingOrder.orderNumber}` : 'Новый заказ на закупку'}
      >
        <PurchaseOrderForm
          initialData={editingOrder}
          onSuccess={handleFormSuccess}
          onCancel={() => { setIsModalOpen(false); setEditingOrder(null); }}
        />
      </Modal>

      {/* Модал просмотра деталей */}
      <Modal isOpen={!!viewOrder} onClose={() => setViewOrder(null)} title={viewOrder ? `Заказ ${viewOrder.orderNumber}` : ''}>
        {viewOrder && (
          <div className="space-y-4 p-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Тип:</span> <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${purchaseOrderTypeColors[viewOrder.type]}`}>{purchaseOrderTypeLabels[viewOrder.type]}</span></div>
              <div><span className="text-gray-500">Статус:</span> {getStatusBadge(viewOrder.status)}</div>
              <div><span className="text-gray-500">Приоритет:</span> <span className={`ml-2 px-2 py-0.5 rounded text-xs ${priorityColors[viewOrder.priority]}`}>{priorityLabels[viewOrder.priority]}</span></div>
              <div><span className="text-gray-500">Сумма:</span> <strong>{currency.format(viewOrder.totalAmount)}</strong></div>
              <div><span className="text-gray-500">Поставщик:</span> {viewOrder.supplier?.name}</div>
              <div><span className="text-gray-500">Дата заказа:</span> {new Date(viewOrder.orderDate).toLocaleDateString('ru-RU')}</div>
              {viewOrder.expectedDeliveryDate && <div><span className="text-gray-500">Ожид. доставка:</span> {new Date(viewOrder.expectedDeliveryDate).toLocaleDateString('ru-RU')}</div>}
              {viewOrder.actualDeliveryDate && <div><span className="text-gray-500">Факт. доставка:</span> {new Date(viewOrder.actualDeliveryDate).toLocaleDateString('ru-RU')}</div>}
              {viewOrder.budgetSource && <div><span className="text-gray-500">Источник:</span> {viewOrder.budgetSource}</div>}
              <div><span className="text-gray-500">Создатель:</span> {viewOrder.createdBy ? `${viewOrder.createdBy.firstName} ${viewOrder.createdBy.lastName}` : '—'}</div>
              {viewOrder.approvedBy && <div><span className="text-gray-500">Одобрил:</span> {viewOrder.approvedBy.firstName} {viewOrder.approvedBy.lastName} ({viewOrder.approvedAt ? new Date(viewOrder.approvedAt).toLocaleDateString('ru-RU') : ''})</div>}
              {viewOrder.receivedBy && <div><span className="text-gray-500">Принял:</span> {viewOrder.receivedBy.firstName} {viewOrder.receivedBy.lastName}</div>}
            </div>
            {viewOrder.description && <div className="text-sm"><span className="text-gray-500">Обоснование:</span> {viewOrder.description}</div>}
            {viewOrder.rejectionReason && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700"><strong>Причина отклонения:</strong> {viewOrder.rejectionReason}</div>}
            {viewOrder.receiveNote && <div className="text-sm"><span className="text-gray-500">Примечание приёмки:</span> {viewOrder.receiveNote}</div>}
            
            {/* Позиции заказа */}
            <div className="border-t pt-3">
              <h4 className="font-medium mb-2">Позиции заказа ({viewOrder.items?.length || 0})</h4>
              <table className="w-full text-sm border-collapse">
                <thead><tr className="border-b bg-gray-50"><th className="p-2 text-left">Наименование</th><th className="p-2 text-right">Кол-во</th><th className="p-2 text-right">Принято</th><th className="p-2 text-left">Ед.</th><th className="p-2 text-right">Цена</th><th className="p-2 text-right">Сумма</th></tr></thead>
                <tbody>
                  {viewOrder.items?.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-2">{item.name}</td>
                      <td className="p-2 text-right">{item.quantity}</td>
                      <td className="p-2 text-right">{item.receivedQuantity != null ? item.receivedQuantity : '—'}</td>
                      <td className="p-2">{item.unit}</td>
                      <td className="p-2 text-right">{currency.format(item.price)}</td>
                      <td className="p-2 text-right font-medium">{currency.format(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="border-t-2 font-bold"><td colSpan={5} className="p-2 text-right">Итого:</td><td className="p-2 text-right">{currency.format(viewOrder.totalAmount)}</td></tr></tfoot>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Модал отклонения */}
      <Modal isOpen={rejectModalOpen} onClose={() => { setRejectModalOpen(false); setRejectReason(''); setActionOrder(null); }} title="Отклонить закупку">
        <div className="space-y-4 p-2">
          <p className="text-sm text-gray-600">Укажите причину отклонения для заказа <strong>{actionOrder?.orderNumber}</strong>:</p>
          <textarea
            className="w-full p-2 border rounded text-sm"
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Причина отклонения..."
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectModalOpen(false)} disabled={actionLoading}>Отмена</Button>
            <Button variant="destructive" onClick={() => actionOrder && performAction(actionOrder.id, 'reject', { reason: rejectReason })} disabled={actionLoading || rejectReason.length < 3}>
              {actionLoading ? 'Отклонение...' : 'Отклонить'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Модал приёмки на склад */}
      <Modal isOpen={receiveModalOpen} onClose={() => { setReceiveModalOpen(false); setReceiveNote(''); setReceiveOrderState(null); }} title="Приёмка товара на склад">
        {receiveOrder && (
          <div className="space-y-4 p-2">
            <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
              <p className="font-medium text-green-800 mb-2">Заказ {receiveOrder.orderNumber}: {receiveOrder.title}</p>
              <p className="text-green-700">Следующие товары будут добавлены на склад:</p>
            </div>
            <table className="w-full text-sm border-collapse">
              <thead><tr className="border-b bg-gray-50"><th className="p-2 text-left">Товар</th><th className="p-2 text-right">Кол-во</th><th className="p-2 text-left">Ед.</th></tr></thead>
              <tbody>
                {receiveOrder.items?.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">{item.name}</td>
                    <td className="p-2 text-right font-medium">{item.quantity}</td>
                    <td className="p-2">{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div>
              <label className="block text-sm font-medium mb-1">Примечание (необязательно)</label>
              <textarea className="w-full p-2 border rounded text-sm" rows={2} value={receiveNote} onChange={(e) => setReceiveNote(e.target.value)} placeholder="Примечание при приёмке..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReceiveModalOpen(false)} disabled={actionLoading}>Отмена</Button>
              <Button onClick={handleReceiveSubmit} disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700">
                {actionLoading ? 'Приёмка...' : 'Принять на склад'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Модал удаления */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Подтверждение удаления">
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800">Внимание!</h4>
              <p className="text-red-700 text-sm mt-1">Вы собираетесь удалить заказ на закупку. Это действие нельзя отменить.</p>
            </div>
          </div>
          {deletingOrder && (
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p><strong>№:</strong> {deletingOrder.orderNumber}</p>
              <p><strong>Название:</strong> {deletingOrder.title}</p>
              <p><strong>Сумма:</strong> {currency.format(deletingOrder.totalAmount)}</p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>Отмена</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? 'Удаление...' : 'Удалить'}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// =====================================================
// Поставщики
// =====================================================
function SuppliersView() {
  const { user } = useAuth();
  const userRole = user?.role || 'TEACHER';
  const canManage = ['DEVELOPER', 'DIRECTOR', 'ADMIN', 'ZAVHOZ'].includes(userRole);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/procurement/suppliers');
      setSuppliers(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Ошибка загрузки поставщиков');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const handleDelete = async () => {
    if (!deletingSupplier) return;
    setDeleting(true);
    try {
      await api.delete(`/api/procurement/suppliers/${deletingSupplier.id}`);
      toast.success('Поставщик удалён');
      setDeleteModalOpen(false);
      setDeletingSupplier(null);
      fetchSuppliers();
    } catch (error: any) {
      toast.error(error?.message || 'Ошибка удаления');
    } finally {
      setDeleting(false);
    }
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
    fetchSuppliers();
    toast.success(editingSupplier ? 'Поставщик обновлён' : 'Поставщик добавлен');
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        {canManage && (
          <Button onClick={() => { setEditingSupplier(null); setIsModalOpen(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" /> Добавить поставщика
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Загрузка...</div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-10 text-gray-400">Поставщиков пока нет</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3">Название</th>
                <th className="text-left p-3">Контакты</th>
                <th className="text-left p-3">Телефон</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">ИНН</th>
                <th className="text-center p-3">Заказов</th>
                <th className="text-center p-3">Статус</th>
                {canManage && <th className="text-left p-3">Действия</th>}
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3 text-sm">{s.contactInfo || '—'}</td>
                  <td className="p-3 text-sm">{s.phone || '—'}</td>
                  <td className="p-3 text-sm">{s.email || '—'}</td>
                  <td className="p-3 text-sm font-mono">{s.inn || '—'}</td>
                  <td className="p-3 text-center">{s._count?.orders ?? 0}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${s.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                      {s.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  {canManage && (
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => { setEditingSupplier(s); setIsModalOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => { setDeletingSupplier(s); setDeleteModalOpen(true); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSupplier ? 'Редактировать поставщика' : 'Новый поставщик'}>
        <SupplierForm initialData={editingSupplier} onSuccess={handleFormSuccess} onCancel={() => setIsModalOpen(false)} />
      </Modal>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Подтверждение удаления">
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800">Внимание!</h4>
              <p className="text-red-700 text-sm mt-1">Удаление поставщика невозможно если у него есть заказы.</p>
            </div>
          </div>
          {deletingSupplier && (
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p><strong>Название:</strong> {deletingSupplier.name}</p>
              <p><strong>Контакты:</strong> {deletingSupplier.contactInfo || '—'}</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>Отмена</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? 'Удаление...' : 'Удалить'}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
