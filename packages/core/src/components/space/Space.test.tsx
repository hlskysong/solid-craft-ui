import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vitest';
import { Space } from './Space';

afterEach(cleanup);

describe('Space', () => {
  it('uses horizontal direction and medium size by default', () => {
    render(() => (
      <Space>
        <span>第一项</span>
        <span>第二项</span>
      </Space>
    ));

    const root = screen.getByText('第一项').parentElement;
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute('data-direction', 'horizontal');
    expect(root).toHaveAttribute('data-size', 'medium');
  });

  it('renders vertical direction and custom size through data attributes', () => {
    render(() => (
      <Space direction="vertical" size="large">
        <span>甲</span>
        <span>乙</span>
      </Space>
    ));

    const root = screen.getByText('甲').parentElement;
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute('data-direction', 'vertical');
    expect(root).toHaveAttribute('data-size', 'large');
  });

  it('renders one split element between each pair of children', () => {
    render(() => (
      <Space split={<span>|</span>}>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </Space>
    ));

    const root = screen.getByText('A').parentElement;
    expect(root).not.toBeNull();
    expect(root?.querySelectorAll('.scui-space__split')).toHaveLength(2);
  });

  it('reflects wrap and align through data attributes', () => {
    render(() => (
      <Space wrap align="baseline">
        <span>换行项</span>
      </Space>
    ));

    const root = screen.getByText('换行项').parentElement;
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute('data-wrap', 'true');
    expect(root).toHaveAttribute('data-align', 'baseline');
  });
});
