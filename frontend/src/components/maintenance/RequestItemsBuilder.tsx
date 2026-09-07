// src/components/maintenance/RequestItemsBuilder.tsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../../lib/api';
import {
  Search,
  Plus,
  Trash2,
  Package,
  AlertTriangle,
  Check,
  Layers,
  X,
  PlusCircle,
  ShoppingBag,
  ShoppingCart,
  Edit3,
  Info,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/Badge';
import { ItemCategory, itemCategoryLabels, itemCategoryColors } from '../../types/maintenance';

export interface WarehouseStockItem {
  id: number;
  name: string;
  unit: string;
  quantity: number;
  type: string;
  category?: string;
  minQuantity?: number;
}

export interface RequestItemRow {
  name: string;
  quantity: number;
  unit: string;
  category: ItemCategory;
  inventoryItemId?: number | null;
  linkOrNote?: string;
}

interface RequestItemsBuilderProps {
  items: RequestItemRow[];
  onAdd: (item: RequestItemRow) => void;
  onRemove: (index: number) => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
  mode?: 'ISSUE' | 'PURCHASE';
  onSwitchMode?: (targetMode: 'ISSUE' | 'PURCHASE', preselectedItem?: WarehouseStockItem) => void;
  disabled?: boolean;
  error?: string;
}

export function RequestItemsBuilder({
  items,
  onAdd,
  onRemove,
  onUpdateQuantity,
  mode = 'ISSUE',
  onSwitchMode,
  disabled = false,
  error,
}: RequestItemsBuilderProps) {
  // Warehouse catalog state
  const [warehouseItems, setWarehouseItems] = useState<WarehouseStockItem[]>([]);
  const [loadingWarehouse, setLoadingWarehouse] = useState(false);

  // Mode-specific active tab for PURCHASE:
  // 'CUSTOM' = Новый заказной товар (под заказ)
  // 'OUT_OF_STOCK' = Закончившиеся на складе (0 шт)
  // 'SEARCH' = Умный поиск по каталогу
  const [purchaseTab, setPurchaseTab] = useState<'CUSTOM' | 'OUT_OF_STOCK' | 'SEARCH'>('CUSTOM');

  // Quick-Add bar search query
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStockItem, setSelectedStockItem] = useState<WarehouseStockItem | null>(null);
  const [addQuantity, setAddQuantity] = useState<number>(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Custom Item form state
  const [customName, setCustomName] = useState('');
  const [customQuantity, setCustomQuantity] = useState<number>(1);
  const [customUnit, setCustomUnit] = useState('шт');
  const [customCategory, setCustomCategory] = useState<ItemCategory>('STATIONERY');
  const [customNote, setCustomNote] = useState('');

  // Conflict warning state for custom item matching warehouse with stock > 0
  const [matchedInStockWarning, setMatchedInStockWarning] = useState<WarehouseStockItem | null>(null);

  // Catalog browse modal toggle for ISSUE mode
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('ALL');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all warehouse items
  const fetchWarehouseStock = async () => {
    setLoadingWarehouse(true);
    try {
      const res = await api.get('/api/inventory');
      const list = Array.isArray(res) ? res : res?.items || res?.data || [];
      setWarehouseItems(list);
    } catch (err) {
      console.error('Ошибка загрузки склада:', err);
    } finally {
      setLoadingWarehouse(false);
    }
  };

  useEffect(() => {
    fetchWarehouseStock();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Helper to map warehouse type to ItemCategory
  const mapTypeToCategory = (type: string): ItemCategory => {
    if (type === 'STATIONERY') return 'STATIONERY';
    if (type === 'HOUSEHOLD') return 'HOUSEHOLD';
    return 'OTHER';
  };

  // Warehouse items currently with 0 stock (out of stock)
  const outOfStockItems = useMemo(() => {
    return warehouseItems.filter((i) => i.quantity <= 0);
  }, [warehouseItems]);

  // Check if custom name typed by user matches an existing warehouse item that IS IN STOCK
  useEffect(() => {
    if (mode === 'PURCHASE' && customName.trim().length >= 3) {
      const clean = customName.toLowerCase().trim();
      const matched = warehouseItems.find(
        (w) => w.quantity > 0 && (w.name.toLowerCase() === clean || w.name.toLowerCase().includes(clean))
      );
      setMatchedInStockWarning(matched || null);
    } else {
      setMatchedInStockWarning(null);
    }
  }, [customName, mode, warehouseItems]);

  // Filter items for quick-search dropdown
  const filteredQuickItems = useMemo(() => {
    return warehouseItems.filter((item) => {
      const matchesCategory =
        categoryFilter === 'ALL' || item.type === categoryFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesCategory && matchesSearch;
    });
  }, [warehouseItems, categoryFilter, searchQuery]);

  // Handle select from dropdown
  const handleSelectStockItem = (item: WarehouseStockItem) => {
    if (mode === 'PURCHASE') {
      // In PURCHASE mode: CANNOT select item that is already in stock!
      if (item.quantity > 0) {
        setMatchedInStockWarning(item);
        return;
      }
      // Out of stock item -> add to purchase
      const existingIndex = items.findIndex((it) => it.inventoryItemId === item.id);
      if (existingIndex !== -1) {
        onUpdateQuantity(existingIndex, items[existingIndex].quantity + 1);
      } else {
        onAdd({
          name: item.name,
          quantity: 1,
          unit: item.unit,
          category: mapTypeToCategory(item.type),
          inventoryItemId: item.id,
        });
      }
      setSearchQuery('');
      setIsDropdownOpen(false);
      return;
    }

    // In ISSUE mode: CANNOT select 0-stock items
    if (mode === 'ISSUE' && item.quantity <= 0) {
      return;
    }

    setSelectedStockItem(item);
    setSearchQuery(item.name);
    setIsDropdownOpen(false);
    setAddQuantity(1);
  };

  // Handle Quick Add button click (ISSUE mode)
  const handleQuickAdd = () => {
    if (!selectedStockItem) return;
    if (addQuantity <= 0) return;

    if (mode === 'ISSUE' && selectedStockItem.quantity <= 0) {
      return;
    }

    if (mode === 'PURCHASE' && selectedStockItem.quantity > 0) {
      setMatchedInStockWarning(selectedStockItem);
      return;
    }

    // Check if already in list
    const existingIndex = items.findIndex(
      (it) => it.inventoryItemId === selectedStockItem.id
    );

    if (existingIndex !== -1) {
      const newQty = items[existingIndex].quantity + addQuantity;
      onUpdateQuantity(existingIndex, newQty);
    } else {
      onAdd({
        name: selectedStockItem.name,
        quantity: addQuantity,
        unit: selectedStockItem.unit,
        category: mapTypeToCategory(selectedStockItem.type),
        inventoryItemId: selectedStockItem.id,
      });
    }

    // Reset inputs
    setSelectedStockItem(null);
    setSearchQuery('');
    setAddQuantity(1);
    setMatchedInStockWarning(null);
  };

  // Handle adding custom item (PURCHASE mode)
  const handleAddCustomItem = () => {
    const trimmed = customName.trim();
    if (!trimmed) return;
    if (customQuantity <= 0) return;

    // Guard: cannot add if matches in-stock item
    if (matchedInStockWarning) {
      return;
    }

    onAdd({
      name: trimmed,
      quantity: customQuantity,
      unit: customUnit || 'шт',
      category: customCategory,
      inventoryItemId: null,
      linkOrNote: customNote.trim() || undefined,
    });

    setCustomName('');
    setCustomQuantity(1);
    setCustomUnit('шт');
    setCustomCategory('STATIONERY');
    setCustomNote('');
    setMatchedInStockWarning(null);
  };

  // Add zero-stock item directly from "Закончились на складе" list
  const handleAddZeroStockItem = (item: WarehouseStockItem) => {
    const existingIndex = items.findIndex((it) => it.inventoryItemId === item.id);
    if (existingIndex !== -1) {
      onUpdateQuantity(existingIndex, items[existingIndex].quantity + 1);
    } else {
      onAdd({
        name: item.name,
        quantity: 1,
        unit: item.unit,
        category: mapTypeToCategory(item.type),
        inventoryItemId: item.id,
      });
    }
  };

  const totalQuantity = items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);

  // Filter items for full catalog browse (ISSUE mode)
  const catalogFilteredItems = warehouseItems.filter((item) => {
    const matchesCat =
      catalogCategory === 'ALL' || item.type === catalogCategory;
    const matchesText =
      !catalogSearch.trim() ||
      item.name.toLowerCase().includes(catalogSearch.toLowerCase().trim());
    return matchesCat && matchesText;
  });

  return (
    <div className="space-y-3.5">
      {/* ----------------- SECTION HEADER & BADGE ----------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-separator/60 pb-2.5">
        <div>
          <label className="text-[13px] font-bold text-text-primary flex items-center gap-2">
            {mode === 'PURCHASE' ? (
              <ShoppingCart className="h-4 w-4 text-emerald-600" />
            ) : (
              <ShoppingBag className="h-4 w-4 text-purple-600" />
            )}
            <span>
              {mode === 'PURCHASE' ? 'Позиции к покупке (закупке)' : 'Позиции для выдачи со склада'}
            </span>
            <span className="text-macos-red">*</span>
          </label>
          <p className="text-[11.5px] text-text-secondary mt-0.5">
            {mode === 'PURCHASE'
              ? 'Товары, которых нет на складе: заказ новых наименований или пополнение закончившихся'
              : 'Товары, имеющиеся в наличии на складе школы (выдача со склада)'}
          </p>
        </div>

        {mode === 'ISSUE' && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCatalogModal(!showCatalogModal)}
              className="text-[12px] h-8 bg-fill-quaternary/40 hover:bg-fill-tertiary border-separator/80"
            >
              <Layers className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
              {showCatalogModal ? 'Скрыть каталог' : 'Каталог склада'}
            </Button>
          </div>
        )}
      </div>

      {/* ----------------- REFACTOR: LOGICAL IN-STOCK BLOCK BANNER ----------------- */}
      {matchedInStockWarning && (
        <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in-50 duration-200">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[12.5px] font-bold text-amber-900 leading-tight">
                Товар «{matchedInStockWarning.name}» уже есть на складе в наличии!
              </p>
              <p className="text-[11.5px] text-amber-800/90 mt-0.5">
                Остаток на складе:{' '}
                <strong className="font-mono text-amber-950 font-bold">
                  {matchedInStockWarning.quantity} {matchedInStockWarning.unit}
                </strong>
                . Закупка не требуется — пожалуйста, оформите заявку на выдачу со склада.
              </p>
            </div>
          </div>

          {onSwitchMode && (
            <Button
              type="button"
              size="sm"
              onClick={() => onSwitchMode('ISSUE', matchedInStockWarning)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[12px] h-8 shrink-0 shadow-xs"
            >
              Оформить выдачу <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          )}
        </div>
      )}

      {/* ----------------- REFACTOR: PURCHASE MODE SMART TABS ----------------- */}
      {mode === 'PURCHASE' ? (
        <div className="space-y-3">
          {/* Segmented Control for Purchase actions */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-fill-quaternary/70 rounded-2xl border border-separator/60">
            <button
              type="button"
              onClick={() => setPurchaseTab('CUSTOM')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                purchaseTab === 'CUSTOM'
                  ? 'bg-white text-emerald-700 shadow-sm border border-black/5'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Новый заказной товар</span>
            </button>

            <button
              type="button"
              onClick={() => setPurchaseTab('OUT_OF_STOCK')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                purchaseTab === 'OUT_OF_STOCK'
                  ? 'bg-white text-rose-700 shadow-sm border border-black/5'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
              <span>Закончились на складе ({outOfStockItems.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setPurchaseTab('SEARCH')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                purchaseTab === 'SEARCH'
                  ? 'bg-white text-emerald-700 shadow-sm border border-black/5'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              <span>Поиск по каталогу</span>
            </button>
          </div>

          {/* TAB 1: FORM FOR NEW CUSTOM ITEM */}
          {purchaseTab === 'CUSTOM' && (
            <div className="p-3.5 bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/30 rounded-2xl border border-emerald-200/90 shadow-subtle space-y-3 animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <PlusCircle className="h-3.5 w-3.5 text-emerald-600" />
                  Заказ позиции, которой нет в номенклатуре склада:
                </span>
                <span className="text-[11px] text-emerald-700/80">
                  Книги, пособия, техника, хоз.инвентарь
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                    Наименование товара <span className="text-macos-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Например: Проектор, Бумага для пастели A2, Набор реагентов..."
                    className="w-full px-3 py-2 text-[13px] bg-white border border-emerald-300/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-subtle font-medium"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomItem();
                      }
                    }}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                    Кол-во <span className="text-macos-red">*</span>
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={customQuantity}
                    onChange={(e) => setCustomQuantity(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-center font-mono font-bold text-[13px] bg-white border border-emerald-300/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-subtle"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                    Ед. изм.
                  </label>
                  <select
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    className="w-full px-2 py-2 text-[12.5px] bg-white border border-emerald-300/80 rounded-xl focus:outline-none font-medium"
                  >
                    <option value="шт">шт</option>
                    <option value="упак">упак</option>
                    <option value="пачка">пачка</option>
                    <option value="коробка">коробка</option>
                    <option value="комплект">комплект</option>
                    <option value="набор">набор</option>
                    <option value="рулон">рулон</option>
                    <option value="кг">кг</option>
                    <option value="л">л</option>
                    <option value="м">м</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                    Категория
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as ItemCategory)}
                    className="w-full px-2 py-2 text-[12.5px] bg-white border border-emerald-300/80 rounded-xl focus:outline-none font-medium"
                  >
                    <option value="STATIONERY">Канцтовары</option>
                    <option value="HOUSEHOLD">Хозтовары</option>
                    <option value="OTHER">Прочее / Техника / Пособия</option>
                  </select>
                </div>

                <div className="sm:col-span-9">
                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="Ссылка на товар (Uzum / WB / маркет) или пожелание по бренду/модели (необязательно)..."
                    className="w-full px-3 py-1.5 text-[12px] bg-white/90 border border-separator/70 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-text-secondary"
                  />
                </div>

                <div className="sm:col-span-3 flex items-end">
                  <Button
                    type="button"
                    onClick={handleAddCustomItem}
                    disabled={!customName.trim() || !!matchedInStockWarning}
                    className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[12.5px] shadow-sm disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Добавить в закупку
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OUT OF STOCK ITEMS (0 QUANTITY) LIST */}
          {purchaseTab === 'OUT_OF_STOCK' && (
            <div className="p-3.5 bg-rose-50/40 rounded-2xl border border-rose-200/80 space-y-3 animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-rose-100 text-rose-800 rounded-lg">
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[12.5px] font-bold text-rose-950">
                    Складские товары с нулевым остатком ({outOfStockItems.length}):
                  </span>
                </div>
                <span className="text-[11.5px] text-text-tertiary">
                  Нажмите кнопку для быстрого добавления в план закупки
                </span>
              </div>

              {outOfStockItems.length === 0 ? (
                <div className="py-6 text-center text-text-secondary text-[12.5px]">
                  🎉 На складе все товары есть в наличии! Нет позиций с нулевым остатком.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                  {outOfStockItems.map((item) => {
                    const isAdded = items.some((it) => it.inventoryItemId === item.id);
                    return (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-xl border flex flex-col justify-between gap-2 transition-all ${
                          isAdded
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : 'bg-white border-rose-200/70 hover:border-rose-300 shadow-subtle'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-[12.5px] text-text-primary truncate" title={item.name}>
                            {item.name}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-text-tertiary mt-0.5">
                            <span>{item.type === 'STATIONERY' ? 'Канцтовары' : item.type === 'HOUSEHOLD' ? 'Хозтовары' : item.type === 'FOOD' ? 'Продукты' : item.type === 'EQUIPMENT' ? 'Техника' : 'Прочее'}</span>
                            <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              0 {item.unit} на складе
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddZeroStockItem(item)}
                          className={`w-full py-1 text-[11.5px] font-bold rounded-lg flex items-center justify-center gap-1 transition-colors ${
                            isAdded
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-rose-100 hover:bg-rose-200 text-rose-900'
                          }`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {isAdded ? '+1 ещё' : 'Заказать закупку'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SMART SEARCH IN WAREHOUSE CATALOG */}
          {purchaseTab === 'SEARCH' && (
            <div className="p-3.5 bg-fill-quaternary/40 border border-separator/70 rounded-2xl space-y-3" ref={dropdownRef}>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-tertiary" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  placeholder="Поиск по каталогу склада (проверка наличия)..."
                  className="w-full pl-9 pr-8 py-2 text-[13px] bg-white border border-separator/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-subtle font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsDropdownOpen(false);
                    }}
                    className="absolute right-2.5 top-2.5 text-text-tertiary hover:text-text-primary"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Floating Dropdown Results */}
              {isDropdownOpen && (
                <div className="bg-white border border-separator/80 rounded-2xl shadow-elevated max-h-60 overflow-y-auto divide-y divide-separator/30 p-1.5">
                  {filteredQuickItems.length === 0 ? (
                    <div className="py-4 px-3 text-center space-y-2">
                      <p className="text-[12.5px] text-text-tertiary">
                        В складском каталоге товар не найден.
                      </p>
                      {searchQuery.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomName(searchQuery.trim());
                            setPurchaseTab('CUSTOM');
                            setIsDropdownOpen(false);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl text-[12px] font-bold transition-colors"
                        >
                          <PlusCircle className="h-4 w-4 text-emerald-700" />
                          Заказать «{searchQuery.trim()}» как новый товар
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredQuickItems.map((item) => {
                      const isInStock = item.quantity > 0;
                      const isAdded = items.some((it) => it.inventoryItemId === item.id);

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectStockItem(item)}
                          className={`px-3 py-2.5 rounded-xl flex items-center justify-between gap-2 transition-colors text-[13px] cursor-pointer ${
                            isInStock
                              ? 'hover:bg-amber-50/60'
                              : 'hover:bg-emerald-50/60'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-text-primary truncate">
                                {item.name}
                              </span>
                              {isAdded && (
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded shrink-0">
                                  В заявке
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-text-tertiary">
                              Ед. изм: {item.unit}
                            </span>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {isInStock ? (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                                <span>В наличии: {item.quantity} {item.unit}</span>
                                <span className="text-[10px] text-amber-700">(покупка не нужна)</span>
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                                0 {item.unit} (Закончился — заказать)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ----------------- ISSUE MODE QUICK-ADD BAR ----------------- */
        <div className="space-y-3">
          {/* Quick-Add Input Row for ISSUE mode */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2" ref={dropdownRef}>
            {/* Combobox Search */}
            <div className="relative flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-tertiary" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                    if (selectedStockItem && selectedStockItem.name !== e.target.value) {
                      setSelectedStockItem(null);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (selectedStockItem) {
                        handleQuickAdd();
                      }
                    }
                  }}
                  placeholder="Введите название товара (бумага, ручки, мыло)..."
                  className="w-full pl-9 pr-8 py-2 text-[13px] bg-white border border-separator/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 shadow-subtle font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedStockItem(null);
                      setIsDropdownOpen(false);
                    }}
                    className="absolute right-2.5 top-2.5 text-text-tertiary hover:text-text-primary"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Dropdown for ISSUE mode */}
              {isDropdownOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-separator/80 rounded-2xl shadow-elevated max-h-56 overflow-y-auto divide-y divide-separator/30 p-1.5 animate-in fade-in-50 zoom-in-95 duration-150">
                  {loadingWarehouse ? (
                    <div className="py-4 text-center text-[12.5px] text-text-secondary">
                      Загрузка товаров со склада...
                    </div>
                  ) : filteredQuickItems.length === 0 ? (
                    <div className="py-4 text-center text-[12.5px] text-text-tertiary">
                      Ничего не найдено
                    </div>
                  ) : (
                    filteredQuickItems.map((item) => {
                      const isOutOfStock = item.quantity <= 0;
                      const isAdded = items.some((it) => it.inventoryItemId === item.id);

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (!isOutOfStock) {
                              handleSelectStockItem(item);
                            }
                          }}
                          className={`px-3 py-2 rounded-xl flex items-center justify-between gap-2 transition-colors text-[13px] ${
                            isOutOfStock
                              ? 'opacity-60 cursor-not-allowed bg-rose-50/20'
                              : selectedStockItem?.id === item.id
                              ? 'bg-purple-50 text-purple-700 font-semibold cursor-pointer'
                              : 'hover:bg-fill-quaternary text-text-primary cursor-pointer'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold truncate ${isOutOfStock ? 'text-text-tertiary line-through' : ''}`}>
                                {item.name}
                              </span>
                              {isAdded && (
                                <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded shrink-0">
                                  В заявке
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-text-tertiary">
                              Ед. изм: {item.unit}
                            </span>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <span
                              className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                                isOutOfStock
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {isOutOfStock
                                ? '0 (нет в наличии)'
                                : `На складе: ${item.quantity} ${item.unit}`}
                            </span>
                            {selectedStockItem?.id === item.id && (
                              <Check className="h-4 w-4 text-purple-600" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Quantity Input */}
            <div className="w-full sm:w-28 flex items-center">
              <input
                type="number"
                min="1"
                max={selectedStockItem ? selectedStockItem.quantity : undefined}
                value={addQuantity}
                onChange={(e) => setAddQuantity(parseInt(e.target.value) || 1)}
                disabled={!selectedStockItem}
                className="w-full px-2.5 py-2 text-center font-mono font-bold text-[13px] bg-white border border-separator/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 shadow-subtle disabled:opacity-50 disabled:bg-fill-quaternary"
              />
              <span className="ml-1.5 text-[12px] font-medium text-text-secondary shrink-0">
                {selectedStockItem ? selectedStockItem.unit : 'ед.'}
              </span>
            </div>

            {/* Quick Add Button */}
            <Button
              type="button"
              onClick={handleQuickAdd}
              disabled={!selectedStockItem || addQuantity <= 0}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[13px] h-9 px-4 rounded-xl shrink-0 shadow-sm disabled:opacity-50"
            >
              <Plus className="h-4 w-4 mr-1" /> Добавить
            </Button>
          </div>
        </div>
      )}

      {/* ----------------- CATALOG BROWSE MODAL (ISSUE MODE) ----------------- */}
      {mode === 'ISSUE' && showCatalogModal && (
        <div className="p-3.5 bg-fill-quaternary/40 border border-separator/70 rounded-2xl space-y-3 animate-in fade-in-50 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-600" />
              <span className="font-bold text-[13px] text-text-primary">
                Каталог склада (выбор в 1 клик):
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Фильтр в каталоге..."
                className="h-7 text-[12px] px-2.5 bg-white border border-separator/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 w-40"
              />
              <select
                value={catalogCategory}
                onChange={(e) => setCatalogCategory(e.target.value)}
                className="h-7 text-[11.5px] px-2 bg-white border border-separator/80 rounded-lg focus:outline-none font-medium"
              >
                <option value="ALL">Все категории</option>
                <option value="STATIONERY">Канцтовары</option>
                <option value="HOUSEHOLD">Хозтовары</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
            {catalogFilteredItems.map((cItem) => {
              const isAdded = items.some((it) => it.inventoryItemId === cItem.id);
              const isZero = cItem.quantity <= 0;

              return (
                <div
                  key={cItem.id}
                  className={`p-2.5 rounded-xl border flex flex-col justify-between gap-1.5 transition-all ${
                    isZero
                      ? 'bg-fill-quaternary/30 border-separator/50 opacity-60'
                      : isAdded
                      ? 'bg-purple-50/70 border-purple-200'
                      : 'bg-white border-separator/80 hover:border-purple-300 shadow-subtle'
                  }`}
                >
                  <div className="min-w-0">
                    <div className={`font-semibold text-[12.5px] text-text-primary truncate ${isZero ? 'line-through text-text-tertiary' : ''}`} title={cItem.name}>
                      {cItem.name}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-text-tertiary mt-0.5">
                      <span>{cItem.unit}</span>
                      <span className={`font-semibold ${isZero ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {isZero ? '0 на складе' : `${cItem.quantity} ${cItem.unit}`}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isZero}
                    onClick={() => {
                      if (!isZero) {
                        const existingIndex = items.findIndex((it) => it.inventoryItemId === cItem.id);
                        if (existingIndex !== -1) {
                          onUpdateQuantity(existingIndex, items[existingIndex].quantity + 1);
                        } else {
                          onAdd({
                            name: cItem.name,
                            quantity: 1,
                            unit: cItem.unit,
                            category: mapTypeToCategory(cItem.type),
                            inventoryItemId: cItem.id,
                          });
                        }
                      }
                    }}
                    className={`w-full py-1 text-[11.5px] font-bold rounded-lg flex items-center justify-center gap-1 transition-colors ${
                      isZero
                        ? 'bg-fill-quaternary text-text-tertiary cursor-not-allowed'
                        : isAdded
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-fill-tertiary hover:bg-purple-600 hover:text-white text-text-primary'
                    }`}
                  >
                    {isZero ? '✕ Нет на складе' : isAdded ? '+1 ещё' : 'Добавить'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------- CHOSEN ITEMS BASKET ----------------- */}
      <div className="rounded-2xl border border-separator/80 bg-white overflow-hidden shadow-subtle">
        <div className="px-3.5 py-2.5 bg-fill-quaternary/40 border-b border-separator/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold uppercase tracking-wider text-text-tertiary">
              {mode === 'PURCHASE' ? 'Позиции к закупке:' : 'Позиции к выдаче:'}
            </span>
            <Badge variant="outline" className="text-[11px] font-bold">
              {items.length} {items.length === 1 ? 'позиция' : items.length < 5 ? 'позиции' : 'позиций'}
            </Badge>
          </div>

          {items.length > 0 && (
            <span className="text-[12px] font-semibold text-text-secondary">
              Всего единиц: <strong className="text-text-primary">{totalQuantity}</strong>
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="py-9 text-center text-text-tertiary px-4 space-y-1.5">
            {mode === 'PURCHASE' ? (
              <ShoppingCart className="h-8 w-8 mx-auto text-emerald-400" />
            ) : (
              <ShoppingBag className="h-8 w-8 mx-auto text-purple-400" />
            )}
            <p className="text-[13px] font-semibold text-text-secondary">
              {mode === 'PURCHASE'
                ? 'Список закупки пуст'
                : 'Список выдачи пуст'}
            </p>
            <p className="text-[11.5px] text-text-tertiary max-w-sm mx-auto">
              {mode === 'PURCHASE'
                ? 'Заполните форму «Новый заказной товар» или выберите позиции из вкладки «Закончились на складе».'
                : 'Воспользуйтесь строкой поиска или откройте «Каталог склада» для выбора товаров в наличии.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-separator/40 max-h-[38vh] overflow-y-auto">
            {items.map((row, idx) => {
              const stock = warehouseItems.find((w) => w.id === row.inventoryItemId);
              const inStockQty = stock?.quantity ?? 0;
              const isCustom = !row.inventoryItemId;

              // Error highlight: if item in PURCHASE mode has stock > 0
              const isIllegalPurchaseStock = mode === 'PURCHASE' && stock && inStockQty > 0;

              return (
                <div
                  key={idx}
                  className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isIllegalPurchaseStock ? 'bg-amber-50/70 border-l-4 border-amber-500' : 'hover:bg-fill-quaternary/20'
                  }`}
                >
                  {/* Item info */}
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <span className="text-[12px] font-mono font-bold text-text-tertiary w-5 pt-0.5 shrink-0 text-center">
                      {idx + 1}.
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-[13.5px] text-text-primary truncate">
                          {row.name}
                        </span>

                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            itemCategoryColors[row.category] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {itemCategoryLabels[row.category] || row.category}
                        </span>

                        {mode === 'PURCHASE' && (
                          isCustom ? (
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded">
                              Новый заказной товар
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                              Пополнение склада (0 на складе)
                            </span>
                          )
                        )}
                      </div>

                      {/* Notes / links or stock info */}
                      <div className="mt-1 text-[11.5px]">
                        {isIllegalPurchaseStock ? (
                          <div className="flex items-center gap-2 text-amber-800 font-bold">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            <span>Товар есть на складе ({inStockQty} {row.unit})! Закупка не требуется.</span>
                            {onSwitchMode && (
                              <button
                                type="button"
                                onClick={() => onSwitchMode('ISSUE', stock)}
                                className="underline hover:text-amber-950 ml-1"
                              >
                                Оформить выдачу
                              </button>
                            )}
                          </div>
                        ) : row.linkOrNote ? (
                          <span className="text-text-secondary font-medium">
                            📝 {row.linkOrNote}
                          </span>
                        ) : stock ? (
                          <span className="text-text-tertiary">
                            Складской остаток: {inStockQty} {row.unit}
                          </span>
                        ) : (
                          <span className="text-text-tertiary italic">
                            Вне каталога склада
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper & Remove */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <div className="flex items-center bg-fill-quaternary/70 border border-separator/80 rounded-xl p-0.5">
                      <button
                        type="button"
                        disabled={disabled || row.quantity <= 1}
                        onClick={() => onUpdateQuantity(idx, Math.max(1, row.quantity - 1))}
                        className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-text-primary disabled:opacity-30 rounded-lg hover:bg-white font-bold"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-mono font-bold text-[13px] text-text-primary">
                        {row.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onUpdateQuantity(idx, row.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-text-primary disabled:opacity-30 rounded-lg hover:bg-white font-bold"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-[12px] font-bold text-text-secondary w-10">
                      {row.unit}
                    </span>

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onRemove(idx)}
                      className="p-1.5 text-text-tertiary hover:text-macos-red hover:bg-rose-50 rounded-lg transition-colors"
                      title="Удалить позицию"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <p className="text-[12px] font-semibold text-macos-red flex items-center gap-1 mt-1">
          <AlertTriangle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}
