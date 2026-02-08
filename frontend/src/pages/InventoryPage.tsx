// src/pages/InventoryPage.tsx
import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/Card';
import { Button } from '../components/ui/button';
import { Modal } from '../components/Modal';
import { Input } from '../components/ui/input';
import { ShoppingListModal } from '../components/modals/ShoppingListModal';
import { 
  Item, 
  ShoppingListItem, 
  InventoryType,
  InventoryTransaction,
  InventoryTransactionType,
  inventoryTypeLabels,
  inventoryTypeColors,
  transactionTypeLabels,
  transactionTypeColors,
} from '../types/inventory';
import { api } from '../lib/api';
import { PlusCircle, AlertTriangle, Apple, Package, Archive, Pencil, History, ArrowDownCircle, ArrowUpCircle, Trash2, BarChart3 } from 'lucide-react';

type FilterType = 'ALL' | InventoryType;

export default function InventoryPage() {
  const { data: items, loading, fetchData } = useApi<Item>({ url: '/api/inventory' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: '',
    expiryDate: '',
    type: 'FOOD' as InventoryType,
    minQuantity: '',
  });
  const [saving, setSaving] = useState(false);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[] | null>(null);
  
  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Transaction history modal
  const [transactionsModalOpen, setTransactionsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState<Item | null>(null);

  // Write-off modal
  const [writeOffModalOpen, setWriteOffModalOpen] = useState(false);
  const [writeOffItem, setWriteOffItem] = useState<Item | null>(null);
  const [writeOffData, setWriteOffData] = useState({ quantity: '', reason: '' });
  const [writingOff, setWritingOff] = useState(false);

  // Receive (incoming) modal
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [receiveItem, setReceiveItem] = useState<Item | null>(null);
  const [receiveData, setReceiveData] = useState({ quantity: '', reason: '' });
  const [receiving, setReceiving] = useState(false);

  // All transactions log tab
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [allTransactions, setAllTransactions] = useState<InventoryTransaction[]>([]);
  const [allTransactionsLoading, setAllTransactionsLoading] = useState(false);

  // Filter items by type
  const filteredItems = useMemo(() => {
    if (filterType === 'ALL') return items;
    return items.filter((item: any) => item.type === filterType);
  }, [items, filterType]);

  // Stats for filter tabs
  const stats = useMemo(() => ({
    all: items.length,
    food: items.filter((item: any) => item.type === 'FOOD').length,
    household: items.filter((item: any) => item.type === 'HOUSEHOLD').length,
    stationery: items.filter((item: any) => item.type === 'STATIONERY').length,
  }), [items]);

  const getExpiryClass = (expiryDate?: string) => {
    if (!expiryDate) return '';
    const daysLeft = (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    if (daysLeft < 0) return 'bg-red-200 text-red-800';
    if (daysLeft < 7) return 'bg-yellow-200 text-yellow-800';
    return '';
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ name: '', quantity: '', unit: '', expiryDate: '', type: 'FOOD', minQuantity: '' });
    setIsItemModalOpen(true);
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: String(item.quantity),
      unit: item.unit,
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
      type: (item as any).type || 'FOOD',
      minQuantity: String((item as any).minQuantity || 0),
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

  // Загрузить историю конкретного товара
  const handleShowHistory = async (item: Item) => {
    setSelectedItemForHistory(item);
    setTransactionsLoading(true);
    setTransactionsModalOpen(true);
    try {
      const res = await api.get(`/api/inventory/${item.id}/transactions`);
      const resolved = Array.isArray(res)
        ? res
        : Array.isArray((res as any)?.items)
          ? (res as any).items
          : Array.isArray((res as any)?.data)
            ? (res as any).data
            : [];
      setTransactions(resolved as InventoryTransaction[]);
    } catch (error: any) {
      toast.error('Ошибка загрузки истории', { description: error?.message });
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Загрузить все транзакции
  const handleShowAllTransactions = async () => {
    setShowAllTransactions(true);
    setAllTransactionsLoading(true);
    try {
      const res = await api.get('/api/inventory/transactions?limit=200');
      const resolved = Array.isArray(res)
        ? res
        : Array.isArray((res as any)?.items)
          ? (res as any).items
          : Array.isArray((res as any)?.data)
            ? (res as any).data
            : [];
      setAllTransactions(resolved as InventoryTransaction[]);
    } catch (error: any) {
      toast.error('Ошибка загрузки журнала', { description: error?.message });
    } finally {
      setAllTransactionsLoading(false);
    }
  };

  // Списание
  const handleWriteOff = async () => {
    if (!writeOffItem) return;
    setWritingOff(true);
    try {
      await api.post(`/api/inventory/${writeOffItem.id}/write-off`, {
        quantity: parseFloat(writeOffData.quantity),
        reason: writeOffData.reason || 'Списание',
      });
      toast.success('Товар списан');
      setWriteOffModalOpen(false);
      setWriteOffItem(null);
      setWriteOffData({ quantity: '', reason: '' });
      fetchData();
    } catch (error: any) {
      toast.error('Ошибка списания', { description: error?.response?.data?.message || error?.message });
    } finally {
      setWritingOff(false);
    }
  };

  // Приёмка
  const handleReceive = async () => {
    if (!receiveItem) return;
    setReceiving(true);
    try {
      await api.post(`/api/inventory/${receiveItem.id}/receive`, {
        quantity: parseFloat(receiveData.quantity),
        reason: receiveData.reason || 'Приёмка товара',
      });
      toast.success('Товар принят');
      setReceiveModalOpen(false);
      setReceiveItem(null);
      setReceiveData({ quantity: '', reason: '' });
      fetchData();
    } catch (error: any) {
      toast.error('Ошибка приёмки', { description: error?.response?.data?.message || error?.message });
    } finally {
      setReceiving(false);
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
        expiryDate: formData.expiryDate || null,
        type: formData.type,
        minQuantity: formData.minQuantity ? parseFloat(formData.minQuantity) : 0,
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Archive className="h-6 w-6" />
          Складской учет
        </h1>
        <div className="flex gap-2">
          <Button onClick={handleCreate}>
            <PlusCircle className="mr-2 h-4 w-4" /> Добавить товар
          </Button>
          <Button variant="outline" onClick={handleShowAllTransactions}>
            <History className="mr-2 h-4 w-4" /> Журнал движений
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>Сформировать список закупок</Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="grid grid-cols-4 gap-4">
        <div
          className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${filterType === 'ALL' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setFilterType('ALL')}
        >
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-500">Все товары</span>
          </div>
          <p className="text-2xl font-bold mt-1">{stats.all}</p>
        </div>
        <div
          className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${filterType === 'FOOD' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setFilterType('FOOD')}
        >
          <div className="flex items-center gap-2">
            <Apple className="h-5 w-5 text-green-600" />
            <span className="text-sm text-gray-500">Продукты питания</span>
          </div>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.food}</p>
        </div>
        <div
          className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${filterType === 'HOUSEHOLD' ? 'ring-2 ring-orange-500' : ''}`}
          onClick={() => setFilterType('HOUSEHOLD')}
        >
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-orange-600" />
            <span className="text-sm text-gray-500">Хоз. товары</span>
          </div>
          <p className="text-2xl font-bold text-orange-600 mt-1">{stats.household}</p>
        </div>
        <div
          className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${filterType === 'STATIONERY' ? 'ring-2 ring-purple-500' : ''}`}
          onClick={() => setFilterType('STATIONERY')}
        >
          <div className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-purple-600" />
            <span className="text-sm text-gray-500">Канц. товары</span>
          </div>
          <p className="text-2xl font-bold text-purple-600 mt-1">{stats.stationery}</p>
        </div>
      </div>

      <Card>
        <h2 className="text-xl font-semibold p-4 flex items-center gap-2">
          {filterType === 'FOOD' && <Apple className="h-5 w-5 text-green-600" />}
          {filterType === 'HOUSEHOLD' && <Package className="h-5 w-5 text-orange-600" />}
          {filterType === 'STATIONERY' && <Pencil className="h-5 w-5 text-purple-600" />}
          {filterType === 'ALL' ? 'Все остатки' : inventoryTypeLabels[filterType]}
        </h2>
        {loading ? (
          <div className="p-4">Загрузка...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {filterType === 'ALL' ? 'Нет товаров на складе' : `Нет товаров в категории "${inventoryTypeLabels[filterType]}"`}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Наименование</th>
                <th className="text-left p-2">Тип</th>
                <th className="text-left p-2">Количество</th>
                <th className="text-left p-2">Срок годности</th>
                <th className="text-left p-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item: any) => (
                <tr key={item.id} className={'border-t ' + getExpiryClass(item.expiryDate)}>
                  <td className="p-2">{item.name}</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      item.type === 'FOOD' ? 'bg-green-100 text-green-800' : 
                      item.type === 'HOUSEHOLD' ? 'bg-orange-100 text-orange-800' : 
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {inventoryTypeLabels[item.type as InventoryType] || item.type}
                    </span>
                  </td>
                  <td className="p-2">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="p-2">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '—'}</td>
                  <td className="p-2">
                    <div className="flex gap-1 flex-wrap">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(item)} title="Редактировать">
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setReceiveItem(item); setReceiveData({ quantity: '', reason: '' }); setReceiveModalOpen(true); }} title="Приёмка">
                        <ArrowDownCircle className="h-3 w-3 text-green-600" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setWriteOffItem(item); setWriteOffData({ quantity: '', reason: '' }); setWriteOffModalOpen(true); }} title="Списание">
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleShowHistory(item)} title="История движений">
                        <History className="h-3 w-3 text-blue-600" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => openDeleteModal(item)} title="Удалить">
                        &times;
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
            <label className="block text-sm font-medium mb-1">Тип товара *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as InventoryType })}
              className="w-full p-2 border rounded"
              required
            >
              <option value="FOOD">Продукты питания</option>
              <option value="HOUSEHOLD">Хоз. товары</option>
              <option value="STATIONERY">Канц. товары</option>
            </select>
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
            {formData.type !== 'FOOD' && (
              <p className="text-xs text-gray-500 mt-1">Для хозяйственных и канцелярских товаров срок годности обычно не указывается</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Мин. остаток (для уведомлений)</label>
            <Input
              type="number"
              value={formData.minQuantity}
              onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
              placeholder="0"
              step="0.01"
            />
            <p className="text-xs text-gray-500 mt-1">При снижении остатка ниже этого значения товар будет выделяться</p>
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

      {/* Transaction history modal for specific item */}
      <Modal isOpen={transactionsModalOpen} onClose={() => setTransactionsModalOpen(false)} title={`История движений: ${selectedItemForHistory?.name || ''}`}>
        <div className="p-4">
          {transactionsLoading ? (
            <div className="text-center py-4">Загрузка...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-4 text-gray-500">Нет записей о движениях</div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Дата</th>
                    <th className="text-left p-2">Тип</th>
                    <th className="text-left p-2">Кол-во</th>
                    <th className="text-left p-2">До → После</th>
                    <th className="text-left p-2">Причина</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx: InventoryTransaction) => (
                    <tr key={tx.id} className="border-t">
                      <td className="p-2 whitespace-nowrap">{new Date(tx.createdAt).toLocaleString('ru')}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${transactionTypeColors[tx.type]}`}>
                          {transactionTypeLabels[tx.type]}
                        </span>
                      </td>
                      <td className="p-2 font-mono">
                        <span className={tx.type === 'IN' ? 'text-green-600' : 'text-red-600'}>
                          {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                        </span>
                      </td>
                      <td className="p-2 font-mono text-xs">{tx.quantityBefore} → {tx.quantityAfter}</td>
                      <td className="p-2 text-xs max-w-[200px] truncate" title={tx.reason || ''}>
                        {tx.reason || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* Write-off modal */}
      <Modal isOpen={writeOffModalOpen} onClose={() => setWriteOffModalOpen(false)} title="Списание товара">
        <div className="p-4 space-y-4">
          {writeOffItem && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="font-medium">{writeOffItem.name}</p>
              <p className="text-sm text-gray-600">На складе: <strong>{writeOffItem.quantity} {writeOffItem.unit}</strong></p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Количество для списания *</label>
            <Input
              type="number"
              value={writeOffData.quantity}
              onChange={(e) => setWriteOffData({ ...writeOffData, quantity: e.target.value })}
              placeholder="0"
              step="0.01"
              max={writeOffItem?.quantity}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Причина списания</label>
            <Input
              value={writeOffData.reason}
              onChange={(e) => setWriteOffData({ ...writeOffData, reason: e.target.value })}
              placeholder="Просрочка, порча, и т.п."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setWriteOffModalOpen(false)} disabled={writingOff}>Отмена</Button>
            <Button variant="destructive" onClick={handleWriteOff} disabled={writingOff || !writeOffData.quantity}>
              {writingOff ? 'Списание...' : 'Списать'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Receive (incoming) modal */}
      <Modal isOpen={receiveModalOpen} onClose={() => setReceiveModalOpen(false)} title="Приёмка товара">
        <div className="p-4 space-y-4">
          {receiveItem && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="font-medium">{receiveItem.name}</p>
              <p className="text-sm text-gray-600">Текущий остаток: <strong>{receiveItem.quantity} {receiveItem.unit}</strong></p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Количество прихода *</label>
            <Input
              type="number"
              value={receiveData.quantity}
              onChange={(e) => setReceiveData({ ...receiveData, quantity: e.target.value })}
              placeholder="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Комментарий</label>
            <Input
              value={receiveData.reason}
              onChange={(e) => setReceiveData({ ...receiveData, reason: e.target.value })}
              placeholder="Закупка, поставка и т.п."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setReceiveModalOpen(false)} disabled={receiving}>Отмена</Button>
            <Button onClick={handleReceive} disabled={receiving || !receiveData.quantity}>
              {receiving ? 'Приёмка...' : 'Принять'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* All transactions log modal */}
      <Modal isOpen={showAllTransactions} onClose={() => setShowAllTransactions(false)} title="Журнал движений склада">
        <div className="p-4">
          {allTransactionsLoading ? (
            <div className="text-center py-4">Загрузка...</div>
          ) : allTransactions.length === 0 ? (
            <div className="text-center py-4 text-gray-500">Нет записей о движениях</div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Дата</th>
                    <th className="text-left p-2">Товар</th>
                    <th className="text-left p-2">Тип</th>
                    <th className="text-left p-2">Кол-во</th>
                    <th className="text-left p-2">До → После</th>
                    <th className="text-left p-2">Причина</th>
                    <th className="text-left p-2">Заявка</th>
                    <th className="text-left p-2">Кто</th>
                  </tr>
                </thead>
                <tbody>
                  {allTransactions.map((tx: InventoryTransaction) => (
                    <tr key={tx.id} className="border-t hover:bg-gray-50">
                      <td className="p-2 whitespace-nowrap text-xs">{new Date(tx.createdAt).toLocaleString('ru')}</td>
                      <td className="p-2 font-medium">{tx.inventoryItem?.name || '—'}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${transactionTypeColors[tx.type]}`}>
                          {transactionTypeLabels[tx.type]}
                        </span>
                      </td>
                      <td className="p-2 font-mono">
                        <span className={tx.type === 'IN' ? 'text-green-600' : 'text-red-600'}>
                          {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                        </span>
                      </td>
                      <td className="p-2 font-mono text-xs">{tx.quantityBefore} → {tx.quantityAfter}</td>
                      <td className="p-2 text-xs max-w-[150px] truncate" title={tx.reason || ''}>{tx.reason || '—'}</td>
                      <td className="p-2 text-xs">
                        {tx.maintenanceRequest ? `#${tx.maintenanceRequest.id} ${tx.maintenanceRequest.title}` : '—'}
                      </td>
                      <td className="p-2 text-xs">
                        {tx.performedBy ? `${tx.performedBy.firstName} ${tx.performedBy.lastName}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
