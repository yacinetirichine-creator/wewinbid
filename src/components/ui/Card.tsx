/**
 * @fileoverview Card container component with variants for visual hierarchy.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Card component props.
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card variant style */
  variant?: 'default' | 'outlined' | 'elevated';
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Hover effect */
  hoverable?: boolean;
}

/**
 * Card - Container component for grouping related content.
 * 
 * @example
 * ```tsx
 * <Card variant="elevated" padding="lg">
 *   <CardHeader>
 *     <CardTitle>Appel d'offres</CardTitle>
 *   </CardHeader>
 *   <CardContent>Content here</CardContent>
 * </Card>
 * ```
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', hoverable = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-300',
          // Variants
          variant === 'outlined' && 'bg-transparent border border-slate-200',
          variant === 'elevated' && 'bg-white shadow-xl shadow-slate-200/50 border-none',
          variant === 'default' && 'bg-white border border-slate-100 shadow-sm',
          // Padding
          padding === 'sm' && 'p-4',
          padding === 'md' && 'p-6',
          padding === 'lg' && 'p-8',
          // Hover
          hoverable && 'hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50 cursor-pointer',
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

/**
 * CardHeader - Header section of a card.
 */
export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-1.5 pb-4', className)}
    {...props}
  />
));

CardHeader.displayName = 'CardHeader';

/**
 * CardTitle - Title heading for a card.
 */
export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight text-gray-900', className)}
    {...props}
  >
    {children}
  </h3>
));

CardTitle.displayName = 'CardTitle';

/**
 * CardDescription - Subtitle or description for a card.
 */
export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-500', className)}
    {...props}
  />
));

CardDescription.displayName = 'CardDescription';

/**
 * CardContent - Main content area of a card.
 */
export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
));

CardContent.displayName = 'CardContent';

/**
 * CardFooter - Footer section of a card (typically for actions).
 */
export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center gap-2 pt-4 border-t border-gray-100', className)}
    {...props}
  />
));

CardFooter.displayName = 'CardFooter';
