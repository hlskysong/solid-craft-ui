import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vitest';
import { Space } from './Space';

afterEach(cleanup);

describe('Space', () => {
  it('uses horizontal orientation and medium size by default', () => {
    render(() => (
      <Space>
        <span>第一项</span>
        <span>第二项</span>
      </Space>
    ));

    const root = screen.getByText('第一项').parentElement;
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute('data-scui-orientation', 'horizontal');
    expect(root).toHaveAttribute('data-scui-size', 'medium');
  });

  it('renders vertical orientation and custom size through data attributes', () => {
    render(() => (
      <Space direction="vertical" size="large">
        <span>甲</span>
        <span>乙</span>
      </Space>
    ));

    const root = screen.getByText('甲').parentElement;
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute('data-scui-orientation', 'vertical');
    expect(root).toHaveAttribute('data-scui-size', 'large');
  });

  it('does not reuse data-scui-direction reserved for writing direction', () => {
    render(() => (
      <Space direction="vertical">
        <span>丙</span>
      </Space>
    ));

    const root = screen.getByText('丙').parentElement;
    expect(root).not.toBeNull();
    expect(root).not.toHaveAttribute('data-scui-direction');
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
    expect(root).toHaveAttribute('data-scui-wrap', 'true');
    expect(root).toHaveAttribute('data-scui-align', 'baseline');
  });
});
