// src/pages/InventoryPage.tsx
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/Card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/Badge';
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
  FOOD: 'bg-tint-green text-[#1B7A3D] border-macos-green/20',
  HOUSEHOLD: 'bg-tint-orange text-[#B25E00] border-macos-orange/20',
  STATIONERY: 'bg-tint-purple text-macos-purple border-macos-purple/20',
  EQUIPMENT: 'bg-tint-blue text-macos-blue border-macos-blue/20',
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
    <PageStack className="space-y-6">
      {/* ==================== HERO HEADER ==================== */}
      <PageHeader
        eyebrow="ERP Operations · Складской Учёт"
        title="Склад и Материальные Активы"
        description="Контроль остатков, движение ТМЦ, акты инвентаризации и автоматическая калькуляция закупок."
        icon={<Archive className="h-5 w-5 text-macos-blue" />}
        meta={
          <div className="flex items-center gap-2">
            <Badge variant="outline">{items.length} позиций на складе</Badge>
            {stats.outOfStock > 0 && (
              <Badge variant="danger" dot>
                {stats.outOfStock} нет в наличии
              </Badge>
            )}
            {stats.lowStock > 0 && (
              <Badge variant="warning" dot>
                {stats.lowStock} заканчивается
              </Badge>
            )}
          </div>
        }
        actions={
          <div className="flex gap-2 flex-wrap items-center">
            <Button onClick={handleCreate} size="md">
              <PlusCircle className="mr-1.5 h-4 w-4" /> Добавить товар
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setActiveTab('AUDITS');
                handleFetchAudits();
              }}
            >
              <ClipboardCheck className="mr-1.5 h-4 w-4 text-macos-blue" /> Инвентаризация
            </Button>
            <Button variant="outline" size="md" onClick={() => setIsModalOpen(true)}>
              <ShoppingBag className="mr-1.5 h-4 w-4 text-[#1B7A3D]" /> Закупки
            </Button>
          </div>
        }
      />

      {/* ==================== MAIN TAB NAVIGATION ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-1.5 rounded-2xl bg-surface-primary/80 backdrop-blur-xl border border-black/[0.06] shadow-subtle">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('ITEMS')}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer",
              activeTab === 'ITEMS'
                ? 'bg-gradient-to-b from-[#0084FF] to-[#007AFF] text-white shadow-[0_2px_8px_rgba(0,122,255,0.3)]'
                : 'text-text-secondary hover:text-text-primary hover:bg-fill-quaternary'
            )}
          >
            <Layers className="h-4 w-4" /> Остатки на складе ({filteredItems.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('AUDITS');
              handleFetchAudits();
            }}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer",
              activeTab === 'AUDITS'
                ? 'bg-gradient-to-b from-[#0084FF] to-[#007AFF] text-white shadow-[0_2px_8px_rgba(0,122,255,0.3)]'
                : 'text-text-secondary hover:text-text-primary hover:bg-fill-quaternary'
            )}
          >
            <ClipboardCheck className="h-4 w-4" /> Акты инвентаризации
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('LOGS');
              handleLoadAllTransactions();
            }}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer",
              activeTab === 'LOGS'
                ? 'bg-gradient-to-b from-[#0084FF] to-[#007AFF] text-white shadow-[0_2px_8px_rgba(0,122,255,0.3)]'
                : 'text-text-secondary hover:text-text-primary hover:bg-fill-quaternary'
            )}
          >
            <History className="h-4 w-4" /> Журнал движений
          </button>
        </div>

        {/* Global Live Search */}
        {activeTab === 'ITEMS' && (
          <div className="relative min-w-[280px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск товара или артикула..."
              className="w-full pl-9 pr-8 py-1.5 text-[13px] bg-white border border-separator/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-macos-blue/40 shadow-subtle"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-text-tertiary hover:text-text-primary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ==================== TAB 1: ITEMS LIST (ОСТАТКИ) ==================== */}
      {activeTab === 'ITEMS' && (
        <>
          {/* CATEGORY BENTO CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {filterCards.map(({ type, label, count, icon: Icon }) => {
              const isActive = filterType === type;
              return (
                <div
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={clsx(
                    "p-4 rounded-2xl border transition-all duration-200 cursor-pointer backdrop-blur-xl select-none",
                    "bg-surface-primary shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)]",
                    isActive
                      ? 'ring-2 ring-macos-blue border-macos-blue/30 shadow-[0_4px_16px_rgba(0,122,255,0.15)]'
                      : 'border-black/[0.06] hover:border-black/15 hover:-translate-y-0.5'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-tint-blue text-macos-blue flex items-center justify-center border border-macos-blue/20 shrink-0">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[12px] font-semibold text-text-tertiary block truncate">{label}</span>
                      <p className="text-[22px] font-bold tracking-[-0.03em] text-text-primary tabular-nums leading-none mt-0.5">{count}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* STOCK STATUS FILTER CHIPS */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-surface-primary/80 backdrop-blur-xl border border-black/[0.06] shadow-subtle text-[12px]">
            <div className="flex flex-wrap items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-text-tertiary ml-1" />
              <span className="font-semibold text-text-secondary mr-1">Фильтр остатка:</span>

              <button
                type="button"
                onClick={() => setStockStatusFilter('ALL')}
                className={clsx(
                  "px-3 py-1 rounded-lg font-medium transition-all cursor-pointer",
                  stockStatusFilter === 'ALL'
                    ? 'bg-text-primary text-white shadow-subtle font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-fill-quaternary'
                )}
              >
                Все остатки ({stats.all})
              </button>

              <button
                type="button"
                onClick={() => setStockStatusFilter('NORMAL')}
                className={clsx(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer",
                  stockStatusFilter === 'NORMAL'
                    ? 'bg-tint-green text-[#1B7A3D] border border-macos-green/30 font-semibold'
                    : 'text-text-secondary hover:text-[#1B7A3D] hover:bg-tint-green/50'
                )}
              >
                <span className="h-2 w-2 rounded-full bg-macos-green shadow-[0_0_0_2px_rgba(52,199,89,0.2)]" />
                В норме ({stats.normalStock})
              </button>

              <button
                type="button"
                onClick={() => setStockStatusFilter('LOW')}
                className={clsx(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer",
                  stockStatusFilter === 'LOW'
                    ? 'bg-tint-orange text-[#B25E00] border border-macos-orange/30 font-semibold'
                    : 'text-text-secondary hover:text-[#B25E00] hover:bg-tint-orange/50'
                )}
              >
                <span className="h-2 w-2 rounded-full bg-macos-orange shadow-[0_0_0_2px_rgba(255,149,0,0.2)]" />
                Низкий остаток ({stats.lowStock})
              </button>

              <button
                type="button"
                onClick={() => setStockStatusFilter('OUT_OF_STOCK')}
                className={clsx(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer",
                  stockStatusFilter === 'OUT_OF_STOCK'
                    ? 'bg-tint-red text-macos-red border border-macos-red/30 font-semibold'
                    : 'text-text-secondary hover:text-macos-red hover:bg-tint-red/50'
                )}
              >
                <span className="h-2 w-2 rounded-full bg-macos-red shadow-[0_0_0_2px_rgba(255,59,48,0.2)] animate-pulse" />
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
                className="text-[12px] text-macos-blue hover:underline font-semibold cursor-pointer"
              >
                Сбросить фильтры
              </button>
            )}
          </div>

          {/* MAIN INVENTORY TABLE */}
          <div className="rounded-2xl border border-black/[0.06] bg-surface-primary shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] overflow-hidden">
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
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-separator/60 bg-fill-quaternary/40 backdrop-blur-md">
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary">Наименование товара</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary">Категория</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary">Статус наличия</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary">Текущий остаток</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary">Срок годности</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-separator/40">
                    {filteredItems.map((item: any) => {
                      const progressRatio = item.minQuantity > 0 ? Math.min(100, Math.round((item.quantity / item.minQuantity) * 100)) : 100;
                      
                      return (
                        <tr key={item.id} className="transition-colors duration-150 hover:bg-macos-blue/[0.03]">
                          <td className="px-5 py-3.5 font-semibold text-[13.5px] text-text-primary">
                            {item.name}
                            {item.minQuantity > 0 && (
                              <span className="block text-[11px] text-text-tertiary font-normal mt-0.5">
                                Минимальный порог: {item.minQuantity} {item.unit}
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            <Badge variant={item.type === 'FOOD' ? 'success' : item.type === 'HOUSEHOLD' ? 'warning' : item.type === 'STATIONERY' ? 'purple' : 'default'} dot>
                              {inventoryTypeLabels[item.type as InventoryType] || item.type}
                            </Badge>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="space-y-1.5">
                              {getStockStatusBadge(item.quantity, item.minQuantity)}
                              {item.minQuantity > 0 && item.quantity > 0 && (
                                <div className="w-28 bg-fill-tertiary h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={clsx(
                                      "h-full rounded-full transition-all duration-300",
                                      progressRatio <= 100 ? 'bg-macos-orange' : 'bg-macos-green'
                                    )}
                                    style={{ width: `${Math.min(100, progressRatio)}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 font-mono text-[15px] font-bold text-text-primary tabular-nums">
                            {item.quantity} <span className="text-[12px] font-normal text-text-tertiary">{item.unit}</span>
                          </td>

                          <td className="px-4 py-3.5">
                            {getExpiryBadge(item.expiryDate) || <span className="text-text-tertiary text-[12px]">—</span>}
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(item)}
                                title="Редактировать"
                              >
                                <Pencil className="h-3.5 w-3.5 text-text-secondary" />
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
                                className="text-[#1B7A3D] border-macos-green/30 hover:bg-tint-green"
                              >
                                <ArrowDownCircle className="h-3.5 w-3.5 text-macos-green" />
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
                                className="text-macos-red border-macos-red/30 hover:bg-tint-red"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-macos-red" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleShowHistory(item)}
                                title="История движений"
                              >
                                <History className="h-3.5 w-3.5 text-macos-blue" />
                              </Button>

                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openDeleteModal(item)}
                                title="Удалить"
                              >
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
          </div>
        </>
      )}


      {/* ==================== TAB 2: AUDITS DASHBOARD & LIST (ИНВЕНТАРИЗАЦИЯ) ==================== */}
      {activeTab === 'AUDITS' && (
        <PageSection className="p-0 space-y-4">
          {/* Header Action Banner */}
          <Card variant="glass" className="p-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-macos-purple" />
                  <h3 className="text-[17px] font-bold text-text-primary tracking-[-0.01em]">Проведение Инвентаризации Склада</h3>
                </div>
                <p className="text-[13px] text-text-secondary mt-1 max-w-2xl leading-relaxed">
                  Сверка фактического наличия с учётными остатками. Система автоматически формирует акты расхождений, корректирует остатки в базе данных и регистрирует транзакции в Журнале движений.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={auditScopeType}
                  onChange={(e) => setAuditScopeType(e.target.value)}
                  className="mezon-field text-[13px] py-1.5 px-3 rounded-xl bg-white border border-separator shadow-subtle text-text-primary"
                >
                  <option value="ALL">Все категории товаров</option>
                  <option value="FOOD">Только Продукты питания</option>
                  <option value="HOUSEHOLD">Только Хоз. товары</option>
                  <option value="STATIONERY">Только Канц. товары</option>
                  <option value="EQUIPMENT">Только Техника</option>
                </select>

                <Button onClick={handleStartNewAudit} size="md">
                  <PlusCircle className="mr-1.5 h-4 w-4" /> Создать новый акт
                </Button>
              </div>
            </div>
          </Card>

          {/* Audits Table Container */}
          <div className="rounded-2xl border border-black/[0.06] bg-surface-primary shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] overflow-hidden">
            <div className="p-4 border-b border-separator/60 flex justify-between items-center bg-fill-quaternary/30">
              <h4 className="font-bold text-[14px] text-text-primary flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-macos-blue" /> История и Черновики Инвентаризаций
              </h4>
              <Badge variant="outline">{audits.length} документов</Badge>
            </div>

            {auditsLoading ? (
              <LoadingCard message="Загрузка списка актов..." height={200} />
            ) : audits.length === 0 ? (
              <div className="text-center py-12 px-4">
                <ClipboardCheck className="mx-auto h-10 w-10 text-text-tertiary mb-3 opacity-60" />
                <p className="font-semibold text-[15px] text-text-primary">Нет актов инвентаризации</p>
                <p className="text-[13px] text-text-tertiary mt-1">Нажмите «Создать новый акт», чтобы начать проверку остатков.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-separator/60 bg-fill-quaternary/40 backdrop-blur-md">
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary">Номер акта</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary">Статус</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary">Позиций</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary">Основание / Заметки</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary">Исполнитель</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary">Дата создания</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-separator/40">
                    {audits.map((audit) => (
                      <tr key={audit.id} className="transition-colors duration-150 hover:bg-macos-blue/[0.03]">
                        <td className="px-5 py-3.5 font-mono font-bold text-[13.5px] text-macos-blue">
                          {audit.auditNumber}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant={audit.status === 'COMPLETED' ? 'success' : audit.status === 'DRAFT' ? 'warning' : 'danger'} dot>
                            {auditStatusLabels[audit.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-[13px] text-text-primary">{audit._count?.items ?? audit.items?.length ?? 0} шт.</td>
                        <td className="px-4 py-3.5 text-[12px] text-text-secondary max-w-[220px] truncate">{audit.notes || '—'}</td>
                        <td className="px-4 py-3.5 text-[12.5px] font-medium text-text-primary">
                          {audit.performedBy ? `${audit.performedBy.firstName} ${audit.performedBy.lastName}` : 'Администратор'}
                        </td>
                        <td className="px-4 py-3.5 text-[12px] font-mono text-text-tertiary whitespace-nowrap">
                          {new Date(audit.createdAt).toLocaleString('ru-RU')}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            variant={audit.status === 'DRAFT' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleOpenAuditDetails(audit.id)}
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
          </div>
        </PageSection>
      )}

      {/* ==================== TAB 3: TRANSACTION LOGS (ЖУРНАЛ ДВИЖЕНИЙ) ==================== */}
      {activeTab === 'LOGS' && (
        <PageSection className="p-0">
          <div className="rounded-2xl border border-black/[0.06] bg-surface-primary shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] overflow-hidden">
            <div className="p-4 border-b border-separator/60 flex justify-between items-center bg-fill-quaternary/30">
              <h4 className="font-bold text-[14px] text-text-primary flex items-center gap-2">
                <History className="h-4 w-4 text-macos-blue" /> Сквозной Журнал Движений ТМЦ
              </h4>
              <Badge variant="outline">Последние {allTransactions.length} операций</Badge>
            </div>

            {allTransactionsLoading ? (
              <LoadingCard message="Загрузка журнала движений..." height={240} />
            ) : allTransactions.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-text-tertiary">Записи о движениях отсутствуют</div>
            ) : (
              <div className="overflow-x-auto max-h-[70vh]">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-surface-primary/95 backdrop-blur-md z-10 border-b border-separator/60 shadow-subtle">
                    <tr>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary">Дата и Время</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary">Товар</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary">Тип Операции</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary">Кол-во</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary">До → После</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary">Причина / Документ</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.05em] text-text-tertiary">Исполнитель</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-separator/40">
                    {allTransactions.map((tx: InventoryTransaction) => (
                      <tr key={tx.id} className="transition-colors duration-150 hover:bg-macos-blue/[0.03]">
                        <td className="px-5 py-3.5 font-mono text-[12px] text-text-tertiary whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString('ru-RU')}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[13.5px] text-text-primary">
                          {tx.inventoryItem?.name || '—'}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant={tx.type === 'IN' ? 'success' : tx.type === 'OUT' || tx.type === 'WRITE_OFF' ? 'danger' : 'warning'} dot>
                            {transactionTypeLabels[tx.type]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-[14px]">
                          <span className={tx.type === 'IN' ? 'text-[#1B7A3D]' : 'text-macos-red'}>
                            {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[12px] text-text-secondary">
                          {tx.quantityBefore} → {tx.quantityAfter}
                        </td>
                        <td className="px-4 py-3.5 text-[12.5px] text-text-secondary max-w-[240px] truncate" title={tx.reason || ''}>
                          {tx.reason || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-[12.5px] font-medium text-text-primary">
                          {tx.performedBy ? `${tx.performedBy.firstName} ${tx.performedBy.lastName}` : 'Система'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
