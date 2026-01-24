'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface TenderProgressBarProps {
  percentage: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact';
}

export function TenderProgressBar({
  percentage,
  className,
  showLabel = true,
  size = 'md',
  variant = 'default',
}: TenderProgressBarProps) {
  // Ensure percentage is within bounds
  const progress = Math.min(100, Math.max(0, percentage));

  // Determine color based on progress
  const getProgressColor = () => {
    if (progress >= 100) return 'bg-emerald-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-amber-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getProgressTextColor = () => {
    if (progress >= 100) return 'text-emerald-600';
    if (progress >= 75) return 'text-blue-600';
    if (progress >= 50) return 'text-amber-600';
    if (progress >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusIcon = () => {
    if (progress >= 100) return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    if (progress >= 50) return <Clock className="w-3.5 h-3.5 text-amber-500" />;
    return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
  };

  const getStatusText = () => {
    if (progress >= 100) return 'Terminé';
    if (progress >= 75) return 'Presque fini';
    if (progress >= 50) return 'En bonne voie';
    if (progress >= 25) return 'En cours';
    return 'À démarrer';
  };

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn('flex-1 rounded-full bg-slate-200 overflow-hidden', sizeClasses[size])}>
          <motion.div
            className={cn('h-full rounded-full', getProgressColor())}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <span className={cn('text-xs font-semibold tabular-nums', getProgressTextColor())}>
          {progress}%
        </span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {getStatusIcon()}
            <span className="text-xs font-medium text-slate-600">{getStatusText()}</span>
          </div>
          <span className={cn('text-sm font-bold tabular-nums', getProgressTextColor())}>
            {progress}%
          </span>
        </div>
      )}
      <div className={cn('w-full rounded-full bg-slate-200 overflow-hidden', sizeClasses[size])}>
        <motion.div
          className={cn('h-full rounded-full', getProgressColor())}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// Circular progress variant
interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function TenderCircularProgress({
  percentage,
  size = 48,
  strokeWidth = 4,
  className,
}: CircularProgressProps) {
  const progress = Math.min(100, Math.max(0, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getColor = () => {
    if (progress >= 100) return 'stroke-emerald-500';
    if (progress >= 75) return 'stroke-blue-500';
    if (progress >= 50) return 'stroke-amber-500';
    if (progress >= 25) return 'stroke-orange-500';
    return 'stroke-red-500';
  };

  const getTextColor = () => {
    if (progress >= 100) return 'text-emerald-600';
    if (progress >= 75) return 'text-blue-600';
    if (progress >= 50) return 'text-amber-600';
    if (progress >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={getColor()}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('text-xs font-bold tabular-nums', getTextColor())}>
          {progress}%
        </span>
      </div>
    </div>
  );
}

export default TenderProgressBar;
