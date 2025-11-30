import { useState } from 'react';
import { toast } from 'sonner';
import { useApi } from '../hooks/useApi';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { Button } from '../components/ui/button';
import { Modal } from '../components/Modal';
import { PlusCircle, ShoppingCart, Users, AlertTriangle } from 'lucide-react';
import { PurchaseOrder, Supplier } from '../types/procurement';
import { PurchaseOrderForm } from '../components/forms/PurchaseOrderForm';
import { SupplierForm } from '../components/forms/SupplierForm';
import { api } from '../lib/api';

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

function OrdersView() {
  const { data, total, page, setPage, fetchData } = useApi<PurchaseOrder>({
    url: '/api/procurement/orders',
  });
  const currency = new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  
  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState<PurchaseOrder | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleCreate = () => {
    setEditingOrder(null);
    setIsModalOpen(true);
  };

  const handleEdit = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setIsModalOpen(true);
  };

  const openDeleteModal = (order: PurchaseOrder) => {
    setDeletingOrder(order);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingOrder) return;
    setDeleting(true);
    try {
      await api.delete(`/api/procurement/orders/${deletingOrder.id}`);
      toast.success('Заказ удален');
      setDeleteModalOpen(false);
      setDeletingOrder(null);
      fetchData();
    } catch (error: any) {
      toast.error('Ошибка удаления', { description: error?.message });
    } finally {
      setDeleting(false);
    }
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    fetchData();
    toast.success(editingOrder ? 'Заказ обновлен' : 'Заказ создан');
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      DELIVERED: 'bg-green-100 text-green-800',
    };
    const labels: Record<string, string> = {
      PENDING: 'Ожидает',
      APPROVED: 'Утвержден',
      DELIVERED: 'Доставлен',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const columns: Column<PurchaseOrder>[] = [
    { key: 'id', header: 'ID' },
    {
      key: 'supplier',
      header: 'Поставщик',
      render: (row) => row.supplier?.name || `ID: ${row.supplierId}`
    },
    {
      key: 'orderDate',
      header: 'Дата заказа',
      render: (row) => new Date(row.orderDate).toLocaleDateString('ru-RU')
    },
    {
      key: 'deliveryDate',
      header: 'Дата доставки',
      render: (row) => row.deliveryDate ? new Date(row.deliveryDate).toLocaleDateString('ru-RU') : '—'
    },
    {
      key: 'totalAmount',
      header: 'Сумма',
      render: (row) => currency.format(row.totalAmount)
    },
    {
      key: 'status',
      header: 'Статус',
      render: (row) => getStatusBadge(row.status)
    },
    {
      key: 'actions',
      header: 'Действия',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
            Просмотр
          </Button>
          <Button variant="destructive" size="sm" onClick={() => openDeleteModal(row)}>
            Удалить
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" /> Создать заказ
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        page={page}
        pageSize={10}
        total={total}
        onPageChange={setPage}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingOrder ? 'Просмотр заказа' : 'Новый заказ'}
      >
        <PurchaseOrderForm
          initialData={editingOrder}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Подтверждение удаления">
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800">Внимание!</h4>
              <p className="text-red-700 text-sm mt-1">
                Вы собираетесь удалить заказ на закупку. Это действие нельзя отменить.
              </p>
            </div>
          </div>
          {deletingOrder && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p><strong>ID:</strong> {deletingOrder.id}</p>
              <p><strong>Поставщик:</strong> {deletingOrder.supplier?.name || `ID: ${deletingOrder.supplierId}`}</p>
              <p><strong>Сумма:</strong> {currency.format(deletingOrder.totalAmount)}</p>
              <p><strong>Статус:</strong> {getStatusBadge(deletingOrder.status)}</p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function SuppliersView() {
  const { data, total, page, setPage, fetchData } = useApi<Supplier>({
    url: '/api/procurement/suppliers',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleCreate = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const openDeleteModal = (supplier: Supplier) => {
    setDeletingSupplier(supplier);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingSupplier) return;
    setDeleting(true);
    try {
      await api.delete(`/api/procurement/suppliers/${deletingSupplier.id}`);
      toast.success('Поставщик удален');
      setDeleteModalOpen(false);
      setDeletingSupplier(null);
      fetchData();
    } catch (error: any) {
      toast.error('Ошибка удаления', { description: error?.message });
    } finally {
      setDeleting(false);
    }
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    fetchData();
    toast.success(editingSupplier ? 'Поставщик обновлен' : 'Поставщик добавлен');
  };

  const columns: Column<Supplier>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Название' },
    { key: 'contactInfo', header: 'Контакты' },
    {
      key: 'createdAt',
      header: 'Добавлен',
      render: (row) => new Date(row.createdAt).toLocaleDateString('ru-RU')
    },
    {
      key: 'actions',
      header: 'Действия',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
            Редактировать
          </Button>
          <Button variant="destructive" size="sm" onClick={() => openDeleteModal(row)}>
            Удалить
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" /> Добавить поставщика
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        page={page}
        pageSize={10}
        total={total}
        onPageChange={setPage}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? 'Редактировать поставщика' : 'Новый поставщик'}
      >
        <SupplierForm
          initialData={editingSupplier}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Подтверждение удаления">
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800">Внимание!</h4>
              <p className="text-red-700 text-sm mt-1">
                Вы собираетесь удалить поставщика. Это действие нельзя отменить.
                Если у поставщика есть связанные заказы, удаление может не сработать.
              </p>
            </div>
          </div>
          {deletingSupplier && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p><strong>Название:</strong> {deletingSupplier.name}</p>
              <p><strong>Контакты:</strong> {deletingSupplier.contactInfo || '—'}</p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
