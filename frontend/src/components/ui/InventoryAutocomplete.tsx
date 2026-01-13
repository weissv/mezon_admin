// src/components/ui/InventoryAutocomplete.tsx
import { useState, useEffect, useRef } from 'react';
import { Control, useController } from 'react-hook-form';
import { api } from '../../lib/api';
import { Input } from './input';

export interface InventoryItem {
  name: string;
  unit: string;
}

interface InventoryAutocompleteProps {
  name: string;
  control: Control<any>;
  onSelect: (item: InventoryItem) => void;
  placeholder?: string;
  className?: string;
}

export function InventoryAutocomplete({
  name,
  control,
  onSelect,
  placeholder = 'Наименование товара',
  className = '',
}: InventoryAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<InventoryItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { field } = useController({
    name,
    control,
  });

  // Поиск товаров с дебаунсом
  const searchItems = async (query: string) => {
    if (!query || query.trim().length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await api.get(`/api/inventory/search?q=${encodeURIComponent(query)}`);
      setSuggestions(results || []);
      setIsOpen(results && results.length > 0);
    } catch (error) {
      console.error('Failed to search inventory:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработка ввода с дебаунсом 300ms
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    field.onChange(value);

    // Очищаем предыдущий таймер
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Устанавливаем новый таймер
    debounceRef.current = setTimeout(() => {
      searchItems(value);
    }, 300);
  };

  // Выбор элемента из списка
  const handleSelect = (item: InventoryItem) => {
    field.onChange(item.name);
    setSuggestions([]);
    setIsOpen(false);
    onSelect(item);
  };

  // Закрытие списка при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        {...field}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`text-sm ${className}`}
        autoComplete="off"
      />
      
      {/* Индикатор загрузки */}
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Выпадающий список предложений */}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((item, index) => (
            <li
              key={`${item.name}-${index}`}
              onClick={() => handleSelect(item)}
              className="px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors flex justify-between items-center text-sm"
            >
              <span className="font-medium text-gray-800">{item.name}</span>
              <span className="text-gray-500 text-xs bg-gray-100 px-2 py-0.5 rounded">
                {item.unit}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
