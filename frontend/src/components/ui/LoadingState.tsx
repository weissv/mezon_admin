// src/components/ui/LoadingState.tsx
// Компоненты для отображения состояний загрузки

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

// ============================================================================
// СПИННЕР
// ============================================================================

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const spinnerSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <Loader2 
      className={cn(
        'animate-spin text-[var(--mezon-accent)]',
        spinnerSizes[size],
        className
      )} 
    />
  );
}

// ============================================================================
// ПОЛНОЭКРАННЫЙ ЗАГРУЗЧИК
// ============================================================================

interface FullPageLoaderProps {
  message?: string;
}

export function FullPageLoader({ message = 'Загрузка...' }: FullPageLoaderProps) {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <Spinner size="xl" />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );
}

// ============================================================================
// ЗАГРУЗЧИК ДЛЯ КАРТОЧКИ/СЕКЦИИ
// ============================================================================

interface LoadingCardProps {
  className?: string;
  message?: string;
  height?: string | number;
}

export function LoadingCard({ className, message, height = 200 }: LoadingCardProps) {
  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center bg-gray-50 rounded-lg',
        className
      )}
      style={{ minHeight: height }}
    >
      <Spinner size="lg" />
      {message && <p className="mt-2 text-sm text-gray-500">{message}</p>}
    </div>
  );
}

// ============================================================================
// СКЕЛЕТОН ЗАГРУЗКИ
// ============================================================================

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

export function Skeleton({ 
  className, 
  width, 
  height, 
  rounded = 'md' 
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200',
        roundedClasses[rounded],
        className
      )}
      style={{ width, height }}
    />
  );
}

// Предустановленные скелетоны
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          height={16} 
          width={i === lines - 1 ? '60%' : '100%'} 
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 border rounded-lg', className)}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton width={48} height={48} rounded="full" />
        <div className="flex-1">
          <Skeleton height={20} width="60%" className="mb-2" />
          <Skeleton height={14} width="40%" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 p-3 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height={16} className="flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="p-3 flex gap-4 border-t">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height={16} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// INLINE ЗАГРУЗЧИК
// ============================================================================

interface InlineLoaderProps {
  text?: string;
  className?: string;
}

export function InlineLoader({ text = 'Загрузка...', className }: InlineLoaderProps) {
  return (
    <div className={cn('inline-flex items-center gap-2 text-gray-500', className)}>
      <Spinner size="sm" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

// ============================================================================
// ОВЕРЛЕЙ ЗАГРУЗКИ
// ============================================================================

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  blur?: boolean;
}

export function LoadingOverlay({ 
  isLoading, 
  children, 
  message,
  blur = true 
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div 
          className={cn(
            'absolute inset-0 bg-white bg-opacity-70 flex flex-col items-center justify-center z-10',
            blur && 'backdrop-blur-sm'
          )}
        >
          <Spinner size="lg" />
          {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
        </div>
      )}
    </div>
  );
}
