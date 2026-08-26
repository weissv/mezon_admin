// src/components/ui/WarehouseItemPicker.tsx
import { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { Search, ChevronDown, Check, Package, AlertCircle, X } from 'lucide-react';
import { ItemCategory, itemCategoryLabels, itemCategoryColors } from '../../types/maintenance';

export interface WarehouseItem {
  id: number;
  name: string;
  unit: string;
  quantity: number;
  type: string;
}

interface WarehouseItemPickerProps {
  value?: number | null;
  selectedName?: string;
  selectedUnit?: string;
  selectedCategory?: ItemCategory;
  onSelect: (item: WarehouseItem) => void;
  onClear?: () => void;
  disabled?: boolean;
  error?: string;
  excludeItemIds?: number[];
}

export function WarehouseItemPicker({
  value,
  selectedName,
  selectedUnit,
  selectedCategory,
  onSelect,
  onClear,
  disabled = false,
  error,
  excludeItemIds = [],
}: WarehouseItemPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Загружаем список товаров со склада
  const loadWarehouseItems = async (query = '') => {
    setLoading(true);
    try {
      if (query.trim()) {
        const results = await api.get(`/api/inventory/search?q=${encodeURIComponent(query.trim())}`);
        setItems(results || []);
      } else {
        const results = await api.get('/api/inventory');
        const list = Array.isArray(results) ? results : (results?.items || results?.data || []);
        setItems(list);
      }
    } catch (err) {
      console.error('Ошибка загрузки товаров со склада:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadWarehouseItems(searchQuery);
    }
  }, [isOpen]);

  // Поиск с дебаунсом
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      loadWarehouseItems(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Закрытие при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleSelectItem = (item: WarehouseItem) => {
    onSelect(item);
    setIsOpen(false);
    setSearchQuery('');
  };

  const selectedItemObj = items.find((i) => i.id === value);
  const displayName = selectedName || selectedItemObj?.name;
  const displayUnit = selectedUnit || selectedItemObj?.unit;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Кнопка-триггер выбора позиции */}
      <div
        onClick={handleOpen}
        className={`w-full min-h-[42px] px-3 py-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all duration-150 ${
          disabled
            ? 'bg-fill-quaternary/50 border-separator/40 cursor-not-allowed text-secondary opacity-80'
            : error
            ? 'border-macos-red/80 bg-rose-50/40 ring-1 ring-macos-red/30'
            : isOpen
            ? 'border-macos-blue bg-white ring-2 ring-macos-blue/20 shadow-sm'
            : 'border-separator/80 bg-white hover:border-separator-hover shadow-subtle'
        }`}
      >
        {displayName ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Package className="h-4 w-4 text-macos-blue shrink-0" />
            <span className="font-semibold text-[13.5px] text-text-primary truncate">
              {displayName}
            </span>
            {displayUnit && (
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-fill-tertiary text-secondary shrink-0">
                {displayUnit}
              </span>
            )}
            {selectedCategory && (
              <span
                className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${
                  itemCategoryColors[selectedCategory] || 'bg-gray-100 text-gray-700'
                }`}
              >
                {itemCategoryLabels[selectedCategory] || selectedCategory}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-text-tertiary text-[13px]">
            <Search className="h-4 w-4" />
            <span>Выберите товар со склада...</span>
          </div>
        )}

        <div className="flex items-center gap-1 shrink-0">
          {displayName && !disabled && onClear && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="p-1 rounded-md text-text-tertiary hover:text-macos-red hover:bg-fill-quaternary transition-colors"
              title="Сбросить выбор"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown
            className={`h-4 w-4 text-text-tertiary transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-macos-blue' : ''
            }`}
          />
        </div>
      </div>

      {/* Выпадающее меню поиска и выбора */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-separator/80 rounded-2xl shadow-elevated overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Поле живого поиска */}
          <div className="p-2 border-b border-separator/60 bg-fill-quaternary/30">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-tertiary" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию или типу..."
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
          </div>

          {/* Список доступных позиций */}
          <div className="max-h-60 overflow-y-auto divide-y divide-separator/30 p-1">
            {loading ? (
              <div className="py-6 text-center text-[12.5px] text-text-secondary flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-macos-blue border-t-transparent" />
                <span>Загрузка складских позиций...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="py-6 text-center text-[12.5px] text-text-tertiary">
                <AlertCircle className="h-5 w-5 mx-auto mb-1 text-text-tertiary/70" />
                {searchQuery ? 'Товаров не найдено' : 'На складе нет доступных товаров'}
              </div>
            ) : (
              items.map((item) => {
                const isSelected = item.id === value;
                const isExcluded = excludeItemIds.includes(item.id) && !isSelected;
                const isOutOfStock = item.quantity <= 0;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isExcluded) return;
                      handleSelectItem(item);
                    }}
                    className={`px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer text-[13px] ${
                      isSelected
                        ? 'bg-macos-blue/10 text-macos-blue font-semibold'
                        : isExcluded
                        ? 'opacity-40 cursor-not-allowed bg-fill-quaternary/40'
                        : 'hover:bg-fill-quaternary text-text-primary'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{item.name}</span>
                        {item.type && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-fill-tertiary text-text-secondary">
                            {item.type === 'STATIONERY'
                              ? 'Канцтовары'
                              : item.type === 'HOUSEHOLD'
                              ? 'Хозтовары'
                              : item.type === 'FOOD'
                              ? 'Продукты'
                              : 'Техника'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11.5px] text-text-tertiary">
                        <span>Ед. изм: {item.unit}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                          isOutOfStock
                            ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                        }`}
                      >
                        {isOutOfStock ? '0 (нет в наличии)' : `${item.quantity} ${item.unit}`}
                      </span>

                      {isSelected && <Check className="h-4 w-4 text-macos-blue" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
