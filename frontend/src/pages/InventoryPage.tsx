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
  AlertCircle,
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
  Search,
  X,
  ShoppingBag,
  SlidersHorizontal,
  Layers,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Clock,
  Sparkles
} from 'lucide-react';
import { EmptyListState } from '../components/ui/EmptyState';
import { LoadingCard } from '../components/ui/LoadingState';
import { PageHeader, PageSection, PageStack, PageToolbar } from '../components/ui/page';

type FilterType = 'ALL' | InventoryType;
type StockStatusFilter = 'ALL' | 'NORMAL' | 'LOW' | 'OUT_OF_STOCK';
type MainTab = 'ITEMS' | 'AUDITS' | 'LOGS';

const selectClassName = 'mezon-field';

const inventoryBadgeColors: Record<InventoryType, string> = {
  FOOD: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40',
  HOUSEHOLD: 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40',
  STATIONERY: 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/40',
  EQUIPMENT: 'bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/40',
};

export default function InventoryPage() {
  const { data: items, loading, fetchData } = useApi<Item>({ url: '/api/inventory' });
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<MainTab>('ITEMS');
  
  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<StockStatusFilter>('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  
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

  // All transactions log state
  const [allTransactions, setAllTransactions] = useState<InventoryTransaction[]>([]);
  const [allTransactionsLoading, setAllTransactionsLoading] = useState(false);

  // ==================== INVENTORY AUDIT (ИНВЕНТАРИЗАЦИЯ) ====================
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

  // ==================== COMPUTED FILTERED ITEMS ====================
  const filteredItems = useMemo(() => {
    return items.filter((item: any) => {
      // Category type filter
      if (filterType !== 'ALL' && item.type !== filterType) return false;

      // Stock status filter
      if (stockStatusFilter === 'OUT_OF_STOCK' && item.quantity > 0) return false;
      if (stockStatusFilter === 'LOW' && (item.quantity === 0 || item.minQuantity === 0 || item.quantity > item.minQuantity)) return false;
      if (stockStatusFilter === 'NORMAL' && (item.quantity === 0 || (item.minQuantity > 0 && item.quantity <= item.minQuantity))) return false;

      // Text search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = item.name.toLowerCase().includes(query);
        const unitMatch = item.unit.toLowerCase().includes(query);
        const typeMatch = (inventoryTypeLabels[item.type as InventoryType] || '').toLowerCase().includes(query);
        if (!nameMatch && !unitMatch && !typeMatch) return false;
      }

      return true;
    });
  }, [items, filterType, stockStatusFilter, searchQuery]);

  // Comprehensive Statistics
  const stats = useMemo(() => {
    const all = items.length;
    const food = items.filter((i: any) => i.type === 'FOOD').length;
    const household = items.filter((i: any) => i.type === 'HOUSEHOLD').length;
    const stationery = items.filter((i: any) => i.type === 'STATIONERY').length;
    const equipment = items.filter((i: any) => i.type === 'EQUIPMENT').length;

    const outOfStock = items.filter((i: any) => i.quantity === 0).length;
    const lowStock = items.filter((i: any) => i.quantity > 0 && i.minQuantity > 0 && i.quantity <= i.minQuantity).length;
    const normalStock = items.filter((i: any) => i.quantity > 0 && (i.minQuantity === 0 || i.quantity > i.minQuantity)).length;

    return { all, food, household, stationery, equipment, outOfStock, lowStock, normalStock };
  }, [items]);

  const filterCards = [
    {
      type: 'ALL' as const,
      label: 'Все товары',
      count: stats.all,
      icon: Archive,
      accent: 'text-gray-700 dark:text-gray-200',
      iconBg: 'bg-gray-100 dark:bg-gray-800',
      activeBorder: 'border-gray-400 dark:border-gray-500 shadow-sm',
    },
    {
      type: 'FOOD' as const,
      label: 'Продукты питания',
      count: stats.food,
      icon: Apple,
      accent: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
      activeBorder: 'border-emerald-500 shadow-emerald-100/50 dark:shadow-none',
    },
    {
      type: 'HOUSEHOLD' as const,
      label: 'Хоз. товары',
      count: stats.household,
      icon: Package,
      accent: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-50 dark:bg-amber-950/50',
      activeBorder: 'border-amber-500 shadow-amber-100/50 dark:shadow-none',
    },
    {
      type: 'STATIONERY' as const,
      label: 'Канц. товары',
      count: stats.stationery,
      icon: Pencil,
      accent: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-50 dark:bg-purple-950/50',
      activeBorder: 'border-purple-500 shadow-purple-100/50 dark:shadow-none',
    },
    {
      type: 'EQUIPMENT' as const,
      label: 'Техника',
      count: stats.equipment,
      icon: Laptop,
      accent: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/50',
      activeBorder: 'border-indigo-500 shadow-indigo-100/50 dark:shadow-none',
    },
  ];

  const getExpiryBadge = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const daysLeft = (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    if (daysLeft < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle className="h-3 w-3"/> Просрочено
        </span>
      );
    }
    if (daysLeft < 7) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="h-3 w-3"/> Истекает ({Math.ceil(daysLeft)} дн)
        </span>
      );
    }
    return (
      <span className="text-xs text-gray-500 font-mono">
        {new Date(expiryDate).toLocaleDateString('ru')}
      </span>
    );
  };

  const getStockStatusBadge = (quantity: number, minQuantity: number) => {
    if (quantity === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse"/>
          Нет в наличии
        </span>
      );
    }
    if (minQuantity > 0 && quantity <= minQuantity) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500"/>
          Низкий остаток
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>
        В норме
      </span>
    );
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

  // Загрузить все транзакции для вкладки Журнал
  const handleLoadAllTransactions = async () => {
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

  const handleFetchAudits = async () => {
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
      const itemsPayload = Object.entries(auditFormItems).map(([itemId, val]) => ({
        inventoryItemId: Number(itemId),
        actualQuantity: val.actualQuantity !== '' ? parseFloat(val.actualQuantity) : null,
        notes: val.notes || undefined,
      }));

      await api.put(`/api/inventory/audits/${activeAudit.id}`, {
        notes: auditNotes,
        items: itemsPayload,
      });

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
      if (activeTab === 'AUDITS') handleFetchAudits();
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
      {/* ==================== HERO HEADER ==================== */}
      <PageHeader
        eyebrow="ERP Operations · Складской Учёт"
        title="Склад и Материальные Активы"
        description="Контроль остатков, движение ТМЦ, акты инвентаризации и автоматическая калькуляция закупок."
        icon={<Archive className="h-5 w-5 text-indigo-600 dark:text-indigo-400"/>}
        meta={
          <div className="flex items-center gap-2">
            <span className="mezon-badge macos-badge-neutral">{items.length} позиций на складе</span>
            {stats.outOfStock > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                <AlertCircle className="h-3 w-3"/> {stats.outOfStock} нет в наличии
              </span>
            )}
            {stats.lowStock > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3"/> {stats.lowStock} заканчивается
              </span>
            )}
          </div>
        }
        actions={
          <div className="flex gap-2 flex-wrap items-center">
            <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
              <PlusCircle className="mr-2 h-4 w-4"/> Добавить товар
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setActiveTab('AUDITS');
                handleFetchAudits();
              }}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/50"
            >
              <ClipboardCheck className="mr-2 h-4 w-4 text-indigo-600 dark:text-indigo-400"/> Инвентаризация
            </Button>
            <Button variant="outline" onClick={() => setIsModalOpen(true)}>
              <ShoppingBag className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400"/> Закупки
            </Button>
          </div>
        }
      />

      {/* ==================== MAIN TAB NAVIGATION ==================== */}
      <div className="flex items-center justify-between border-b border-gray-200/80 dark:border-gray-800 pb-2">
        <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-gray-800/60 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('ITEMS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'ITEMS'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <Layers className="h-4 w-4"/> Остатки на складе ({filteredItems.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('AUDITS');
              handleFetchAudits();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'AUDITS'
                ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <ClipboardCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400"/> Акты инвентаризации
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('LOGS');
              handleLoadAllTransactions();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'LOGS'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <History className="h-4 w-4"/> Журнал движений
          </button>
        </div>

        {/* Global Live Search */}
        {activeTab === 'ITEMS' && (
          <div className="relative min-w-[280px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"/>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск товара или артикула..."
              className="w-full pl-9 pr-8 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5"/>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ==================== TAB 1: ITEMS LIST (ОСТАТКИ) ==================== */}
      {activeTab === 'ITEMS' && (
        <>
          {/* CATEGORY STAT CARDS */}
          <PageToolbar className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
            {filterCards.map(({ type, label, count, icon: Icon, accent, iconBg, activeBorder }) => {
              const isActive = filterType === type;
              return (
                <Card
                  key={type}
                  className={`p-0 transition-all duration-200 cursor-pointer border ${
                    isActive ? activeBorder : 'border-gray-200/80 dark:border-gray-800 hover:border-gray-300'
                  }`}
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between p-3.5 text-left"
                    onClick={() => setFilterType(type)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl p-2.5 ${iconBg}`}>
                        <Icon className={`h-5 w-5 ${accent}`} />
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 font-medium block">{label}</span>
                        <p className={`mt-0.5 text-2xl font-bold tracking-tight ${accent}`}>{count}</p>
                      </div>
                    </div>
                  </button>
                </Card>
              );
            })}
          </PageToolbar>

          {/* STOCK STATUS FILTER CHIPS */}
          <div className="flex items-center justify-between gap-4 bg-gray-50/70 dark:bg-gray-900/40 p-2.5 rounded-xl border border-gray-200/60 dark:border-gray-800 text-xs">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-gray-400 ml-1"/>
              <span className="font-semibold text-gray-700 dark:text-gray-300 mr-2">Фильтр остатка:</span>
              
              <button
                type="button"
                onClick={() => setStockStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  stockStatusFilter === 'ALL'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Все остатки ({stats.all})
              </button>

              <button
                type="button"
                onClick={() => setStockStatusFilter('NORMAL')}
                className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  stockStatusFilter === 'NORMAL'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold'
                    : 'text-gray-600 hover:text-emerald-700'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500"/>
                В норме ({stats.normalStock})
              </button>

              <button
                type="button"
                onClick={() => setStockStatusFilter('LOW')}
                className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  stockStatusFilter === 'LOW'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200 font-semibold'
                    : 'text-gray-600 hover:text-amber-700'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-amber-500"/>
                Низкий остаток ({stats.lowStock})
              </button>

              <button
                type="button"
                onClick={() => setStockStatusFilter('OUT_OF_STOCK')}
                className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  stockStatusFilter === 'OUT_OF_STOCK'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200 font-semibold'
                    : 'text-gray-600 hover:text-rose-700'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"/>
                Нет в наличии ({stats.outOfStock})
              </button>
            </div>

            {(searchQuery || filterType !== 'ALL' || stockStatusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('ALL');
                  setStockStatusFilter('ALL');
                }}
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                Сбросить фильтры
              </button>
            )}
          </div>

          {/* MAIN INVENTORY TABLE */}
          <PageSection className="p-0">
            <Card className="overflow-hidden border border-gray-200/80 dark:border-gray-800">
              {loading ? (
                <LoadingCard message="Загружаем остатки со склада..." height={240} />
              ) : filteredItems.length === 0 ? (
                <EmptyListState
                  title={searchQuery ? 'Ничего не найдено' : 'Нет товаров на складе'}
                  description={searchQuery ? `По запросу «${searchQuery}» товары не найдены.` : 'Добавьте первую позицию на склад.'}
                  onAction={handleCreate}
                  actionLabel="Добавить товар"
                  className="py-12"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50/80 dark:bg-gray-800/50 text-gray-500 font-medium border-b border-gray-200/80 dark:border-gray-800">
                      <tr>
                        <th className="p-3.5 pl-4">Наименование товара</th>
                        <th className="p-3.5">Категория</th>
                        <th className="p-3.5">Статус наличия</th>
                        <th className="p-3.5">Текущий остаток</th>
                        <th className="p-3.5">Срок годности</th>
                        <th className="p-3.5 pr-4 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredItems.map((item: any) => {
                        const progressRatio = item.minQuantity > 0 ? Math.min(100, Math.round((item.quantity / item.minQuantity) * 100)) : 100;
                        
                        return (
                          <tr key={item.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                            <td className="p-3.5 pl-4 font-semibold text-gray-900 dark:text-gray-100">
                              {item.name}
                              {item.minQuantity > 0 && (
                                <span className="block text-xs text-gray-400 font-normal mt-0.5">
                                  Низший порог: {item.minQuantity} {item.unit}
                                </span>
                              )}
                            </td>

                            <td className="p-3.5">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${inventoryBadgeColors[item.type as InventoryType] || 'bg-gray-100'}`}>
                                {inventoryTypeLabels[item.type as InventoryType] || item.type}
                              </span>
                            </td>

                            <td className="p-3.5">
                              <div className="space-y-1">
                                {getStockStatusBadge(item.quantity, item.minQuantity)}
                                {item.minQuantity > 0 && item.quantity > 0 && (
                                  <div className="w-24 bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        progressRatio <= 100 ? 'bg-amber-500' : 'bg-emerald-500'
                                      }`}
                                      style={{ width: `${Math.min(100, progressRatio)}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="p-3.5 font-mono text-base font-bold text-gray-900 dark:text-white">
                              {item.quantity} <span className="text-xs font-normal text-gray-500">{item.unit}</span>
                            </td>

                            <td className="p-3.5">
                              {getExpiryBadge(item.expiryDate) || <span className="text-gray-400 text-xs">—</span>}
                            </td>

                            <td className="p-3.5 pr-4 text-right">
                              <div className="flex gap-1.5 justify-end">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(item)} title="Редактировать">
                                  <Pencil className="h-3.5 w-3.5 text-gray-600"/>
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setReceiveItem(item);
                                    setReceiveData({ quantity: '', reason: '' });
                                    setReceiveModalOpen(true);
                                  }}
                                  title="Приёмка товара (+)"
                                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                >
                                  <ArrowDownCircle className="h-3.5 w-3.5 text-emerald-600"/>
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setWriteOffItem(item);
                                    setWriteOffData({ quantity: '', reason: '' });
                                    setWriteOffModalOpen(true);
                                  }}
                                  title="Списание (-)"
                                  className="border-rose-200 text-rose-700 hover:bg-rose-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-rose-600"/>
                                </Button>

                                <Button variant="outline" size="sm" onClick={() => handleShowHistory(item)} title="История движений">
                                  <History className="h-3.5 w-3.5 text-indigo-600"/>
                                </Button>

                                <Button variant="destructive" size="sm" onClick={() => openDeleteModal(item)} title="Удалить">
                                  &times;
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
        </>
      )}

      {/* ==================== TAB 2: AUDITS DASHBOARD & LIST (ИНВЕНТАРИЗАЦИЯ) ==================== */}
      {activeTab === 'AUDITS' && (
        <PageSection className="p-0 space-y-4">
          {/* Header Action Banner */}
          <Card className="p-5 bg-gradient-to-r from-indigo-900/10 via-purple-900/5 to-transparent border-indigo-200/80 dark:border-indigo-900/40">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-600"/>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Проведение Инвентаризации Склада</h3>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">
                  Сверка фактического наличия с учётными остатками. Система автоматически формирует акты расхождений, корректирует остатки в базе данных и регистрирует транзакции в Журнале движений.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={auditScopeType}
                  onChange={(e) => setAuditScopeType(e.target.value)}
                  className="mezon-field text-xs py-2 px-3 rounded-lg"
                >
                  <option value="ALL">Все категории товаров</option>
                  <option value="FOOD">Только Продукты питания</option>
                  <option value="HOUSEHOLD">Только Хоз. товары</option>
                  <option value="STATIONERY">Только Канц. товары</option>
                  <option value="EQUIPMENT">Только Техника</option>
                </select>

                <Button onClick={handleStartNewAudit} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                  <PlusCircle className="mr-2 h-4 w-4"/> Создать новый акт
                </Button>
              </div>
            </div>
          </Card>

          {/* Audits Table */}
          <Card className="p-0 border border-gray-200/80 dark:border-gray-800">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-indigo-600"/> История и Черновики Инвентаризаций
              </h4>
              <span className="text-xs text-gray-500">{audits.length} документов</span>
            </div>

            {auditsLoading ? (
              <LoadingCard message="Загрузка списка актов..." height={200} />
            ) : audits.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ClipboardCheck className="mx-auto h-12 w-12 text-gray-300 mb-2"/>
                <p className="font-semibold text-gray-700 dark:text-gray-300">Нет актов инвентаризации</p>
                <p className="text-xs text-gray-500 mt-1">Нажмите «Создать новый акт», чтобы начать проверку остатков.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50/80 dark:bg-gray-800/50 text-gray-500 font-medium border-b">
                    <tr>
                      <th className="p-3.5 pl-4">Номер акта</th>
                      <th className="p-3.5">Статус</th>
                      <th className="p-3.5">Позиций</th>
                      <th className="p-3.5">Основание / Заметки</th>
                      <th className="p-3.5">Исполнитель</th>
                      <th className="p-3.5">Дата создания</th>
                      <th className="p-3.5 pr-4 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {audits.map((audit) => (
                      <tr key={audit.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                        <td className="p-3.5 pl-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {audit.auditNumber}
                        </td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${auditStatusColors[audit.status]}`}>
                            {auditStatusLabels[audit.status]}
                          </span>
                        </td>
                        <td className="p-3.5 font-medium">{audit._count?.items ?? audit.items?.length ?? 0} шт.</td>
                        <td className="p-3.5 text-xs text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{audit.notes || '—'}</td>
                        <td className="p-3.5 text-xs">
                          {audit.performedBy ? `${audit.performedBy.firstName} ${audit.performedBy.lastName}` : 'Администратор'}
                        </td>
                        <td className="p-3.5 text-xs font-mono text-gray-500 whitespace-nowrap">
                          {new Date(audit.createdAt).toLocaleString('ru')}
                        </td>
                        <td className="p-3.5 pr-4 text-right">
                          <Button
                            variant={audit.status === 'DRAFT' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleOpenAuditDetails(audit.id)}
                            className={audit.status === 'DRAFT' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}
                          >
                            {audit.status === 'DRAFT' ? 'Заполнить / Провести' : 'Просмотреть акт'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </PageSection>
      )}

      {/* ==================== TAB 3: TRANSACTION LOGS (ЖУРНАЛ ДВИЖЕНИЙ) ==================== */}
      {activeTab === 'LOGS' && (
        <PageSection className="p-0">
          <Card className="p-0 border border-gray-200/80 dark:border-gray-800">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <History className="h-4 w-4 text-indigo-600"/> Сквозной Журнал Движений ТМЦ
              </h4>
              <span className="text-xs text-gray-500">Последние {allTransactions.length} операций</span>
            </div>

            {allTransactionsLoading ? (
              <LoadingCard message="Загрузка журнала движений..." height={240} />
            ) : allTransactions.length === 0 ? (
              <div className="py-12 text-center text-gray-500">Записи о движениях отсутствуют</div>
            ) : (
              <div className="overflow-x-auto max-h-[70vh]">
                <table className="w-full text-sm text-left">
                  <thead className="sticky top-0 bg-gray-100/90 dark:bg-gray-800 text-gray-600 font-medium">
                    <tr>
                      <th className="p-3 pl-4">Дата и Время</th>
                      <th className="p-3">Товар</th>
                      <th className="p-3">Тип Операции</th>
                      <th className="p-3">Кол-во</th>
                      <th className="p-3">До → После</th>
                      <th className="p-3">Причина / Документ</th>
                      <th className="p-3 pr-4">Исполнитель</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {allTransactions.map((tx: InventoryTransaction) => (
                      <tr key={tx.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                        <td className="p-3 pl-4 font-mono text-xs text-gray-500 whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString('ru')}
                        </td>
                        <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">{tx.inventoryItem?.name || '—'}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${transactionTypeColors[tx.type]}`}>
                            {transactionTypeLabels[tx.type]}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold">
                          <span className={tx.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}>
                            {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-xs text-gray-500">{tx.quantityBefore} → {tx.quantityAfter}</td>
                        <td className="p-3 text-xs text-gray-600 dark:text-gray-300 max-w-[240px] truncate" title={tx.reason || ''}>
                          {tx.reason || '—'}
                        </td>
                        <td className="p-3 pr-4 text-xs text-gray-500">
                          {tx.performedBy ? `${tx.performedBy.firstName} ${tx.performedBy.lastName}` : 'Система'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </PageSection>
      )}

      {/* SHOPPING LIST MODAL */}
      {shoppingList && (
        <Card className="mt-6">
          <h2 className="p-4 text-xl font-semibold text-primary">Список закупок по меню</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
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
                    <td className="p-2 font-medium">{item.name}</td>
                    <td className="p-2">{item.requiredQty.toFixed(2)} {item.unit}</td>
                    <td className="p-2">{item.inStock.toFixed(2)} {item.unit}</td>
                    <td className="p-2 font-bold text-indigo-600">{item.toBuy.toFixed(2)} {item.unit}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>
      )}

      {isModalOpen && <ShoppingListModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onGenerate={setShoppingList} />}

      {/* ITEM CREATE / EDIT MODAL */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title={editingItem ? 'Редактировать позицию' : 'Новая позиция на складе'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest text-gray-500 mb-1">Наименование товара *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Ноутбук Lenovo ThinkPad / Молоко 3.2%"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest text-gray-500 mb-1">Категория *</label>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-gray-500 mb-1">Количество *</label>
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
              <label className="block text-[11px] font-medium uppercase tracking-widest text-gray-500 mb-1">Единица измерения *</label>
              <Input
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                required
                placeholder="шт, кг, л, упак"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-gray-500 mb-1">Срок годности</label>
              <Input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-gray-500 mb-1">Мин. остаток (алерт)</label>
              <Input
                type="number"
                value={formData.minQuantity}
                onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                placeholder="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsItemModalOpen(false)}
              disabled={saving}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Подтверждение удаления">
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600"/>
            <div>
              <h4 className="font-semibold text-rose-800">Удаление товара со склада</h4>
              <p className="mt-1 text-xs text-rose-700">
                Вы собираетесь списать и полностью удалить товар со склада. Это действие зафиксирует списание в журнале.
              </p>
            </div>
          </div>
          {deletingItem && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <p><strong>Наименование:</strong> {deletingItem.name}</p>
              <p><strong>Остаток:</strong> {deletingItem.quantity} {deletingItem.unit}</p>
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

      {/* ITEM TRANSACTION HISTORY MODAL */}
      <Modal isOpen={transactionsModalOpen} onClose={() => setTransactionsModalOpen(false)} title={`История движений: ${selectedItemForHistory?.name || ''}`}>
        <div className="p-4">
          {transactionsLoading ? (
            <div className="text-center py-6">Загрузка истории...</div>
          ) : transactions.length === 0 ? (
            <div className="py-6 text-center text-gray-500">Нет записей о движениях</div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-100 text-gray-600 font-medium">
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
                      <td className="p-2 whitespace-nowrap text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString('ru')}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${transactionTypeColors[tx.type]}`}>
                          {transactionTypeLabels[tx.type]}
                        </span>
                      </td>
                      <td className="p-2 font-mono font-bold">
                        <span className={tx.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}>
                          {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                        </span>
                      </td>
                      <td className="p-2 font-mono text-xs">{tx.quantityBefore} → {tx.quantityAfter}</td>
                      <td className="p-2 text-xs text-gray-600 max-w-[200px] truncate" title={tx.reason || ''}>
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

      {/* WRITE-OFF MODAL */}
      <Modal isOpen={writeOffModalOpen} onClose={() => setWriteOffModalOpen(false)} title="Списание товара">
        <div className="p-4 space-y-4">
          {writeOffItem && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
              <p className="font-semibold text-amber-900">{writeOffItem.name}</p>
              <p className="text-xs text-amber-700 mt-0.5">Текущий остаток: <strong>{writeOffItem.quantity} {writeOffItem.unit}</strong></p>
            </div>
          )}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest text-gray-500 mb-1">Количество для списания *</label>
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
            <label className="block text-[11px] font-medium uppercase tracking-widest text-gray-500 mb-1">Причина списания</label>
            <Input
              value={writeOffData.reason}
              onChange={(e) => setWriteOffData({ ...writeOffData, reason: e.target.value })}
              placeholder="Просрочка, поломка, порча..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setWriteOffModalOpen(false)} disabled={writingOff}>Отмена</Button>
            <Button variant="destructive" onClick={handleWriteOff} disabled={writingOff || !writeOffData.quantity}>
              {writingOff ? 'Списание...' : 'Списать'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* RECEIVE MODAL */}
      <Modal isOpen={receiveModalOpen} onClose={() => setReceiveModalOpen(false)} title="Приёмка товара">
        <div className="p-4 space-y-4">
          {receiveItem && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
              <p className="font-semibold text-emerald-900">{receiveItem.name}</p>
              <p className="text-xs text-emerald-700 mt-0.5">Текущий остаток: <strong>{receiveItem.quantity} {receiveItem.unit}</strong></p>
            </div>
          )}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest text-gray-500 mb-1">Количество прихода *</label>
            <Input
              type="number"
              value={receiveData.quantity}
              onChange={(e) => setReceiveData({ ...receiveData, quantity: e.target.value })}
              placeholder="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest text-gray-500 mb-1">Комментарий / Поставщик</label>
            <Input
              value={receiveData.reason}
              onChange={(e) => setReceiveData({ ...receiveData, reason: e.target.value })}
              placeholder="Закупка, поставка..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setReceiveModalOpen(false)} disabled={receiving}>Отмена</Button>
            <Button onClick={handleReceive} disabled={receiving || !receiveData.quantity} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {receiving ? 'Приёмка...' : 'Принять'}
            </Button>
          </div>
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
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-indigo-900">{activeAudit.auditNumber}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${auditStatusColors[activeAudit.status]}`}>
                      {auditStatusLabels[activeAudit.status]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Создана: {new Date(activeAudit.createdAt).toLocaleString('ru')} | Исполнитель: {activeAudit.performedBy ? `${activeAudit.performedBy.firstName} ${activeAudit.performedBy.lastName}` : 'Администратор'}
                  </p>
                </div>
                
                {/* Stats summary banner */}
                <div className="flex items-center gap-3 bg-white rounded-lg p-2.5 border border-indigo-100 shadow-sm text-xs">
                  <div className="text-center px-2 border-r">
                    <span className="text-gray-400 block font-medium">Всего</span>
                    <strong className="text-sm font-bold text-gray-900">{auditSummaryStats.total}</strong>
                  </div>
                  <div className="text-center px-2 border-r text-emerald-600">
                    <span className="block font-medium text-gray-400">Совпало</span>
                    <strong className="text-sm font-bold">{auditSummaryStats.matched}</strong>
                  </div>
                  <div className="text-center px-2 border-r text-indigo-600">
                    <span className="block font-medium text-gray-400">Излишек</span>
                    <strong className="text-sm font-bold">+{auditSummaryStats.surpluses}</strong>
                  </div>
                  <div className="text-center px-2 text-rose-600">
                    <span className="block font-medium text-gray-400">Недостача</span>
                    <strong className="text-sm font-bold">-{auditSummaryStats.deficits}</strong>
                  </div>
                </div>
              </div>

              {/* Note input */}
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-widest text-gray-500 mb-1">Основание / Заметки</label>
                <Input
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="Плановая инвентаризация 3 квартал"
                  disabled={activeAudit.status !== 'DRAFT'}
                />
              </div>

              {/* Items Table */}
              <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm text-left">
                  <thead className="sticky top-0 bg-gray-100/90 backdrop-blur text-gray-600 font-medium border-b">
                    <tr>
                      <th className="p-3 pl-4">Товар</th>
                      <th className="p-3">Категория</th>
                      <th className="p-3">Учётный остаток</th>
                      <th className="p-3 min-w-[140px]">Фактический остаток</th>
                      <th className="p-3">Отклонение</th>
                      <th className="p-3 pr-4">Примечание</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activeAudit.items?.map((item) => {
                      const formVal = auditFormItems[item.inventoryItemId] || { actualQuantity: String(item.expectedQuantity), notes: '' };
                      const actualNum = formVal.actualQuantity !== '' ? parseFloat(formVal.actualQuantity) : item.expectedQuantity;
                      const diff = actualNum - item.expectedQuantity;

                      return (
                        <tr key={item.id} className="hover:bg-gray-50/70">
                          <td className="p-3 pl-4 font-semibold text-gray-900">{item.inventoryItem?.name || '—'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-xs border font-medium ${inventoryBadgeColors[item.inventoryItem?.type as InventoryType] || 'bg-gray-100'}`}>
                              {inventoryTypeLabels[item.inventoryItem?.type as InventoryType] || item.inventoryItem?.type}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-gray-500">
                            {item.expectedQuantity} {item.inventoryItem?.unit}
                          </td>
                          <td className="p-3">
                            {activeAudit.status === 'DRAFT' ? (
                              <div className="flex items-center gap-1.5">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={formVal.actualQuantity}
                                  onChange={(e) => setAuditFormItems({
                                    ...auditFormItems,
                                    [item.inventoryItemId]: { ...formVal, actualQuantity: e.target.value }
                                  })}
                                  className="w-24 h-8 font-mono text-sm py-1 border-indigo-200 focus:border-indigo-500"
                                />
                                <span className="text-xs text-gray-500">{item.inventoryItem?.unit}</span>
                              </div>
                            ) : (
                              <span className="font-mono font-bold">{item.actualQuantity} {item.inventoryItem?.unit}</span>
                            )}
                          </td>
                          <td className="p-3 font-mono font-bold">
                            {Math.abs(diff) < 0.001 ? (
                              <span className="text-gray-400 font-normal">0</span>
                            ) : diff > 0 ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs">
                                <CheckCircle2 className="h-3.5 w-3.5"/> +{diff.toFixed(2)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-xs">
                                <XCircle className="h-3.5 w-3.5"/> {diff.toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="p-3 pr-4">
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
                              <span className="text-xs text-gray-500">{item.notes || '—'}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-3 border-t">
                <Button variant="ghost" onClick={() => setActiveAuditModalOpen(false)}>
                  Закрыть
                </Button>

                {activeAudit.status === 'DRAFT' && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSaveAuditDraft} disabled={savingAudit || completingAudit}>
                      {savingAudit ? 'Сохранение...' : 'Сохранить черновик'}
                    </Button>
                    <Button onClick={handleCompleteAudit} disabled={savingAudit || completingAudit} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md">
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
