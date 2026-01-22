'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  PieChart,
  BarChart3,
  Activity,
} from 'lucide-react';
import { Card, CardHeader, CardContent, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

// Types
interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface TrendDataPoint {
  date: string;
  value: number;
}

// Couleurs par défaut pour les graphiques
const DEFAULT_COLORS = [
  '#6366f1', // indigo
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
];

/**
 * Graphique en barres horizontales
 */
export function HorizontalBarChart({
  data,
  title,
  subtitle,
  maxValue,
  showPercentage = true,
  className,
}: {
  data: ChartDataPoint[];
  title: string;
  subtitle?: string;
  maxValue?: number;
  showPercentage?: boolean;
  className?: string;
}) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary-500" />
          <div>
            <h3 className="font-semibold text-surface-900">{title}</h3>
            {subtitle && <p className="text-sm text-surface-500">{subtitle}</p>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, idx) => {
            const percentage = Math.round((item.value / max) * 100);
            const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];

            return (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-surface-700">{item.label}</span>
                  <span className="text-sm text-surface-500">
                    {item.value}
                    {showPercentage && ` (${percentage}%)`}
                  </span>
                </div>
                <div className="h-3 bg-surface-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Graphique en cercle (Donut)
 */
export function DonutChart({
  data,
  title,
  subtitle,
  centerLabel,
  centerValue,
  className,
}: {
  data: ChartDataPoint[];
  title: string;
  subtitle?: string;
  centerLabel?: string;
  centerValue?: string | number;
  className?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const segments = useMemo(() => {
    let offset = 0;
    return data.map((item, idx) => {
      const percentage = total > 0 ? (item.value / total) * 100 : 0;
      const segment = {
        ...item,
        percentage,
        color: item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
        offset,
        dashArray: `${percentage} ${100 - percentage}`,
      };
      offset += percentage;
      return segment;
    });
  }, [data, total]);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-primary-500" />
          <div>
            <h3 className="font-semibold text-surface-900">{title}</h3>
            {subtitle && <p className="text-sm text-surface-500">{subtitle}</p>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Donut SVG */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="transparent"
                stroke="#e5e7eb"
                strokeWidth="3"
              />
              {/* Data segments */}
              {segments.map((segment, idx) => (
                <motion.circle
                  key={segment.label}
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="transparent"
                  stroke={segment.color}
                  strokeWidth="3"
                  strokeDasharray={segment.dashArray}
                  strokeDashoffset={-segment.offset}
                  initial={{ strokeDasharray: '0 100' }}
                  animate={{ strokeDasharray: segment.dashArray }}
                  transition={{ duration: 0.8, delay: idx * 0.1 }}
                />
              ))}
            </svg>
            {/* Center text */}
            {(centerLabel || centerValue) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {centerValue && (
                  <span className="text-2xl font-bold text-surface-900">{centerValue}</span>
                )}
                {centerLabel && (
                  <span className="text-xs text-surface-500">{centerLabel}</span>
                )}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            {segments.map((segment) => (
              <div key={segment.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-sm text-surface-600">{segment.label}</span>
                </div>
                <span className="text-sm font-medium text-surface-900">
                  {segment.value} ({Math.round(segment.percentage)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Graphique de tendance (ligne)
 */
export function TrendChart({
  data,
  title,
  subtitle,
  valueFormatter = (v) => String(v),
  trend,
  trendLabel,
  color = '#6366f1',
  className,
}: {
  data: TrendDataPoint[];
  title: string;
  subtitle?: string;
  valueFormatter?: (value: number) => string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  color?: string;
  className?: string;
}) {
  const { points, viewBox, min, max } = useMemo(() => {
    if (data.length === 0) return { points: '', viewBox: '0 0 100 40', min: 0, max: 0 };

    const values = data.map((d) => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const width = 100;
    const height = 40;
    const padding = 2;

    const pts = data.map((d, i) => {
      const x = (i / (data.length - 1 || 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((d.value - minVal) / range) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    return { points: pts, viewBox: `0 0 ${width} ${height}`, min: minVal, max: maxVal };
  }, [data]);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" />
            <div>
              <h3 className="font-semibold text-surface-900">{title}</h3>
              {subtitle && <p className="text-sm text-surface-500">{subtitle}</p>}
            </div>
          </div>
          {trend && trendLabel && (
            <Badge
              variant={trend === 'up' ? 'success' : trend === 'down' ? 'danger' : 'secondary'}
              className="flex items-center gap-1"
            >
              <TrendIcon className="w-3 h-3" />
              {trendLabel}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-24">
          <svg viewBox={viewBox} className="w-full h-full">
            {/* Grid lines */}
            <line x1="0" y1="10" x2="100" y2="10" stroke="#e5e7eb" strokeWidth="0.5" />
            <line x1="0" y1="20" x2="100" y2="20" stroke="#e5e7eb" strokeWidth="0.5" />
            <line x1="0" y1="30" x2="100" y2="30" stroke="#e5e7eb" strokeWidth="0.5" />

            {/* Gradient fill */}
            <defs>
              <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Area fill */}
            {points && (
              <motion.polygon
                points={`2,40 ${points} 98,40`}
                fill="url(#trendGradient)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
            )}

            {/* Line */}
            {points && (
              <motion.polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1 }}
              />
            )}

            {/* Data points */}
            {data.map((d, i) => {
              const x = (i / (data.length - 1 || 1)) * 96 + 2;
              const y = 40 - 4 - ((d.value - min) / (max - min || 1)) * 32;
              return (
                <motion.circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="2"
                  fill={color}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                />
              );
            })}
          </svg>
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between text-xs text-surface-400 mt-2">
          {data.length > 0 && (
            <>
              <span>{data[0].date}</span>
              {data.length > 2 && <span>{data[Math.floor(data.length / 2)].date}</span>}
              <span>{data[data.length - 1].date}</span>
            </>
          )}
        </div>

        {/* Min/Max values */}
        <div className="flex justify-between text-xs mt-2 text-surface-500">
          <span>Min: {valueFormatter(min)}</span>
          <span>Max: {valueFormatter(max)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Grille de métriques
 */
export function MetricsGrid({
  metrics,
  className,
}: {
  metrics: Array<{
    label: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }>;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const TrendIcon = metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingDown : null;

        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-white border border-surface-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${metric.color}20` }}
              >
                <Icon className="w-5 h-5" />
              </div>
              {TrendIcon && metric.change && (
                <Badge
                  variant={metric.trend === 'up' ? 'success' : metric.trend === 'down' ? 'danger' : 'secondary'}
                  size="sm"
                  className="ml-auto"
                >
                  <TrendIcon className="w-3 h-3 mr-0.5" />
                  {metric.change}
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-surface-900">{metric.value}</p>
            <p className="text-sm text-surface-500 mt-1">{metric.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * Tableau de classement (Leaderboard)
 */
export function LeaderboardWidget({
  items,
  title,
  subtitle,
  valueLabel = 'Score',
  className,
}: {
  items: Array<{
    rank: number;
    name: string;
    value: number;
    avatar?: string;
    change?: 'up' | 'down' | 'same';
  }>;
  title: string;
  subtitle?: string;
  valueLabel?: string;
  className?: string;
}) {
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'from-slate-300 to-slate-500 text-white';
      case 3:
        return 'from-amber-600 to-amber-800 text-white';
      default:
        return 'from-surface-100 to-surface-200 text-surface-600';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div>
          <h3 className="font-semibold text-surface-900">{title}</h3>
          {subtitle && <p className="text-sm text-surface-500">{subtitle}</p>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 transition-colors"
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-gradient-to-br',
                  getRankColor(item.rank)
                )}
              >
                {item.rank}
              </div>
              {item.avatar ? (
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center">
                  <span className="text-sm font-medium text-surface-600">
                    {item.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-surface-900 truncate">{item.name}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-surface-900">{item.value}</p>
                <p className="text-xs text-surface-500">{valueLabel}</p>
              </div>
              {item.change && (
                <div
                  className={cn(
                    'w-5 h-5 flex items-center justify-center',
                    item.change === 'up' && 'text-green-500',
                    item.change === 'down' && 'text-red-500',
                    item.change === 'same' && 'text-surface-400'
                  )}
                >
                  {item.change === 'up' && <TrendingUp className="w-4 h-4" />}
                  {item.change === 'down' && <TrendingDown className="w-4 h-4" />}
                  {item.change === 'same' && <ArrowRight className="w-4 h-4" />}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Widget de comparaison
 */
export function ComparisonWidget({
  title,
  items,
  className,
}: {
  title: string;
  items: Array<{
    label: string;
    current: number;
    previous: number;
    unit?: string;
  }>;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <h3 className="font-semibold text-surface-900">{title}</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => {
            const change = item.previous > 0 
              ? Math.round(((item.current - item.previous) / item.previous) * 100)
              : 0;
            const isPositive = change >= 0;

            return (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-surface-600">{item.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-surface-400 line-through">
                    {item.previous}{item.unit}
                  </span>
                  <ArrowRight className="w-4 h-4 text-surface-300" />
                  <span className="font-semibold text-surface-900">
                    {item.current}{item.unit}
                  </span>
                  <Badge
                    variant={isPositive ? 'success' : 'danger'}
                    size="sm"
                  >
                    {isPositive ? '+' : ''}{change}%
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
