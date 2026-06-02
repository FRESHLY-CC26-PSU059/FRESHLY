import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../components/ui/Button';

describe('Button Component', () => {
  test('renders children text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click Me');
  });

  test('applies primary variant by default', () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-primary-500');
  });

  test('applies danger variant', () => {
    render(<Button variant="danger">Delete</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-red-500');
  });

  test('applies fullWidth class', () => {
    render(<Button fullWidth>Wide</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('w-full');
  });

  test('shows loading state', () => {
    render(<Button isLoading>Submit</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent('Mohon Tunggu');
  });

  test('disables button when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('calls onClick handler', async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(<Button onClick={() => { clicked = true; }}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(clicked).toBe(true);
  });

  test('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(<Button disabled onClick={() => { clicked = true; }}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(clicked).toBe(false);
  });

  test('does not call onClick when loading', async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(<Button isLoading onClick={() => { clicked = true; }}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(clicked).toBe(false);
  });

  test('passes additional HTML attributes', () => {
    render(<Button data-testid="custom-btn" type="submit">Go</Button>);
    const btn = screen.getByTestId('custom-btn');
    expect(btn).toHaveAttribute('type', 'submit');
  });
});
