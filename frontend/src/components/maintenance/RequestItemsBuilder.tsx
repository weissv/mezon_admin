// src/components/maintenance/RequestItemsBuilder.tsx
import { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import {
  Search,
  Plus,
  Trash2,
  Package,
  AlertTriangle,
  Check,
  Layers,
  Sparkles,
  X,
  PlusCircle,
  MinusCircle,
  ShoppingBag,
  ShoppingCart,
  Edit3,
  Info,
} from 'lucide-react';
import { Input } from '../ui/input';
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
}

interface RequestItemsBuilderProps {
  items: RequestItemRow[];
  onAdd: (item: RequestItemRow) => void;
  onRemove: (index: number) => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
  mode?: 'ISSUE' | 'PURCHASE';
  disabled?: boolean;
  error?: string;
}

export function RequestItemsBuilder({
  items,
  onAdd,
  onRemove,
  onUpdateQuantity,
  mode = 'ISSUE',
  disabled = false,
  error,
}: RequestItemsBuilderProps) {
  // Warehouse catalog state
  const [warehouseItems, setWarehouseItems] = useState<WarehouseStockItem[]>([]);
  const [loadingWarehouse, setLoadingWarehouse] = useState(false);

  // Quick-Add bar state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStockItem, setSelectedStockItem] = useState<WarehouseStockItem | null>(null);
  const [addQuantity, setAddQuantity] = useState<number>(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Custom Item state (primarily for PURCHASE mode or custom requests)
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customQuantity, setCustomQuantity] = useState<number>(1);
  const [customUnit, setCustomUnit] = useState('шт');
  const [customCategory, setCustomCategory] = useState<ItemCategory>('STATIONERY');

  // Catalog browse modal toggle
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('ALL');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all warehouse items once
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

  // Filter items for quick-search dropdown
  const filteredQuickItems = warehouseItems.filter((item) => {
    const matchesCategory =
      categoryFilter === 'ALL' || item.type === categoryFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchesCategory && matchesSearch;
  });

  // Handle select from dropdown
  const handleSelectStockItem = (item: WarehouseStockItem) => {
    if (mode === 'ISSUE' && item.quantity <= 0) {
      // In ISSUE mode, cannot select 0-stock items
      return;
    }
    setSelectedStockItem(item);
    setSearchQuery(item.name);
    setIsDropdownOpen(false);
    setAddQuantity(1);
  };

  // Handle Quick Add button click
  const handleQuickAdd = () => {
    if (!selectedStockItem) return;
    if (addQuantity <= 0) return;

    if (mode === 'ISSUE' && selectedStockItem.quantity <= 0) {
      return;
    }

    // Check if already in list
    const existingIndex = items.findIndex(
      (it) => it.inventoryItemId === selectedStockItem.id
    );

    if (existingIndex !== -1) {
      // Increment existing quantity
      const newQty = items[existingIndex].quantity + addQuantity;
      onUpdateQuantity(existingIndex, newQty);
    } else {
      // Append new item
      onAdd({
        name: selectedStockItem.name,
        quantity: addQuantity,
        unit: selectedStockItem.unit,
        category: mapTypeToCategory(selectedStockItem.type),
        inventoryItemId: selectedStockItem.id,
      });
    }

    // Reset quick-add bar
    setSelectedStockItem(null);
    setSearchQuery('');
    setAddQuantity(1);
    setIsDropdownOpen(false);
    searchInputRef.current?.focus();
  };

  // Handle adding custom item (for PURCHASE mode or items not in warehouse catalogue)
  const handleAddCustomItem = () => {
    if (!customName.trim()) return;
    if (customQuantity <= 0) return;

    onAdd({
      name: customName.trim(),
      quantity: customQuantity,
      unit: customUnit.trim() || 'шт',
      category: customCategory,
      inventoryItemId: null,
    });

    setCustomName('');
    setCustomQuantity(1);
  };

  // Quick 1-click add directly from catalog browser
  const handleCatalogDirectAdd = (item: WarehouseStockItem) => {
    if (mode === 'ISSUE' && item.quantity <= 0) {
      return;
    }
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

  // Filter items for full catalog browse
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
      {/* ----------------- SECTION HEADER & ACTIONS ----------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-separator/60 pb-2.5">
        <div>
          <label className="text-[13px] font-bold text-text-primary flex items-center gap-2">
            {mode === 'PURCHASE' ? (
              <ShoppingCart className="h-4 w-4 text-emerald-600" />
            ) : (
              <ShoppingBag className="h-4 w-4 text-macos-blue" />
            )}
            <span>
              {mode === 'PURCHASE' ? 'Позиции для закупки / покупки' : 'Позиции для выдачи со склада'}
            </span>
            <span className="text-macos-red">*</span>
          </label>
          <p className="text-[11.5px] text-text-secondary mt-0.5">
            {mode === 'PURCHASE'
              ? 'Укажите товары для закупки: выберите из каталога или введите произвольные наименования'
              : 'Выберите товары из наличия на складе (позиции с остатком 0 недоступны для выдачи)'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {mode === 'PURCHASE' && (
            <Button
              type="button"
              variant={isCustomMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsCustomMode(!isCustomMode)}
              className={`text-[12px] h-8 ${isCustomMode ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-fill-quaternary/40 hover:bg-fill-tertiary border-separator/80'}`}
            >
              <Edit3 className="h-3.5 w-3.5 mr-1.5" />
              {isCustomMode ? 'Складской каталог' : '+ Произвольный товар'}
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCatalogModal(!showCatalogModal)}
            className="text-[12px] h-8 bg-fill-quaternary/40 hover:bg-fill-tertiary border-separator/80"
          >
            <Layers className="h-3.5 w-3.5 mr-1.5 text-macos-blue" />
            {showCatalogModal ? 'Скрыть каталог' : 'Каталог склада'}
          </Button>
        </div>
      </div>

      {/* ----------------- INFORMATIONAL NOTICE ----------------- */}
      {mode === 'ISSUE' ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/70 border border-blue-200/80 rounded-xl text-[12px] text-blue-900">
          <Info className="h-4 w-4 text-blue-600 shrink-0" />
          <span>
            <strong>Только товары в наличии:</strong> позиции с нулевым остатком недоступны для выдачи. Если нужного товара нет на складе, переключите тип заявки на <strong>«Заявка на покупку»</strong>.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-[12px] text-emerald-900">
          <ShoppingCart className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Заявка на закупку:</strong> вы можете запросить пополнение закончившихся товаров склада или заказ новых позиций, которых ещё нет в номенклатуре.
          </span>
        </div>
      )}

      {/* ----------------- CUSTOM ITEM ADD FORM (PURCHASE MODE) ----------------- */}
      {!disabled && isCustomMode && mode === 'PURCHASE' && (
        <div className="p-3.5 bg-gradient-to-r from-emerald-50/60 via-emerald-50/30 to-emerald-50/60 rounded-2xl border border-emerald-200/90 shadow-subtle space-y-3 animate-in fade-in-50 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <Edit3 className="h-3.5 w-3.5 text-emerald-600" />
              Добавление произвольного товара (нет на складе):
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-5">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Наименование товара (например: Проектор, Маркеры белые 10 шт)..."
                className="w-full px-3 py-2 text-[13px] bg-white border border-emerald-300/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-subtle"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomItem();
                  }
                }}
              />
            </div>

            <div className="sm:col-span-2">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={customQuantity}
                onChange={(e) => setCustomQuantity(parseFloat(e.target.value) || 1)}
                placeholder="Кол-во"
                className="w-full px-3 py-2 text-center font-mono font-bold text-[13px] bg-white border border-emerald-300/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-subtle"
              />
            </div>

            <div className="sm:col-span-2">
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
                <option value="кг">кг</option>
                <option value="л">л</option>
                <option value="рулон">рулон</option>
                <option value="м">м</option>
              </select>
            </div>

            <div className="sm:col-span-3 flex items-center gap-1.5">
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value as ItemCategory)}
                className="flex-1 px-2 py-2 text-[12px] bg-white border border-emerald-300/80 rounded-xl focus:outline-none font-medium"
              >
                <option value="STATIONERY">Канцтовары</option>
                <option value="HOUSEHOLD">Хозтовары</option>
                <option value="OTHER">Прочее</option>
              </select>

              <Button
                type="button"
                onClick={handleAddCustomItem}
                disabled={!customName.trim() || customQuantity <= 0}
                className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[12.5px] shadow-sm shrink-0"
              >
                <Plus className="h-4 w-4 mr-0.5" /> Добавить
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- QUICK ADD BAR (FROM WAREHOUSE CATALOG) ----------------- */}
      {!disabled && (!isCustomMode || mode === 'ISSUE') && (
        <div className="p-3 bg-gradient-to-r from-fill-quaternary/70 via-fill-quaternary/40 to-fill-quaternary/70 rounded-2xl border border-separator/80 shadow-subtle space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              {mode === 'PURCHASE'
                ? 'Быстрый выбор из каталога (в т.ч. закончившихся позиций):'
                : 'Быстрый выбор со склада (только товары в наличии):'}
            </span>

            {/* Category filter pills */}
            <div className="flex items-center gap-1">
              {[
                { id: 'ALL', label: 'Все' },
                { id: 'STATIONERY', label: 'Канцтовары' },
                { id: 'HOUSEHOLD', label: 'Хозтовары' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryFilter(c.id)}
                  className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full transition-all ${
                    categoryFilter === c.id
                      ? 'bg-macos-blue text-white shadow-xs'
                      : 'bg-fill-tertiary text-text-secondary hover:bg-fill-secondary'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick-Add Input Row */}
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
                      } else if (filteredQuickItems.length > 0) {
                        const firstValid = mode === 'ISSUE'
                          ? filteredQuickItems.find((i) => i.quantity > 0)
                          : filteredQuickItems[0];
                        if (firstValid) {
                          handleSelectStockItem(firstValid);
                        }
                      }
                    }
                  }}
                  placeholder="Введите название товара (например: бумага, ручки, мыло)..."
                  className="w-full pl-9 pr-8 py-2 text-[13.5px] bg-white border border-separator/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-macos-blue/40 shadow-subtle"
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

              {/* Floating Dropdown List */}
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
                      const isSelectDisabled = mode === 'ISSUE' && isOutOfStock;
                      const isAdded = items.some((it) => it.inventoryItemId === item.id);

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (!isSelectDisabled) {
                              handleSelectStockItem(item);
                            }
                          }}
                          className={`px-3 py-2 rounded-xl flex items-center justify-between gap-2 transition-colors text-[13px] ${
                            isSelectDisabled
                              ? 'opacity-50 cursor-not-allowed bg-rose-50/30'
                              : selectedStockItem?.id === item.id
                              ? 'bg-macos-blue/10 text-macos-blue font-semibold cursor-pointer'
                              : 'hover:bg-fill-quaternary text-text-primary cursor-pointer'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold truncate ${isSelectDisabled ? 'text-text-tertiary line-through' : ''}`}>
                                {item.name}
                              </span>
                              {item.type && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-fill-tertiary text-text-secondary shrink-0">
                                  {item.type === 'STATIONERY'
                                    ? 'Канцтовары'
                                    : item.type === 'HOUSEHOLD'
                                    ? 'Хозтовары'
                                    : 'Прочее'}
                                </span>
                              )}
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
                            <span
                              className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                                isOutOfStock
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {isOutOfStock
                                ? mode === 'ISSUE'
                                  ? '0 (нет в наличии)'
                                  : '0 (требуется закупка)'
                                : `На складе: ${item.quantity} ${item.unit}`}
                            </span>
                            {selectedStockItem?.id === item.id && (
                              <Check className="h-4 w-4 text-macos-blue" />
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
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-28 relative">
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(parseFloat(e.target.value) || 1)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleQuickAdd();
                    }
                  }}
                  className="h-10 text-center font-mono font-bold text-[13.5px] pr-8"
                  placeholder="Кол-во"
                />
                <span className="absolute right-2.5 top-2.5 text-[11px] font-bold text-text-tertiary uppercase pointer-events-none">
                  {selectedStockItem?.unit || 'шт'}
                </span>
              </div>

              {/* Add Button */}
              <Button
                type="button"
                onClick={handleQuickAdd}
                disabled={!selectedStockItem || addQuantity <= 0 || (mode === 'ISSUE' && (selectedStockItem?.quantity ?? 0) <= 0)}
                className={`h-10 px-4 text-white font-semibold text-[13px] shadow-sm shrink-0 ${
                  mode === 'PURCHASE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-macos-blue hover:bg-macos-blue/90'
                }`}
              >
                <Plus className="h-4 w-4 mr-1" /> Добавить
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- CATALOG BROWSER DRAWER (EXPANDABLE) ----------------- */}
      {showCatalogModal && (
        <div className="p-3.5 bg-fill-quaternary/40 border border-separator/70 rounded-2xl space-y-3 animate-in fade-in-50 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-macos-blue" />
              <span className="font-bold text-[13px] text-text-primary">
                Каталог склада (выбор в 1 клик):
              </span>
            </div>

            {/* Catalog search + category filter */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Фильтр в каталоге..."
                className="h-7 text-[12px] px-2.5 bg-white border border-separator/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-macos-blue w-40"
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
              const isZeroDisabled = mode === 'ISSUE' && isZero;

              return (
                <div
                  key={cItem.id}
                  className={`p-2.5 rounded-xl border flex flex-col justify-between gap-1.5 transition-all ${
                    isZeroDisabled
                      ? 'bg-fill-quaternary/30 border-separator/50 opacity-60'
                      : isAdded
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-white border-separator/80 hover:border-macos-blue/60 shadow-subtle'
                  }`}
                >
                  <div className="min-w-0">
                    <div className={`font-semibold text-[12.5px] text-text-primary truncate ${isZeroDisabled ? 'line-through text-text-tertiary' : ''}`} title={cItem.name}>
                      {cItem.name}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-text-tertiary mt-0.5">
                      <span>{cItem.unit}</span>
                      <span
                        className={`font-semibold ${
                          isZero ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {isZero ? '0 на складе' : `${cItem.quantity} ${cItem.unit}`}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isZeroDisabled}
                    onClick={() => handleCatalogDirectAdd(cItem)}
                    className={`w-full py-1 text-[11.5px] font-bold rounded-lg flex items-center justify-center gap-1 transition-colors ${
                      isZeroDisabled
                        ? 'bg-fill-quaternary text-text-tertiary cursor-not-allowed'
                        : isAdded
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-fill-tertiary hover:bg-macos-blue hover:text-white text-text-primary'
                    }`}
                  >
                    {isZeroDisabled ? (
                      '✕ Нет на складе'
                    ) : (
                      <>
                        <Plus className="h-3 w-3" />
                        {isAdded ? '+1 ещё' : 'Добавить'}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------- CHOSEN ITEMS TABLE / BASKET ----------------- */}
      <div className="rounded-2xl border border-separator/80 bg-white overflow-hidden shadow-subtle">
        <div className="px-3.5 py-2.5 bg-fill-quaternary/40 border-b border-separator/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold uppercase tracking-wider text-text-tertiary">
              Выбранные позиции:
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
          <div className="py-10 text-center text-text-tertiary px-4 space-y-1.5">
            <ShoppingBag className="h-8 w-8 mx-auto text-text-tertiary/50" />
            <p className="text-[13px] font-medium text-text-secondary">
              В заявке пока нет позиций
            </p>
            <p className="text-[11.5px] text-text-tertiary max-w-sm mx-auto">
              {mode === 'PURCHASE'
                ? 'Воспользуйтесь строкой быстрого поиска или нажмите «+ Произвольный товар» для добавления позиций.'
                : 'Воспользуйтесь строкой быстрого поиска или откройте «Каталог склада» для добавления имеющихся товаров.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-separator/40 max-h-[38vh] overflow-y-auto">
            {items.map((row, idx) => {
              // Find matching stock item for warning
              const stock = warehouseItems.find((w) => w.id === row.inventoryItemId);
              const inStockQty = stock?.quantity ?? 0;
              const isOverStock = mode === 'ISSUE' && stock && row.quantity > inStockQty;
              const isCustom = !row.inventoryItemId;

              return (
                <div
                  key={idx}
                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-fill-quaternary/20 transition-colors"
                >
                  {/* Item info */}
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <span className="text-[12px] font-mono font-bold text-text-tertiary w-5 pt-0.5 shrink-0 text-center">
                      {idx + 1}.
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
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
                        {isCustom && (
                          <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded">
                            Заказная позиция
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1 text-[11.5px] text-text-tertiary">
                        {stock ? (
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              isOverStock
                                ? 'text-amber-700'
                                : inStockQty <= 0
                                ? 'text-rose-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            На складе: {inStockQty} {row.unit}
                            {isOverStock && ' (меньше запрошенного)'}
                          </span>
                        ) : isCustom ? (
                          <span className="text-text-secondary italic">
                            Вне складского каталога
                          </span>
                        ) : null}
                        <span>Ед. изм: {row.unit}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper & Remove */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {/* Stepper Controls */}
                    <div className="flex items-center border border-separator/80 rounded-xl bg-white shadow-xs overflow-hidden">
                      <button
                        type="button"
                        disabled={disabled || row.quantity <= 1}
                        onClick={() =>
                          onUpdateQuantity(idx, Math.max(1, (Number(row.quantity) || 1) - 1))
                        }
                        className="p-1.5 text-text-secondary hover:bg-fill-tertiary disabled:opacity-30 transition-colors"
                        title="Уменьшить на 1"
                      >
                        <MinusCircle className="h-4 w-4" />
                      </button>

                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        disabled={disabled}
                        value={row.quantity}
                        onChange={(e) =>
                          onUpdateQuantity(idx, parseFloat(e.target.value) || 0)
                        }
                        className="w-14 text-center font-mono font-bold text-[13px] border-x border-separator/50 py-1 focus:outline-none focus:bg-macos-blue/5"
                      />

                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() =>
                          onUpdateQuantity(idx, (Number(row.quantity) || 0) + 1)
                        }
                        className="p-1.5 text-text-secondary hover:bg-fill-tertiary disabled:opacity-30 transition-colors"
                        title="Увеличить на 1"
                      >
                        <PlusCircle className="h-4 w-4" />
                      </button>
                    </div>

                    <span className="text-[12px] font-bold text-text-secondary font-mono w-7">
                      {row.unit}
                    </span>

                    {/* Delete button */}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => onRemove(idx)}
                        className="p-1.5 rounded-lg text-text-tertiary hover:text-macos-red hover:bg-rose-50 transition-colors"
                        title="Удалить позицию"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-1.5 text-macos-red text-[12px] font-semibold bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
