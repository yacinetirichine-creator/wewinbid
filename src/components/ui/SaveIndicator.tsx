'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, CloudOff, Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SaveStatus } from '@/hooks/useAutoSave';

interface SaveIndicatorProps {
  status: SaveStatus;
  lastSaved: Date | null;
  className?: string;
}

export function SaveIndicator({ status, lastSaved, className }: SaveIndicatorProps) {
  const getIcon = () => {
    switch (status) {
      case 'saving':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'saved':
        return <Check className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Cloud className="w-4 h-4" />;
    }
  };

  const getMessage = () => {
    switch (status) {
      case 'saving':
        return 'Sauvegarde...';
      case 'saved':
        return 'Sauvegardé';
      case 'error':
        return 'Erreur de sauvegarde';
      default:
        if (lastSaved) {
          const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
          if (seconds < 60) return 'Sauvegardé';
          const minutes = Math.floor(seconds / 60);
          if (minutes < 60) return `Sauvegardé il y a ${minutes}min`;
          return `Sauvegardé à ${lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
        }
        return 'Auto-sauvegarde active';
    }
  };

  const getColor = () => {
    switch (status) {
      case 'saving':
        return 'text-blue-600 bg-blue-50';
      case 'saved':
        return 'text-green-600 bg-green-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-surface-500 bg-surface-50';
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
          getColor(),
          className
        )}
      >
        {getIcon()}
        <span>{getMessage()}</span>
      </motion.div>
    </AnimatePresence>
  );
}

// Composant pour afficher dans la TopBar
interface AutoSaveBadgeProps {
  status: SaveStatus;
  connected?: boolean;
}

export function AutoSaveBadge({ status, connected = true }: AutoSaveBadgeProps) {
  if (!connected) {
    return (
      <div className="flex items-center gap-1.5 text-orange-600">
        <CloudOff className="w-4 h-4" />
        <span className="text-xs hidden sm:inline">Hors ligne</span>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center gap-1.5',
      status === 'saving' && 'text-blue-600',
      status === 'saved' && 'text-green-600',
      status === 'error' && 'text-red-600',
      status === 'idle' && 'text-surface-400'
    )}>
      {status === 'saving' ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : status === 'saved' ? (
        <Check className="w-4 h-4" />
      ) : status === 'error' ? (
        <AlertCircle className="w-4 h-4" />
      ) : (
        <Cloud className="w-4 h-4" />
      )}
    </div>
  );
}
