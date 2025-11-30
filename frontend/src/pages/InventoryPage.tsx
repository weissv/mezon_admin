// src/pages/InventoryPage.tsx
import { useState } from 'react';
import { toast } from 'sonner';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/Card';
import { Button } from '../components/ui/button';
import { Modal } from '../components/Modal';
import { Input } from '../components/ui/input';
import { ShoppingListModal } from '../components/modals/ShoppingListModal';
import { Item, ShoppingListItem } from '../types/inventory';
import { api } from '../lib/api';
import { PlusCircle, AlertTriangle } from 'lucide-react';

export default function InventoryPage() {
  const { data: items, loading, fetchData } = useApi<Item>({ url: '/api/inventory' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: '',
    expiryDate: ''
  });
  const [saving, setSaving] = useState(false);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[] | null>(null);
  
  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getExpiryClass = (expiryDate?: string) => {
    if (!expiryDate) return '';
    const daysLeft = (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    if (daysLeft < 0) return 'bg-red-200 text-red-800';
    if (daysLeft < 7) return 'bg-yellow-200 text-yellow-800';
    return '';
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ name: '', quantity: '', unit: '', expiryDate: '' });
    setIsItemModalOpen(true);
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: String(item.quantity),
      unit: item.unit,
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : ''
    });
    setIsItemModalOpen(true);
  };

  const openDeleteModal = (item: Item) => {
    setDeletingItem(item);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await api.delete('/api/inventory/' + deletingItem.id);
      toast.success('Товар удален');
      setDeleteModalOpen(false);
      setDeletingItem(null);
      fetchData();
    } catch (error: any) {
      toast.error('Ошибка удаления', { description: error?.message });
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        expiryDate: formData.expiryDate || null
      };

      if (editingItem) {
        await api.put('/api/inventory/' + editingItem.id, payload);
        toast.success('Товар обновлен');
      } else {
        await api.post('/api/inventory', payload);
        toast.success('Товар добавлен');
      }
      setIsItemModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Ошибка сохранения', { description: error?.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Складской учет</h1>
        <div className="flex gap-2">
          <Button onClick={handleCreate}>
            <PlusCircle className="mr-2 h-4 w-4" /> Добавить товар
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>Сформировать список закупок</Button>
        </div>
      </div>

      <Card>
        <h2 className="text-xl font-semibold p-4">Текущие остатки</h2>
        {loading ? (
          <div className="p-4">Загрузка...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Наименование</th>
                <th className="text-left p-2">Количество</th>
                <th className="text-left p-2">Срок годности</th>
                <th className="text-left p-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className={'border-t ' + getExpiryClass(item.expiryDate)}>
                  <td className="p-2">{item.name}</td>
                  <td className="p-2">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="p-2">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                        Изменить
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => openDeleteModal(item)}>
                        Удалить
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {shoppingList && (
        <Card className="mt-6">
          <h2 className="text-xl font-semibold p-4">Список закупок</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Продукт</th>
                <th className="text-left p-2">Требуется</th>
                <th className="text-left p-2">На складе</th>
                <th className="text-left p-2">Нужно закупить</th>
              </tr>
            </thead>
            <tbody>
              {shoppingList
                .filter((item) => item.toBuy > 0)
                .map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-2">{item.name}</td>
                    <td className="p-2">
                      {item.requiredQty.toFixed(2)} {item.unit}
                    </td>
                    <td className="p-2">
                      {item.inStock.toFixed(2)} {item.unit}
                    </td>
                    <td className="p-2 font-bold">
                      {item.toBuy.toFixed(2)} {item.unit}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>
      )}

      {isModalOpen && <ShoppingListModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onGenerate={setShoppingList} />}

      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title={editingItem ? 'Редактировать товар' : 'Новый товар'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div>
            <label className="block text-sm font-medium mb-1">Наименование *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Молоко"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Количество *</label>
            <Input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
              placeholder="10"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Единица измерения *</label>
            <Input
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              required
              placeholder="л"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Срок годности</label>
            <Input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsItemModalOpen(false)}
              disabled={saving}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Подтверждение удаления">
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800">Внимание!</h4>
              <p className="text-red-700 text-sm mt-1">
                Вы собираетесь удалить товар со склада. Это действие нельзя отменить.
              </p>
            </div>
          </div>
          {deletingItem && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p><strong>Наименование:</strong> {deletingItem.name}</p>
              <p><strong>Количество:</strong> {deletingItem.quantity} {deletingItem.unit}</p>
              {deletingItem.expiryDate && (
                <p><strong>Срок годности:</strong> {new Date(deletingItem.expiryDate).toLocaleDateString()}</p>
              )}
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
    </div>
  );
}
