import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vitest';
import { Icon } from './Icon';

afterEach(cleanup);

describe('Icon', () => {
  it('renders a decorative icon with medium size by default', () => {
    render(() => (
      <Icon data-testid="icon">
        <svg aria-hidden="true" />
      </Icon>
    ));

    const icon = screen.getByTestId('icon');
    expect(icon).toHaveAttribute('data-scui-size', 'medium');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).not.toHaveAttribute('role');
  });

  it('reflects size and tone through data attributes', () => {
    render(() => (
      <Icon data-testid="icon" size="large" tone="danger">
        <svg aria-hidden="true" />
      </Icon>
    ));

    const icon = screen.getByTestId('icon');
    expect(icon).toHaveAttribute('data-scui-size', 'large');
    expect(icon).toHaveAttribute('data-scui-tone', 'danger');
  });

  it('exposes spin state and an accessible name when label is provided', () => {
    render(() => (
      <Icon data-testid="icon" spin label="加载中">
        <svg aria-hidden="true" />
      </Icon>
    ));

    const icon = screen.getByRole('img', { name: '加载中' });
    expect(icon).toHaveAttribute('data-scui-spin', 'true');
    expect(icon).toHaveAttribute('aria-label', '加载中');
  });
});
