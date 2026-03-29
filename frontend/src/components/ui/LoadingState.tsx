// src/components/ui/LoadingState.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

/* ── Spinner ── */
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
      className={cn('animate-spin text-[#007AFF]', spinnerSizes[size], className)}
    />
  );
}

/* ── Full-page loader ── */
interface FullPageLoaderProps {
  message?: string;
}

export function FullPageLoader({ message = 'Загрузка...' }: FullPageLoaderProps) {
  return (
    <div className="fixed inset-0 bg-[#F5F5F7]/80 backdrop-blur-[20px] z-50 flex flex-col items-center justify-center">
      <Spinner size="xl" />
      <p className="mt-4 text-[13px] text-[#86868B] tracking-[-0.01em]">{message}</p>
    </div>
  );
}

/* ── Card / section loader ── */
interface LoadingCardProps {
  className?: string;
  message?: string;
  height?: string | number;
}

export function LoadingCard({ className, message, height = 200 }: LoadingCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[10px]',
        'bg-[rgba(0,0,0,0.02)]',
        className
      )}
      style={{ minHeight: height }}
    >
      <Spinner size="lg" />
      {message && <p className="mt-2 text-[12px] text-[#86868B]">{message}</p>}
    </div>
  );
}

/* ── Skeleton ── */
interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-[8px]',
  lg: 'rounded-[14px]',
  full: 'rounded-full',
};

export function Skeleton({ className, width, height, rounded = 'md' }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse bg-[rgba(0,0,0,0.06)]', roundedClasses[rounded], className)}
      style={{ width, height }}
    />
  );
}

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
    <div className={cn('p-4 border border-[rgba(0,0,0,0.06)] rounded-[14px]', className)}>
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
    <div className="border border-[rgba(0,0,0,0.06)] rounded-[10px] overflow-hidden">
      {/* Header */}
      <div className="bg-[rgba(0,0,0,0.03)] p-3 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height={14} className="flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="p-3 flex gap-4 border-t border-[rgba(0,0,0,0.04)]">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton key={colIdx} height={16} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
