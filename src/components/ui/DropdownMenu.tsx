'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// Types
interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | undefined>(undefined);

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('useDropdownMenu must be used within a DropdownMenu');
  }
  return context;
}

// Main DropdownMenu component
export function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

// Trigger
interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function DropdownMenuTrigger({ children, asChild }: DropdownMenuTriggerProps) {
  const { open, setOpen } = useDropdownMenu();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.closest('.dropdown-menu-root')?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, setOpen]);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void; 'aria-expanded'?: boolean; 'aria-haspopup'?: boolean }>, {
      onClick: () => setOpen(!open),
      'aria-expanded': open,
      'aria-haspopup': true,
    });
  }

  return (
    <div ref={ref} className="dropdown-menu-root">
      <button
        onClick={() => setOpen(!open)}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {children}
      </button>
    </div>
  );
}

// Content
interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export function DropdownMenuContent({
  children,
  align = 'end',
  className,
}: DropdownMenuContentProps) {
  const { open, setOpen } = useDropdownMenu();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        const trigger = ref.current.closest('.dropdown-menu-root');
        if (!trigger?.contains(event.target as Node)) {
          setOpen(false);
        }
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [open, setOpen]);

  // Focus first menu item when menu opens
  React.useEffect(() => {
    if (open && ref.current) {
      const firstItem = ref.current.querySelector('[role="menuitem"]') as HTMLElement;
      if (firstItem) {
        firstItem.focus();
      }
    }
  }, [open]);

  if (!open) return null;

  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 mt-2 min-w-[8rem] overflow-hidden',
        'rounded-lg border border-surface-200 dark:border-surface-700',
        'bg-white dark:bg-surface-800',
        'shadow-lg',
        'animate-in fade-in-0 zoom-in-95',
        'py-1',
        alignmentClasses[align],
        className
      )}
      role="menu"
      aria-orientation="vertical"
    >
      {children}
    </div>
  );
}

// Item
interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function DropdownMenuItem({
  children,
  onClick,
  disabled = false,
  className,
}: DropdownMenuItemProps) {
  const { setOpen } = useDropdownMenu();

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
      setOpen(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const target = event.currentTarget as HTMLElement;
    const parent = target.closest('[role="menu"]');
    if (!parent) return;

    const items = Array.from(parent.querySelectorAll('[role="menuitem"]:not([disabled])')) as HTMLElement[];
    const currentIndex = items.indexOf(target);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % items.length;
        items[nextIndex]?.focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = (currentIndex - 1 + items.length) % items.length;
        items[prevIndex]?.focus();
        break;
      case 'Home':
        event.preventDefault();
        items[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        items[items.length - 1]?.focus();
        break;
    }
  };

  return (
    <button
      className={cn(
        'w-full flex items-center px-3 py-2 text-sm',
        'text-surface-700 dark:text-surface-200',
        'hover:bg-surface-100 dark:hover:bg-surface-700',
        'focus:bg-surface-100 dark:focus:bg-surface-700',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset',
        'transition-colors duration-150',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
    >
      {children}
    </button>
  );
}

// Label
interface DropdownMenuLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownMenuLabel({ children, className }: DropdownMenuLabelProps) {
  return (
    <div
      className={cn(
        'px-3 py-2 text-xs font-semibold',
        'text-surface-500 dark:text-surface-400',
        className
      )}
    >
      {children}
    </div>
  );
}

// Separator
interface DropdownMenuSeparatorProps {
  className?: string;
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return (
    <div
      className={cn(
        'h-px my-1',
        'bg-surface-200 dark:bg-surface-700',
        className
      )}
      role="separator"
    />
  );
}

// Group
interface DropdownMenuGroupProps {
  children: React.ReactNode;
}

export function DropdownMenuGroup({ children }: DropdownMenuGroupProps) {
  return <div role="group">{children}</div>;
}
