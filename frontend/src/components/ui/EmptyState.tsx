// src/components/ui/EmptyState.tsx
// Компоненты для отображения пустых состояний

import React from 'react';
import { LucideIcon, Inbox, Search, FileQuestion, AlertCircle, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: {
    container: 'py-8 px-4',
    icon: 'w-10 h-10',
    iconWrapper: 'w-16 h-16',
    title: 'text-base',
    description: 'text-sm',
  },
  md: {
    container: 'py-12 px-6',
    icon: 'w-12 h-12',
    iconWrapper: 'w-20 h-20',
    title: 'text-lg',
    description: 'text-sm',
  },
  lg: {
    container: 'py-16 px-8',
    icon: 'w-16 h-16',
    iconWrapper: 'w-24 h-24',
    title: 'text-xl',
    description: 'text-base',
  },
};

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  const sizes = sizeClasses[size];
  const ActionIcon = action?.icon || Plus;

  return (
    <div className={cn('text-center', sizes.container, className)}>
      <div
        className={cn(
          'mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4',
          sizes.iconWrapper
        )}
      >
        <Icon className={cn('text-gray-400', sizes.icon)} />
      </div>
      <h3 className={cn('font-semibold text-gray-900 mb-1', sizes.title)}>
        {title}
      </h3>
      {description && (
        <p className={cn('text-gray-500 mb-4', sizes.description)}>
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          <ActionIcon className="w-4 h-4 mr-2" />
          {action.label}
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// ПРЕДУСТАНОВЛЕННЫЕ ПУСТЫЕ СОСТОЯНИЯ
// ============================================================================

interface PresetEmptyStateProps {
  onAction?: () => void;
  className?: string;
}

export function NoDataState({ onAction, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={Inbox}
      title="Нет данных"
      description="Данные ещё не добавлены в систему"
      action={onAction ? { label: 'Добавить', onClick: onAction } : undefined}
      className={className}
    />
  );
}

export function NoSearchResultsState({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={Search}
      title="Ничего не найдено"
      description="Попробуйте изменить параметры поиска или фильтры"
      className={className}
    />
  );
}

export function NotFoundState({ onAction, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={FileQuestion}
      title="Страница не найдена"
      description="Запрашиваемая страница не существует или была удалена"
      action={onAction ? { label: 'На главную', onClick: onAction } : undefined}
      className={className}
    />
  );
}

export function ErrorState({ 
  message, 
  onRetry, 
  className 
}: { 
  message?: string; 
  onRetry?: () => void; 
  className?: string 
}) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Произошла ошибка"
      description={message || 'Не удалось загрузить данные'}
      action={onRetry ? { label: 'Повторить', onClick: onRetry } : undefined}
      className={className}
    />
  );
}

// ============================================================================
// СОСТОЯНИЕ ДЛЯ СПИСКОВ
// ============================================================================

interface ListEmptyStateProps {
  itemName: string;
  itemNamePlural?: string;
  onAdd?: () => void;
  className?: string;
}

export function ListEmptyState({
  itemName,
  itemNamePlural,
  onAdd,
  className,
}: ListEmptyStateProps) {
  const plural = itemNamePlural || `${itemName}ы`;
  
  return (
    <EmptyState
      icon={Inbox}
      title={`${plural} не найдены`}
      description={`Добавьте ${itemName.toLowerCase()}, чтобы начать работу`}
      action={onAdd ? { label: `Добавить ${itemName.toLowerCase()}`, onClick: onAdd } : undefined}
      className={className}
    />
  );
}
