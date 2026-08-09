// src/pages/InventoryPage.tsx
import { useState, useMemo } from 'react';
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
  InventoryAudit,
  inventoryTypeLabels,
  transactionTypeLabels,
  transactionTypeColors,
  auditStatusLabels,
  auditStatusColors,
} from '../types/inventory';
import { api } from '../lib/api';
import { 
  PlusCircle, 
  AlertTriangle, 
  Apple, 
  Package, 
  Archive, 
  Pencil, 
  History, 
  ArrowDownCircle, 
  Trash2, 
  Laptop, 
  ClipboardCheck, 
  CheckCircle2, 
  XCircle, 
} from 'lucide-react';
import { EmptyListState } from '../components/ui/EmptyState';
import { LoadingCard } from '../components/ui/LoadingState';
import { PageHeader, PageSection, PageStack, PageToolbar } from '../components/ui/page';

type FilterType = 'ALL' | InventoryType;
const selectClassName = 'mezon-field';
const inventoryBadgeColors: Record<InventoryType, string> = {
  FOOD: 'bg-[rgba(52,199,89,0.14)] text-[var(--macos-green)]',
  HOUSEHOLD: 'bg-[rgba(255,149,0,0.14)] text-[var(--macos-orange)]',
  STATIONERY: 'bg-[rgba(191,90,242,0.14)] text-[var(--macos-purple)]',
  EQUIPMENT: 'bg-[rgba(94,92,230,0.14)] text-[#5e5ce6]',
};

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

  // All transactions log modal
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [allTransactions, setAllTransactions] = useState<InventoryTransaction[]>([]);
  const [allTransactionsLoading, setAllTransactionsLoading] = useState(false);

  // ==================== INVENTORY AUDIT (ИНВЕНТАРИЗАЦИЯ) ====================
  const [auditsListModalOpen, setAuditsListModalOpen] = useState(false);
  const [audits, setAudits] = useState<InventoryAudit[]>([]);
  const [auditsLoading, setAuditsLoading] = useState(false);

  const [activeAuditModalOpen, setActiveAuditModalOpen] = useState(false);
  const [activeAudit, setActiveAudit] = useState<InventoryAudit | null>(null);
  const [activeAuditLoading, setActiveAuditLoading] = useState(false);
  const [auditScopeType, setAuditScopeType] = useState<string>('ALL');
  const [auditNotes, setAuditNotes] = useState('');
  
  // Map of inventoryItemId -> { actualQuantity: string, notes: string }
  const [auditFormItems, setAuditFormItems] = useState<Record<number, { actualQuantity: string; notes: string }>>({});
  const [savingAudit, setSavingAudit] = useState(false);
  const [completingAudit, setCompletingAudit] = useState(false);

  // Filter items by type
  const filteredItems = useMemo(() => {
    if (filterType === 'ALL') return items;
    return items.filter((item: any) => item.type === filterType);
  }, [items, filterType]);

  // Stats for filter cards
  const stats = useMemo(() => ({
    all: items.length,
    food: items.filter((item: any) => item.type === 'FOOD').length,
    household: items.filter((item: any) => item.type === 'HOUSEHOLD').length,
    stationery: items.filter((item: any) => item.type === 'STATIONERY').length,
    equipment: items.filter((item: any) => item.type === 'EQUIPMENT').length,
  }), [items]);

  const filterCards = [
    {
      type: 'ALL' as const,
      label: 'Все товары',
      count: stats.all,
      icon: Archive,
      accent: 'text-secondary',
      iconBg: 'bg-[rgba(60,60,67,0.08)]',
      ring: 'ring-macos-blue',
    },
    {
      type: 'FOOD' as const,
      label: 'Продукты питания',
      count: stats.food,
      icon: Apple,
      accent: 'text-[var(--macos-green)]',
      iconBg: 'bg-[rgba(52,199,89,0.14)]',
      ring: 'ring-[var(--macos-green)]',
    },
    {
      type: 'HOUSEHOLD' as const,
      label: 'Хоз. товары',
      count: stats.household,
      icon: Package,
      accent: 'text-[var(--macos-orange)]',
      iconBg: 'bg-[rgba(255,149,0,0.14)]',
      ring: 'ring-[var(--macos-orange)]',
    },
    {
      type: 'STATIONERY' as const,
      label: 'Канц. товары',
      count: stats.stationery,
      icon: Pencil,
      accent: 'text-[var(--macos-purple)]',
      iconBg: 'bg-[rgba(191,90,242,0.14)]',
      ring: 'ring-[var(--macos-purple)]',
    },
    {
      type: 'EQUIPMENT' as const,
      label: 'Техника',
      count: stats.equipment,
      icon: Laptop,
      accent: 'text-[#5e5ce6]',
      iconBg: 'bg-[rgba(94,92,230,0.14)]',
      ring: 'ring-[#5e5ce6]',
    },
  ];

  const getExpiryClass = (expiryDate?: string) => {
    if (!expiryDate) return '';
    const daysLeft = (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    if (daysLeft < 0) return 'bg-[rgba(255,59,48,0.08)]';
    if (daysLeft < 7) return 'bg-[rgba(255,204,0,0.1)]';
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

  // ==================== INVENTORY AUDIT HANDLERS ====================

  const handleOpenAuditsList = async () => {
    setAuditsModalOpen(true);
    setAuditsLoading(true);
    try {
      const res = await api.get('/api/inventory/audits');
      const resolved = Array.isArray(res) ? res : (res as any)?.items || [];
      setAudits(resolved);
    } catch (error: any) {
      toast.error('Ошибка загрузки инвентаризаций', { description: error?.message });
    } finally {
      setAuditsLoading(false);
    }
  };

  const handleStartNewAudit = async () => {
    try {
      const payload: any = {};
      if (auditScopeType !== 'ALL') {
        payload.type = auditScopeType;
      }
      if (auditNotes.trim()) {
        payload.notes = auditNotes;
      }

      const res = await api.post('/api/inventory/audits', payload);
      const audit = res as InventoryAudit;
      toast.success(`Акт инвентаризации ${audit.auditNumber} создан`);
      
      // Load and open active audit
      await handleOpenAuditDetails(audit.id);
    } catch (error: any) {
      toast.error('Ошибка создания акта инвентаризации', { description: error?.response?.data?.message || error?.message });
    }
  };

  const handleOpenAuditDetails = async (auditId: number) => {
    setActiveAuditLoading(true);
    setActiveAuditModalOpen(true);
    try {
      const audit = await api.get(`/api/inventory/audits/${auditId}`) as InventoryAudit;
      setActiveAudit(audit);
      setAuditNotes(audit.notes || '');

      // Initialize form items with actual quantity or expected quantity
      const initialFormState: Record<number, { actualQuantity: string; notes: string }> = {};
      audit.items?.forEach((item) => {
        const actualVal = item.actualQuantity !== undefined && item.actualQuantity !== null
          ? String(item.actualQuantity)
          : String(item.expectedQuantity);
        initialFormState[item.inventoryItemId] = {
          actualQuantity: actualVal,
          notes: item.notes || '',
        };
      });
      setAuditFormItems(initialFormState);
    } catch (error: any) {
      toast.error('Ошибка загрузки детальной информации', { description: error?.message });
    } finally {
      setActiveAuditLoading(false);
    }
  };

  const handleSaveAuditDraft = async () => {
    if (!activeAudit) return;
    setSavingAudit(true);
    try {
      const itemsPayload = Object.entries(auditFormItems).map(([itemId, val]) => ({
        inventoryItemId: Number(itemId),
        actualQuantity: val.actualQuantity !== '' ? parseFloat(val.actualQuantity) : null,
        notes: val.notes || undefined,
      }));

      const updated = await api.put(`/api/inventory/audits/${activeAudit.id}`, {
        notes: auditNotes,
        items: itemsPayload,
      }) as InventoryAudit;

      setActiveAudit(updated);
      toast.success('Черновик сохранён');
    } catch (error: any) {
      toast.error('Ошибка сохранения черновика', { description: error?.message });
    } finally {
      setSavingAudit(false);
    }
  };

  const handleCompleteAudit = async () => {
    if (!activeAudit) return;
    setCompletingAudit(true);
    try {
      // First save draft numbers
      const itemsPayload = Object.entries(auditFormItems).map(([itemId, val]) => ({
        inventoryItemId: Number(itemId),
        actualQuantity: val.actualQuantity !== '' ? parseFloat(val.actualQuantity) : null,
        notes: val.notes || undefined,
      }));

      await api.put(`/api/inventory/audits/${activeAudit.id}`, {
        notes: auditNotes,
        items: itemsPayload,
      });

      // Now complete
      const res = await api.post(`/api/inventory/audits/${activeAudit.id}/complete`) as {
        audit: InventoryAudit;
        summary: { surplusesCount: number; deficitsCount: number; matchedCount: number };
      };

      toast.success(`Инвентаризация #${activeAudit.auditNumber} проведена!`, {
        description: `Совпадений: ${res.summary.matchedCount}, Излишков: ${res.summary.surplusesCount}, Недостач: ${res.summary.deficitsCount}`,
      });

      setActiveAuditModalOpen(false);
      setActiveAudit(null);
      fetchData(); // Refresh stock items
      handleOpenAuditsList(); // Refresh audits list
    } catch (error: any) {
      toast.error('Ошибка проведения инвентаризации', { description: error?.response?.data?.message || error?.message });
    } finally {
      setCompletingAudit(false);
    }
  };

  // Audit variance calculations
  const auditSummaryStats = useMemo(() => {
    if (!activeAudit || !activeAudit.items) return { total: 0, matched: 0, surpluses: 0, deficits: 0 };
    let matched = 0;
    let surpluses = 0;
    let deficits = 0;

    activeAudit.items.forEach((item) => {
      const formVal = auditFormItems[item.inventoryItemId];
      const actualNum = formVal && formVal.actualQuantity !== '' ? parseFloat(formVal.actualQuantity) : item.expectedQuantity;
      const diff = actualNum - item.expectedQuantity;
      if (Math.abs(diff) < 0.001) matched++;
      else if (diff > 0) surpluses++;
      else deficits++;
    });

    return { total: activeAudit.items.length, matched, surpluses, deficits };
  }, [activeAudit, auditFormItems]);

  return (
    <PageStack>
      <PageHeader
        eyebrow="Inventory · склад"
        title="Складской учёт"
        description="Остатки, движения, инвентаризация и закупки по продуктам, технике, хозяйственным и канцелярским товарам."
        icon={<Archive className="h-5 w-5"/>}
        meta={<span className="mezon-badge macos-badge-neutral">{filteredItems.length} позиций</span>}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleCreate}>
              <PlusCircle className="mr-2 h-4 w-4"/> Добавить товар
            </Button>
            <Button variant="outline" onClick={handleOpenAuditsList} className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              <ClipboardCheck className="mr-2 h-4 w-4 text-indigo-600"/> Инвентаризация
            </Button>
            <Button variant="outline" onClick={handleShowAllTransactions}>
              <History className="mr-2 h-4 w-4"/> Журнал движений
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>Сформировать список закупок</Button>
          </div>
        }
      />

      <PageToolbar className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {filterCards.map(({ type, label, count, icon: Icon, accent, iconBg, ring }) => (
          <Card
            key={type}
            className={`p-0 macos-transition ${filterType === type ? `ring-2 ${ring}` : 'hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]'}`}
          >
            <button
              type="button"
              className="flex w-full items-center gap-3 p-4 text-left"
              onClick={() => setFilterType(type)}
            >
              <div className={`rounded-xl p-2 ${iconBg}`}>
                <Icon className={`h-5 w-5 ${accent}`} />
              </div>
              <div>
                <span className="text-sm text-secondary">{label}</span>
                <p className={`mt-1 text-[24px] font-bold tracking-[-0.025em] leading-tight ${type === 'ALL' ? 'text-primary' : accent}`}>{count}</p>
              </div>
            </button>
          </Card>
        ))}
      </PageToolbar>

      <PageSection className="p-0">
        <Card>
          <h2 className="flex items-center gap-2 p-4 text-xl font-semibold text-primary">
            {filterType === 'FOOD' && <Apple className="h-5 w-5 text-[var(--macos-green)]"/>}
            {filterType === 'HOUSEHOLD' && <Package className="h-5 w-5 text-[var(--macos-orange)]"/>}
            {filterType === 'STATIONERY' && <Pencil className="h-5 w-5 text-[var(--macos-purple)]"/>}
            {filterType === 'EQUIPMENT' && <Laptop className="h-5 w-5 text-[#5e5ce6]"/>}
            {filterType === 'ALL' ? 'Все остатки' : inventoryTypeLabels[filterType]}
          </h2>
          {loading ? (
            <LoadingCard message="Загружаем остатки..." height={220} />
          ) : filteredItems.length === 0 ? (
            <EmptyListState
              title={filterType === 'ALL' ? 'Нет товаров на складе' : `Нет товаров в категории «${inventoryTypeLabels[filterType]}»`}
              description="Добавьте первую позицию или переключитесь на другую категорию."
              onAction={handleCreate}
              actionLabel="Добавить товар"
              className="py-10"
            />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[rgba(255,255,255,0.6)] text-secondary">
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
                    <td className="p-2 font-medium">{item.name}</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${inventoryBadgeColors[item.type as InventoryType] || 'bg-gray-100'}`}>
                        {inventoryTypeLabels[item.type as InventoryType] || item.type}
                      </span>
                    </td>
                    <td className="p-2 font-mono">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="p-2">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '—'}</td>
                    <td className="p-2">
                      <div className="flex gap-1 flex-wrap">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(item)} title="Редактировать">
                          <Pencil className="h-3 w-3"/>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setReceiveItem(item); setReceiveData({ quantity: '', reason: '' }); setReceiveModalOpen(true); }} title="Приёмка">
                          <ArrowDownCircle className="h-3 w-3 text-[var(--macos-green)]"/>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setWriteOffItem(item); setWriteOffData({ quantity: '', reason: '' }); setWriteOffModalOpen(true); }} title="Списание">
                          <Trash2 className="h-3 w-3 text-[var(--macos-red)]"/>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleShowHistory(item)} title="История движений">
                          <History className="h-3 w-3 text-macos-blue"/>
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
      </PageSection>

      {shoppingList && (
        <Card className="mt-6">
          <h2 className="p-4 text-xl font-semibold text-primary">Список закупок</h2>
          <table className="w-full text-sm">
            <thead className="bg-[rgba(255,255,255,0.6)] text-secondary">
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

      {/* Item Create / Edit Modal */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title={editingItem ? 'Редактировать товар' : 'Новый товар'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest mb-1">Наименование *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Ноутбук Lenovo / Молоко 3.2%"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest mb-1">Тип товара *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as InventoryType })}
              className={selectClassName}
              required
            >
              <option value="FOOD">Продукты питания</option>
              <option value="HOUSEHOLD">Хоз. товары</option>
              <option value="STATIONERY">Канц. товары</option>
              <option value="EQUIPMENT">Техника</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest mb-1">Количество *</label>
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
            <label className="block text-[11px] font-medium uppercase tracking-widest mb-1">Единица измерения *</label>
            <Input
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              required
              placeholder="шт, кг, л"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest mb-1">Срок годности</label>
            <Input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            />
            {formData.type !== 'FOOD' && (
              <p className="mt-1 text-xs text-secondary">Для техники, хозяйственных и канцелярских товаров срок годности обычно не указывается</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest mb-1">Мин. остаток (для уведомлений)</label>
            <Input
              type="number"
              value={formData.minQuantity}
              onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
              placeholder="0"
              step="0.01"
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
          <div className="flex items-start gap-3 rounded-lg border border-[rgba(255,59,48,0.18)] bg-[rgba(255,59,48,0.08)] p-4">
            <AlertTriangle className="mt-0.5 h-6 w-6 flex-shrink-0 text-[var(--macos-red)]"/>
            <div>
              <h4 className="font-semibold text-[var(--macos-red)]">Внимание!</h4>
              <p className="mt-1 text-sm text-[var(--macos-red)]">
                Вы собираетесь удалить товар со склада. Это действие нельзя отменить.
              </p>
            </div>
          </div>
          {deletingItem && (
            <div className="rounded-lg bg-[rgba(255,255,255,0.58)] p-3">
              <p><strong>Наименование:</strong> {deletingItem.name}</p>
              <p><strong>Количество:</strong> {deletingItem.quantity} {deletingItem.unit}</p>
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
            <div className="py-4 text-center text-secondary">Нет записей о движениях</div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[rgba(255,255,255,0.72)] text-secondary">
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
                        <span className={tx.type === 'IN' ? 'text-[var(--macos-green)]' : 'text-[var(--macos-red)]'}>
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
            <div className="rounded-lg border border-[rgba(255,149,0,0.18)] bg-[rgba(255,149,0,0.1)] p-3">
              <p className="font-medium">{writeOffItem.name}</p>
              <p className="text-sm text-secondary">На складе: <strong>{writeOffItem.quantity} {writeOffItem.unit}</strong></p>
            </div>
          )}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest mb-1">Количество для списания *</label>
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
            <label className="block text-[11px] font-medium uppercase tracking-widest mb-1">Причина списания</label>
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

      {/* Receive modal */}
      <Modal isOpen={receiveModalOpen} onClose={() => setReceiveModalOpen(false)} title="Приёмка товара">
        <div className="p-4 space-y-4">
          {receiveItem && (
            <div className="rounded-lg border border-[rgba(52,199,89,0.18)] bg-[rgba(52,199,89,0.1)] p-3">
              <p className="font-medium">{receiveItem.name}</p>
              <p className="text-sm text-secondary">Текущий остаток: <strong>{receiveItem.quantity} {receiveItem.unit}</strong></p>
            </div>
          )}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest mb-1">Количество прихода *</label>
            <Input
              type="number"
              value={receiveData.quantity}
              onChange={(e) => setReceiveData({ ...receiveData, quantity: e.target.value })}
              placeholder="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest mb-1">Комментарий</label>
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
            <div className="py-4 text-center text-secondary">Нет записей о движениях</div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[rgba(255,255,255,0.72)] text-secondary">
                  <tr>
                    <th className="text-left p-2">Дата</th>
                    <th className="text-left p-2">Товар</th>
                    <th className="text-left p-2">Тип</th>
                    <th className="text-left p-2">Кол-во</th>
                    <th className="text-left p-2">До → После</th>
                    <th className="text-left p-2">Причина</th>
                    <th className="text-left p-2">Кто</th>
                  </tr>
                </thead>
                <tbody>
                  {allTransactions.map((tx: InventoryTransaction) => (
                    <tr key={tx.id} className="border-t hover:bg-[rgba(255,255,255,0.5)]">
                      <td className="p-2 whitespace-nowrap text-xs">{new Date(tx.createdAt).toLocaleString('ru')}</td>
                      <td className="p-2 font-medium">{tx.inventoryItem?.name || '—'}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${transactionTypeColors[tx.type]}`}>
                          {transactionTypeLabels[tx.type]}
                        </span>
                      </td>
                      <td className="p-2 font-mono">
                        <span className={tx.type === 'IN' ? 'text-[var(--macos-green)]' : 'text-[var(--macos-red)]'}>
                          {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                        </span>
                      </td>
                      <td className="p-2 font-mono text-xs">{tx.quantityBefore} → {tx.quantityAfter}</td>
                      <td className="p-2 text-xs max-w-[180px] truncate" title={tx.reason || ''}>{tx.reason || '—'}</td>
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

      {/* ==================== AUDITS LIST MODAL (ИНВЕНТАРИЗАЦИИ) ==================== */}
      <Modal
        isOpen={auditsListModalOpen}
        onClose={() => setAuditsListModalOpen(false)}
        title="Акты инвентаризации склада"
      >
        <div className="p-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
            <div>
              <h3 className="font-semibold text-primary">Инвентаризация и сверка остатков</h3>
              <p className="text-xs text-secondary">Сверка фактического наличия с учётными остатками и авто-формирование актов расхождений.</p>
            </div>
            <div className="flex gap-2 items-center">
              <select
                value={auditScopeType}
                onChange={(e) => setAuditScopeType(e.target.value)}
                className="mezon-field text-xs py-1 px-2"
              >
                <option value="ALL">Все категории</option>
                <option value="FOOD">Продукты питания</option>
                <option value="HOUSEHOLD">Хоз. товары</option>
                <option value="STATIONERY">Канц. товары</option>
                <option value="EQUIPMENT">Техника</option>
              </select>
              <Button onClick={handleStartNewAudit} size="sm">
                <PlusCircle className="mr-1.5 h-3.5 w-3.5"/> Создать инвентаризацию
              </Button>
            </div>
          </div>

          {auditsLoading ? (
            <div className="text-center py-6">Загрузка актов...</div>
          ) : audits.length === 0 ? (
            <div className="text-center py-8 text-secondary">
              <ClipboardCheck className="mx-auto h-10 w-10 text-gray-300 mb-2"/>
              <p className="font-medium text-gray-600">Нет созданных актов инвентаризации</p>
              <p className="text-xs mt-1">Нажмите «Создать инвентаризацию», чтобы начать сверку остатков.</p>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-[rgba(255,255,255,0.72)] text-secondary">
                  <tr>
                    <th className="text-left p-2">Номер акта</th>
                    <th className="text-left p-2">Статус</th>
                    <th className="text-left p-2">Позиций</th>
                    <th className="text-left p-2">Заметки</th>
                    <th className="text-left p-2">Кто проводил</th>
                    <th className="text-left p-2">Дата создания</th>
                    <th className="text-left p-2">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map((audit) => (
                    <tr key={audit.id} className="border-t hover:bg-[rgba(255,255,255,0.5)]">
                      <td className="p-2 font-mono font-medium">{audit.auditNumber}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${auditStatusColors[audit.status]}`}>
                          {auditStatusLabels[audit.status]}
                        </span>
                      </td>
                      <td className="p-2">{audit._count?.items ?? audit.items?.length ?? 0} шт.</td>
                      <td className="p-2 text-xs max-w-[150px] truncate">{audit.notes || '—'}</td>
                      <td className="p-2 text-xs">
                        {audit.performedBy ? `${audit.performedBy.firstName} ${audit.performedBy.lastName}` : '—'}
                      </td>
                      <td className="p-2 text-xs whitespace-nowrap">{new Date(audit.createdAt).toLocaleDateString('ru')}</td>
                      <td className="p-2">
                        <Button
                          variant={audit.status === 'DRAFT' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleOpenAuditDetails(audit.id)}
                        >
                          {audit.status === 'DRAFT' ? 'Заполнить / Провести' : 'Просмотреть'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* ==================== ACTIVE AUDIT DETAILS & COMPLETION MODAL ==================== */}
      <Modal
        isOpen={activeAuditModalOpen}
        onClose={() => setActiveAuditModalOpen(false)}
        title={activeAudit ? `Инвентаризационная опись ${activeAudit.auditNumber}` : 'Проведение инвентаризации'}
      >
        <div className="p-4 space-y-4">
          {activeAuditLoading || !activeAudit ? (
            <div className="text-center py-8">Загрузка описи...</div>
          ) : (
            <>
              {/* Header summary & info */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 rounded-xl border bg-[rgba(255,255,255,0.7)] p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-primary">{activeAudit.auditNumber}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${auditStatusColors[activeAudit.status]}`}>
                      {auditStatusLabels[activeAudit.status]}
                    </span>
                  </div>
                  <p className="text-xs text-secondary mt-1">
                    Создана: {new Date(activeAudit.createdAt).toLocaleString('ru')} | Исполнитель: {activeAudit.performedBy ? `${activeAudit.performedBy.firstName} ${activeAudit.performedBy.lastName}` : 'Администратор'}
                  </p>
                </div>
                
                {/* Stats summary banner */}
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-2 border text-xs">
                  <div className="text-center px-2 border-r">
                    <span className="text-secondary block">Всего</span>
                    <strong className="text-sm">{auditSummaryStats.total}</strong>
                  </div>
                  <div className="text-center px-2 border-r text-[var(--macos-green)]">
                    <span className="block text-secondary">Совпало</span>
                    <strong className="text-sm">{auditSummaryStats.matched}</strong>
                  </div>
                  <div className="text-center px-2 border-r text-indigo-600">
                    <span className="block text-secondary">Излишек</span>
                    <strong className="text-sm">+{auditSummaryStats.surpluses}</strong>
                  </div>
                  <div className="text-center px-2 text-[var(--macos-red)]">
                    <span className="block text-secondary">Недостача</span>
                    <strong className="text-sm">-{auditSummaryStats.deficits}</strong>
                  </div>
                </div>
              </div>

              {/* Note input */}
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-widest mb-1">Основание / Заметки</label>
                <Input
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="Плановая инвентаризация 3 квартал"
                  disabled={activeAudit.status !== 'DRAFT'}
                />
              </div>

              {/* Items Table */}
              <div className="max-h-[50vh] overflow-y-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[rgba(240,240,243,0.95)] backdrop-blur text-secondary font-medium">
                    <tr>
                      <th className="text-left p-2.5">Товар</th>
                      <th className="text-left p-2.5">Категория</th>
                      <th className="text-left p-2.5">Учётный остаток</th>
                      <th className="text-left p-2.5 min-w-[130px]">Фактический остаток</th>
                      <th className="text-left p-2.5">Расхождение</th>
                      <th className="text-left p-2.5">Примечание</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeAudit.items?.map((item) => {
                      const formVal = auditFormItems[item.inventoryItemId] || { actualQuantity: String(item.expectedQuantity), notes: '' };
                      const actualNum = formVal.actualQuantity !== '' ? parseFloat(formVal.actualQuantity) : item.expectedQuantity;
                      const diff = actualNum - item.expectedQuantity;

                      return (
                        <tr key={item.id} className="border-t hover:bg-white/60">
                          <td className="p-2.5 font-medium">{item.inventoryItem?.name || '—'}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-xs ${inventoryBadgeColors[item.inventoryItem?.type as InventoryType] || 'bg-gray-100'}`}>
                              {inventoryTypeLabels[item.inventoryItem?.type as InventoryType] || item.inventoryItem?.type}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono text-gray-600">
                            {item.expectedQuantity} {item.inventoryItem?.unit}
                          </td>
                          <td className="p-2.5">
                            {activeAudit.status === 'DRAFT' ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={formVal.actualQuantity}
                                  onChange={(e) => setAuditFormItems({
                                    ...auditFormItems,
                                    [item.inventoryItemId]: { ...formVal, actualQuantity: e.target.value }
                                  })}
                                  className="w-24 h-8 font-mono text-sm py-1"
                                />
                                <span className="text-xs text-secondary">{item.inventoryItem?.unit}</span>
                              </div>
                            ) : (
                              <span className="font-mono">{item.actualQuantity} {item.inventoryItem?.unit}</span>
                            )}
                          </td>
                          <td className="p-2.5 font-mono font-semibold">
                            {Math.abs(diff) < 0.001 ? (
                              <span className="text-gray-400">0</span>
                            ) : diff > 0 ? (
                              <span className="text-[var(--macos-green)] flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5"/> +{diff.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-[var(--macos-red)] flex items-center gap-1">
                                <XCircle className="h-3.5 w-3.5"/> {diff.toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5">
                            {activeAudit.status === 'DRAFT' ? (
                              <Input
                                value={formVal.notes}
                                onChange={(e) => setAuditFormItems({
                                  ...auditFormItems,
                                  [item.inventoryItemId]: { ...formVal, notes: e.target.value }
                                })}
                                placeholder="Комментарий..."
                                className="h-8 text-xs py-1"
                              />
                            ) : (
                              <span className="text-xs text-secondary">{item.notes || '—'}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-2">
                <Button variant="ghost" onClick={() => setActiveAuditModalOpen(false)}>
                  Закрыть
                </Button>

                {activeAudit.status === 'DRAFT' && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSaveAuditDraft} disabled={savingAudit || completingAudit}>
                      {savingAudit ? 'Сохранение...' : 'Сохранить черновик'}
                    </Button>
                    <Button onClick={handleCompleteAudit} disabled={savingAudit || completingAudit} className="bg-indigo-600 hover:bg-indigo-700">
                      {completingAudit ? 'Проведение...' : 'Провести инвентаризацию'}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>
    </PageStack>
  );
}
