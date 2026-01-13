import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../Input';

describe('Input', () => {
  it('should render input element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('should show required indicator when required', () => {
    render(<Input label="Email" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should show helper text', () => {
    render(<Input helperText="Enter your email address" />);
    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
  });

  it('should show error message', () => {
    render(<Input error="Invalid email format" />);
    const errorElement = screen.getByRole('alert');
    expect(errorElement).toHaveTextContent('Invalid email format');
  });

  it('should apply error styling when error is present', () => {
    render(<Input error="Error message" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-rose-500');
  });

  it('should apply success styling when success is true', () => {
    render(<Input success />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-emerald-500');
  });

  it('should handle onChange', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('should apply fullWidth class', () => {
    render(<Input fullWidth />);
    const container = screen.getByRole('textbox').parentElement?.parentElement;
    expect(container).toHaveClass('w-full');
  });

  it('should have aria-invalid when error is present', () => {
    render(<Input error="Error" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('should have aria-required when required', () => {
    render(<Input required />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
  });

  it('should have aria-describedby when error is present', () => {
    render(<Input error="Error message" />);
    const input = screen.getByRole('textbox');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
  });

  it('should render left icon', () => {
    const Icon = () => <span data-testid="left-icon">@</span>;
    render(<Input leftIcon={<Icon />} />);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('should render right icon', () => {
    const Icon = () => <span data-testid="right-icon">✓</span>;
    render(<Input rightIcon={<Icon />} />);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });
});
