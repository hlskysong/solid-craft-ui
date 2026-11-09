import { fireEvent, render, screen } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders with primary color, medium size and button type by default', () => {
    render(() => <Button>默认按钮</Button>);

    const button = screen.getByRole('button', { name: '默认按钮' });
    expect(button).toHaveAttribute('data-color', 'primary');
    expect(button).toHaveAttribute('data-size', 'medium');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('reflects color, size and variant through data attributes', () => {
    render(() => (
      <Button color="neutral" size="large" variant="outline">
        中性按钮
      </Button>
    ));

    const button = screen.getByRole('button', { name: '中性按钮' });
    expect(button).toHaveAttribute('data-color', 'neutral');
    expect(button).toHaveAttribute('data-size', 'large');
    expect(button).toHaveAttribute('data-variant', 'outline');
  });

  it('is disabled and busy while loading, and does not fire onClick', () => {
    const onClick = vi.fn();

    render(() => (
      <Button loading onClick={onClick}>
        保存
      </Button>
    ));

    const button = screen.getByRole('button', { name: '保存' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
