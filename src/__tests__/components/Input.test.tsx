/**
 * @fileoverview Unit tests for Input component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  describe('Rendering', () => {
    it('renders an input element', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders with default value', () => {
      render(<Input defaultValue="Default text" />);
      expect(screen.getByDisplayValue('Default text')).toBeInTheDocument();
    });
  });

  describe('Label', () => {
    it('renders label when provided', () => {
      render(<Input label="Email" />);
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('associates label with input via htmlFor', () => {
      render(<Input label="Email" id="email-input" />);
      const label = screen.getByText('Email');
      expect(label).toHaveAttribute('for', 'email-input');
    });

    it('shows required asterisk when required', () => {
      render(<Input label="Email" required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('Helper text', () => {
    it('renders helper text when provided', () => {
      render(<Input helperText="This is helpful" />);
      expect(screen.getByText('This is helpful')).toBeInTheDocument();
    });

    it('links input to helper text via aria-describedby', () => {
      render(<Input helperText="Helper" id="test-input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'test-input-helper');
    });
  });

  describe('Error state', () => {
    it('shows error message when error prop is provided', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('hides helper text when error is shown', () => {
      render(<Input helperText="Helper" error="Error message" />);
      expect(screen.queryByText('Helper')).not.toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('sets aria-invalid to true on error', () => {
      render(<Input error="Error" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('announces error with role="alert"', () => {
      render(<Input error="Error message" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Error message');
    });

    it('has error border styling', () => {
      render(<Input error="Error" />);
      expect(screen.getByRole('textbox')).toHaveClass('border-rose-500');
    });
  });

  describe('Success state', () => {
    it('has success border styling when success is true', () => {
      render(<Input success />);
      expect(screen.getByRole('textbox')).toHaveClass('border-emerald-500');
    });
  });

  describe('Icons', () => {
    it('renders left icon', () => {
      render(<Input leftIcon={<span data-testid="left-icon">$</span>} />);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders right icon', () => {
      render(<Input rightIcon={<span data-testid="right-icon">✓</span>} />);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('adds left padding when left icon is present', () => {
      render(<Input leftIcon={<span>$</span>} />);
      expect(screen.getByRole('textbox')).toHaveClass('pl-10');
    });

    it('adds right padding when right icon is present', () => {
      render(<Input rightIcon={<span>✓</span>} />);
      expect(screen.getByRole('textbox')).toHaveClass('pr-10');
    });
  });

  describe('Disabled state', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('applies disabled styling to label', () => {
      render(<Input label="Disabled" disabled />);
      const label = screen.getByText('Disabled');
      expect(label).toHaveClass('opacity-50');
    });
  });

  describe('Full width', () => {
    it('applies full width class when fullWidth is true', () => {
      const { container } = render(<Input fullWidth />);
      expect(container.firstChild).toHaveClass('w-full');
    });
  });

  describe('Interactions', () => {
    it('allows typing', async () => {
      const user = userEvent.setup();
      render(<Input />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello');

      expect(input).toHaveValue('Hello');
    });

    it('calls onChange when typing', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      render(<Input onChange={handleChange} />);

      await user.type(screen.getByRole('textbox'), 'a');

      expect(handleChange).toHaveBeenCalled();
    });

    it('can receive focus', async () => {
      const user = userEvent.setup();
      render(<Input />);

      await user.tab();

      expect(screen.getByRole('textbox')).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('supports ref forwarding', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('sets aria-required when required', () => {
      render(<Input required />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
    });

    it('accepts custom className', () => {
      render(<Input className="custom-input" />);
      expect(screen.getByRole('textbox')).toHaveClass('custom-input');
    });

    it('passes through native props', () => {
      render(<Input type="email" name="email" autoComplete="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
      expect(input).toHaveAttribute('name', 'email');
      expect(input).toHaveAttribute('autoComplete', 'email');
    });
  });

  describe('Input types', () => {
    it('renders as password type', () => {
      render(<Input type="password" />);
      // Password inputs are not textboxes
      expect(screen.getByRole('textbox', { hidden: true }) || document.querySelector('input[type="password"]')).toBeTruthy();
    });

    it('renders as number type', () => {
      render(<Input type="number" />);
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    it('renders as email type', () => {
      render(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });
  });
});
