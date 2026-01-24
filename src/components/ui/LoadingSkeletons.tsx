'use client';

import { cn } from '@/lib/utils';

// Base skeleton component
interface SkeletonBaseProps {
  className?: string;
}

export function SkeletonPulse({ className }: SkeletonBaseProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-surface-200 dark:bg-surface-700',
        className
      )}
    />
  );
}

// Card skeleton
export function CardSkeleton({ className }: SkeletonBaseProps) {
  return (
    <div className={cn('p-6 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800', className)}>
      <SkeletonPulse className="h-4 w-1/3 mb-4" />
      <SkeletonPulse className="h-8 w-1/2 mb-2" />
      <SkeletonPulse className="h-3 w-2/3" />
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonPulse className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

// Chart skeleton
export function ChartSkeleton({ className }: SkeletonBaseProps) {
  return (
    <div className={cn('w-full h-[300px] rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center', className)}>
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-surface-300 dark:border-surface-600 border-t-primary-500 rounded-full animate-spin" />
        <span className="text-sm text-surface-400 dark:text-surface-500">Loading chart...</span>
      </div>
    </div>
  );
}

// List skeleton
export function ListSkeleton({ items = 5, className }: SkeletonBaseProps & { items?: number }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <SkeletonPulse className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <SkeletonPulse className="h-4 w-3/4 mb-2" />
            <SkeletonPulse className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Dashboard KPI skeleton
export function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// Full page skeleton
export function PageSkeleton() {
  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <SkeletonPulse className="h-8 w-48 mb-2" />
          <SkeletonPulse className="h-4 w-32" />
        </div>
        <SkeletonPulse className="h-10 w-32" />
      </div>
      <KPISkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}
