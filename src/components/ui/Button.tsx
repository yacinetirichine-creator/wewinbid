/**
 * @fileoverview Reusable UI Button component with variants, sizes, and full accessibility.
 * Follows WAI-ARIA best practices for interactive elements.
 */

import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button variants configuration using CVA (Class Variance Authority).
 * Defines visual styles, sizes, and states.
 */
const buttonVariants = cva(
  // Base styles - applied to all buttons
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow-md focus-visible:ring-primary-600',
        secondary: 'bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-slate-400',
        soft: 'bg-primary-50 text-primary-700 hover:bg-primary-100 focus-visible:ring-primary-600',
        accent: 'bg-secondary-600 text-white shadow-sm hover:bg-secondary-700 hover:shadow-md focus-visible:ring-secondary-600',
        success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:ring-emerald-600',
        danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:ring-rose-600',
        warning: 'bg-amber-600 text-white shadow-sm hover:bg-amber-700 focus-visible:ring-amber-600',
        outline: 'border border-slate-300 bg-transparent hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-slate-400',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400',
        link: 'text-primary-600 underline-offset-4 hover:underline focus-visible:ring-primary-600',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-5 py-2.5',
        lg: 'h-12 px-8 text-base',
        xl: 'h-14 px-10 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

/**
 * Button component props extending native HTML button attributes.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Visual loading state with spinner */
  isLoading?: boolean;
  /** Icon to display before text */
  leftIcon?: React.ReactNode;
  /** Icon to display after text */
  rightIcon?: React.ReactNode;
  /** Full width button */
  fullWidth?: boolean;
  /** Custom class names */
  className?: string;
}

/**
 * Button - Accessible, themeable button component.
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="md">Click me</Button>
 * <Button variant="danger" isLoading>Deleting...</Button>
 * <Button variant="outline" leftIcon={<Icon />}>With icon</Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          buttonVariants({ variant, size }),
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        aria-disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!isLoading && leftIcon && <span className="mr-2" aria-hidden="true">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2" aria-hidden="true">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
