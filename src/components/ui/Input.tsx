/**
 * @fileoverview Accessible Input component with validation states and label support.
 * Implements WAI-ARIA practices for form controls.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Input component props extending native HTML input attributes.
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Input label text */
  label?: string;
  /** Helper text below input */
  helperText?: string;
  /** Error message (shows red border and text) */
  error?: string;
  /** Success state (shows green border) */
  success?: boolean;
  /** Icon to display on the left */
  leftIcon?: React.ReactNode;
  /** Icon to display on the right */
  rightIcon?: React.ReactNode;
  /** Full width input */
  fullWidth?: boolean;
  /** Custom wrapper class */
  wrapperClassName?: string;
}

/**
 * Input - Accessible form input with label, validation, and icons.
 * 
 * @example
 * ```tsx
 * <Input label="Email" type="email" placeholder="user@example.com" />
 * <Input label="SIRET" error="Invalid SIRET format" />
 * <Input label="Budget" leftIcon={<EuroIcon />} type="number" />
 * ```
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      wrapperClassName,
      label,
      helperText,
      error,
      success,
      leftIcon,
      rightIcon,
      fullWidth = false,
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    // Generate unique ID if not provided
    const inputId = id || React.useId();
    const helperTextId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

    const hasError = !!error;

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full', wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'text-sm font-medium text-gray-700',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {label}
            {required && <span className="ml-1 text-rose-500" aria-label="required">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm transition-colors',
              'placeholder:text-gray-400',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
              // Border colors
              !hasError && !success && 'border-gray-300 focus-visible:ring-blue-600',
              hasError && 'border-rose-500 focus-visible:ring-rose-600',
              success && 'border-emerald-500 focus-visible:ring-emerald-600',
              // Icon padding
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            aria-invalid={hasError}
            aria-describedby={
              error ? errorId : helperText ? helperTextId : undefined
            }
            aria-required={required}
            disabled={disabled}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            className="text-sm text-rose-600"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}

        {!error && helperText && (
          <p
            id={helperTextId}
            className="text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
