import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vitest';
import { Divider } from './Divider';

afterEach(cleanup);

describe('Divider', () => {
  it('renders a horizontal separator by default', () => {
    render(() => <Divider />);

    const divider = screen.getByRole('separator');
    expect(divider).toHaveAttribute('aria-orientation', 'horizontal');
    expect(divider).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('reflects vertical orientation and dashed style through data attributes', () => {
    render(() => <Divider orientation="vertical" dashed />);

    const divider = screen.getByRole('separator');
    expect(divider).toHaveAttribute('aria-orientation', 'vertical');
    expect(divider).toHaveAttribute('data-orientation', 'vertical');
    expect(divider).toHaveAttribute('data-dashed', 'true');
  });

  it('renders text and marks the root as having text', () => {
    render(() => <Divider>分组标题</Divider>);

    const divider = screen.getByRole('separator');
    expect(divider).toHaveAttribute('data-has-text', 'true');
    expect(screen.getByText('分组标题')).toBeInTheDocument();
  });

  it('marks plain text through data attributes', () => {
    render(() => <Divider plain>普通文字</Divider>);

    const divider = screen.getByRole('separator');
    expect(divider).toHaveAttribute('data-plain', 'true');
    expect(screen.getByText('普通文字')).toBeInTheDocument();
  });
});
