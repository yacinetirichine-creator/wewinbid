'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui';
import type { ComponentType } from 'react';

// Chart loading placeholder
const ChartSkeleton = () => (
  <div className="w-full h-[300px] bg-surface-100 dark:bg-surface-800 rounded-lg animate-pulse flex items-center justify-center">
    <span className="text-surface-400 dark:text-surface-500">Loading chart...</span>
  </div>
);

// Lazy-loaded Recharts components for better code splitting
// These will be loaded only when the chart components are actually rendered

export const LazyLineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart as ComponentType<any>),
  { loading: () => <ChartSkeleton />, ssr: false }
);

export const LazyBarChart = dynamic(
  () => import('recharts').then((mod) => mod.BarChart as ComponentType<any>),
  { loading: () => <ChartSkeleton />, ssr: false }
);

export const LazyAreaChart = dynamic(
  () => import('recharts').then((mod) => mod.AreaChart as ComponentType<any>),
  { loading: () => <ChartSkeleton />, ssr: false }
);

export const LazyPieChart = dynamic(
  () => import('recharts').then((mod) => mod.PieChart as ComponentType<any>),
  { loading: () => <ChartSkeleton />, ssr: false }
);

// Re-export other recharts components for convenience
// These are small and tree-shake well
export {
  Line,
  Bar,
  Area,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
