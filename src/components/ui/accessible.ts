/**
 * @fileoverview Central export for accessible UI components (new design system).
 * These components follow WAI-ARIA best practices and TypeScript strict mode.
 * 
 * @example
 * ```tsx
 * import { Button, Input, Card, Badge, Modal } from '@/components/ui/accessible';
 * ```
 */

// Button components
export { Button } from './Button';
export type { ButtonProps } from './Button';

// Input components
export { Input } from './Input';
export type { InputProps } from './Input';

// Card components
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card';
export type { CardProps } from './Card';

// Badge components
export { Badge } from './Badge';
export type { BadgeProps } from './Badge';

// Modal components
export { Modal, ModalFooter } from './Modal';
export type { ModalProps } from './Modal';
