import { useState } from 'react';
import { toast } from 'sonner';
import { useApi } from '../hooks/useApi';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { Button } from '../components/ui/button';
import { Modal } from '../components/Modal';
import { PlusCircle, ShoppingCart, Users } from 'lucide-react';
import { PurchaseOrder, Supplier } from '../types/procurement';
import { PurchaseOrderForm } from '../components/forms/PurchaseOrderForm';
import { SupplierForm } from '../components/forms/SupplierForm';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);

  const handleCreate = () => {
    setEditingOrder(null);
    setIsModalOpen(true);
  };

  const handleEdit = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setIsModalOpen(true);
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
      render: (row) => `${row.totalAmount.toLocaleString('ru-RU')} ₽`
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
        <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
          Просмотр
        </Button>
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
    </>
  );
}

function SuppliersView() {
  const { data, total, page, setPage, fetchData } = useApi<Supplier>({
    url: '/api/procurement/suppliers',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const handleCreate = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
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
        <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
          Редактировать
        </Button>
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
    </>
  );
}
