/**
 * @fileoverview Unit tests for UI components
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// ============================================
// Button Component Tests
// ============================================
describe('Button', () => {
  describe('Rendering', () => {
    it('renders with children text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('renders with default variant (primary)', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary-600');
    });

    it('renders with default size (md)', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
    });
  });

  describe('Variants', () => {
    const variants = [
      { name: 'primary', expectedClass: 'bg-primary-600' },
      { name: 'secondary', expectedClass: 'bg-white' },
      { name: 'danger', expectedClass: 'bg-rose-600' },
      { name: 'success', expectedClass: 'bg-emerald-600' },
      { name: 'warning', expectedClass: 'bg-amber-600' },
      { name: 'ghost', expectedClass: 'bg-transparent' },
      { name: 'outline', expectedClass: 'border' },
    ];

    variants.forEach(({ name, expectedClass }) => {
      it(`renders ${name} variant correctly`, () => {
        render(<Button variant={name as any}>{name}</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass(expectedClass);
      });
    });
  });

  describe('Sizes', () => {
    const sizes = [
      { name: 'sm', expectedClass: 'h-8' },
      { name: 'md', expectedClass: 'h-10' },
      { name: 'lg', expectedClass: 'h-12' },
      { name: 'xl', expectedClass: 'h-14' },
      { name: 'icon', expectedClass: 'w-10' },
    ];

    sizes.forEach(({ name, expectedClass }) => {
      it(`renders ${name} size correctly`, () => {
        render(<Button size={name as any}>{name}</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass(expectedClass);
      });
    });
  });

  describe('Loading state', () => {
    it('shows loading spinner when isLoading is true', () => {
      render(<Button isLoading>Loading</Button>);
      const spinner = screen.getByRole('button').querySelector('svg.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('disables button when loading', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('sets aria-busy when loading', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Icons', () => {
    it('renders left icon', () => {
      render(<Button leftIcon={<span data-testid="left-icon">→</span>}>With Icon</Button>);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders right icon', () => {
      render(<Button rightIcon={<span data-testid="right-icon">←</span>}>With Icon</Button>);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('hides icons when loading', () => {
      render(
        <Button
          isLoading
          leftIcon={<span data-testid="left-icon">→</span>}
          rightIcon={<span data-testid="right-icon">←</span>}
        >
          Loading
        </Button>
      );
      expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
    });
  });

  describe('Disabled state', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('sets aria-disabled when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Full width', () => {
    it('renders full width when fullWidth is true', () => {
      render(<Button fullWidth>Full Width</Button>);
      expect(screen.getByRole('button')).toHaveClass('w-full');
    });
  });

  describe('Interactions', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} disabled>Disabled</Button>);

      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} isLoading>Loading</Button>);

      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('can receive focus', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('supports ref forwarding', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>With Ref</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });
});

// ============================================
// Card Component Tests
// ============================================
describe('Card', () => {
  describe('Rendering', () => {
    it('renders children', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders with default variant', () => {
      render(<Card>Default</Card>);
      const card = screen.getByText('Default');
      expect(card).toHaveClass('bg-white');
    });
  });

  describe('Variants', () => {
    it('renders outlined variant', () => {
      render(<Card variant="outlined">Outlined</Card>);
      const card = screen.getByText('Outlined');
      expect(card).toHaveClass('border');
    });

    it('renders elevated variant', () => {
      render(<Card variant="elevated">Elevated</Card>);
      const card = screen.getByText('Elevated');
      expect(card).toHaveClass('shadow-xl');
    });
  });

  describe('Padding', () => {
    it('renders with sm padding', () => {
      render(<Card padding="sm">Small padding</Card>);
      expect(screen.getByText('Small padding')).toHaveClass('p-4');
    });

    it('renders with md padding (default)', () => {
      render(<Card padding="md">Medium padding</Card>);
      expect(screen.getByText('Medium padding')).toHaveClass('p-6');
    });

    it('renders with lg padding', () => {
      render(<Card padding="lg">Large padding</Card>);
      expect(screen.getByText('Large padding')).toHaveClass('p-8');
    });

    it('renders with no padding', () => {
      render(<Card padding="none">No padding</Card>);
      const card = screen.getByText('No padding');
      expect(card).not.toHaveClass('p-4');
      expect(card).not.toHaveClass('p-6');
      expect(card).not.toHaveClass('p-8');
    });
  });

  describe('Hoverable', () => {
    it('has hover styles when hoverable', () => {
      render(<Card hoverable>Hoverable</Card>);
      const card = screen.getByText('Hoverable');
      expect(card).toHaveClass('hover:-translate-y-1');
      expect(card).toHaveClass('cursor-pointer');
    });
  });

  describe('Sub-components', () => {
    it('renders CardHeader', () => {
      render(<CardHeader>Header content</CardHeader>);
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('renders CardTitle as h3', () => {
      render(<CardTitle>Card Title</CardTitle>);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('Card Title');
    });

    it('renders CardDescription', () => {
      render(<CardDescription>Description text</CardDescription>);
      expect(screen.getByText('Description text')).toBeInTheDocument();
    });

    it('renders CardContent', () => {
      render(<CardContent>Main content</CardContent>);
      expect(screen.getByText('Main content')).toBeInTheDocument();
    });

    it('renders CardFooter', () => {
      render(<CardFooter>Footer content</CardFooter>);
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('renders complete card structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>A test description</CardDescription>
          </CardHeader>
          <CardContent>Body content</CardContent>
          <CardFooter>Footer actions</CardFooter>
        </Card>
      );

      expect(screen.getByRole('heading', { name: 'Test Card' })).toBeInTheDocument();
      expect(screen.getByText('A test description')).toBeInTheDocument();
      expect(screen.getByText('Body content')).toBeInTheDocument();
      expect(screen.getByText('Footer actions')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('supports ref forwarding', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>With Ref</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('accepts custom className', () => {
      render(<Card className="custom-class">Custom</Card>);
      expect(screen.getByText('Custom')).toHaveClass('custom-class');
    });
  });
});

// ============================================
// Badge Component Tests
// ============================================
describe('Badge', () => {
  describe('Rendering', () => {
    it('renders with children text', () => {
      render(<Badge>Status</Badge>);
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('has aria-live for accessibility', () => {
      render(<Badge>Live badge</Badge>);
      expect(screen.getByText('Live badge')).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      render(<Badge variant="default">Default</Badge>);
      expect(screen.getByText('Default')).toBeInTheDocument();
    });

    it('renders primary variant', () => {
      render(<Badge variant="primary">Primary</Badge>);
      expect(screen.getByText('Primary')).toBeInTheDocument();
    });

    it('renders success variant', () => {
      render(<Badge variant="success">Success</Badge>);
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    it('renders warning variant', () => {
      render(<Badge variant="warning">Warning</Badge>);
      expect(screen.getByText('Warning')).toBeInTheDocument();
    });

    it('renders danger variant', () => {
      render(<Badge variant="danger">Danger</Badge>);
      expect(screen.getByText('Danger')).toBeInTheDocument();
    });
  });

  describe('Custom styling', () => {
    it('accepts custom className', () => {
      render(<Badge className="custom-badge">Custom</Badge>);
      expect(screen.getByText('Custom')).toHaveClass('custom-badge');
    });
  });
});
