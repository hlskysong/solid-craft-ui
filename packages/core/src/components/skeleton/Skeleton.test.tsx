/**
 * `Skeleton` 单测（T3-05）。
 *
 * 重点不在「渲染出了 div」，而在三种最容易悄悄退化的行为：
 * ① `rows` 非法值的归一（0 / 负数 / NaN 不能渲染出 0 行，否则骨架整体塌陷成 0 高）；
 * ② `variant` **切换必须真的换 DOM** —— Solid 组件只在 setup 执行一次，
 *    写成组件调用（`<Body />`）时 `text → table` 不会更新，这条用例专门钉它；
 * ③ 包裹模式的 `loading` 与「无 children 恒显示骨架」两种分支。
 *
 * 高度像素不在这里验：jsdom 无布局引擎，`block-size` 全部读成 0。
 * 「骨架与真实文本同高」由 browser 用例按 `boundingBox` 实测。
 */
import { cleanup, render } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it } from 'vitest';

import { Skeleton } from './Skeleton';

afterEach(cleanup);

const skeleton = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="skeleton"]');

const lines = (): NodeListOf<HTMLElement> =>
  document.querySelectorAll<HTMLElement>('[data-scui-role="skeleton-line"]');

describe('Skeleton / text', () => {
  it('默认渲染 3 行', () => {
    render(() => <Skeleton />);
    expect(lines().length).toBe(3);
  });

  it('rows 决定行数', () => {
    render(() => <Skeleton rows={5} />);
    expect(lines().length).toBe(5);
  });

  it('rows 非法值归一为 1，不会渲染出 0 行', () => {
    render(() => <Skeleton rows={0} />);
    expect(lines().length).toBe(1);
    cleanup();

    render(() => <Skeleton rows={-3} />);
    expect(lines().length).toBe(1);
    cleanup();

    render(() => <Skeleton rows={Number.NaN} />);
    expect(lines().length).toBe(1);
    cleanup();

    render(() => <Skeleton rows={2.7} />);
    expect(lines().length).toBe(2);
  });

  it('只有末行带 data-scui-last', () => {
    render(() => <Skeleton rows={4} />);
    const marked = [...lines()].filter((line) => line.hasAttribute('data-scui-last'));
    expect(marked.length).toBe(1);
    expect(marked[0]).toBe(lines()[3]);
  });

  it('根节点声明 aria-busy，形状与动效落到属性上', () => {
    render(() => <Skeleton active />);
    expect(skeleton()?.getAttribute('aria-busy')).toBe('true');
    expect(skeleton()?.getAttribute('data-scui-variant')).toBe('text');
    expect(skeleton()?.hasAttribute('data-scui-active')).toBe(true);
  });

  it('未开 active 时不输出 data-scui-active', () => {
    render(() => <Skeleton />);
    expect(skeleton()?.hasAttribute('data-scui-active')).toBe(false);
  });
});

describe('Skeleton / 其它形状', () => {
  it('table：1 个表头行 + rows 个正文行，每行 3 列', () => {
    render(() => <Skeleton variant="table" rows={2} />);
    expect(document.querySelectorAll('[data-scui-role="skeleton-head"]').length).toBe(1);
    const row = document.querySelector('[data-scui-role="skeleton-row"]');
    expect(document.querySelectorAll('[data-scui-role="skeleton-row"]').length).toBe(2);
    expect(row?.querySelectorAll('.scui-skeleton__bar').length).toBe(3);
  });

  it('card：标题条 + 正文行', () => {
    render(() => <Skeleton variant="card" rows={2} />);
    expect(document.querySelector('[data-scui-role="skeleton-title"]')).not.toBeNull();
    expect(lines().length).toBe(2);
  });

  it('button / avatar：单个 bar', () => {
    render(() => <Skeleton variant="button" />);
    expect(document.querySelector('[data-scui-role="skeleton-button"]')).not.toBeNull();
    cleanup();

    render(() => <Skeleton variant="avatar" />);
    expect(document.querySelector('[data-scui-role="skeleton-avatar"]')).not.toBeNull();
  });

  it('variant 切换真的替换 DOM（Solid 组件只执行一次，分派必须走响应式表达式）', () => {
    const [variant, setVariant] = createSignal<'text' | 'table'>('text');
    render(() => <Skeleton variant={variant()} rows={1} />);
    expect(skeleton()?.getAttribute('data-scui-variant')).toBe('text');
    expect(document.querySelector('[data-scui-role="skeleton-row"]')).toBeNull();

    setVariant('table');
    expect(skeleton()?.getAttribute('data-scui-variant')).toBe('table');
    expect(document.querySelector('[data-scui-role="skeleton-row"]')).not.toBeNull();
    expect(lines().length).toBe(0);
  });
});

describe('Skeleton / 包裹模式', () => {
  it('loading 为 true 时只出骨架，不出内容', () => {
    render(() => (
      <Skeleton loading>
        <p data-testid="content">真实内容</p>
      </Skeleton>
    ));
    expect(document.querySelector('[data-testid="content"]')).toBeNull();
    expect(skeleton()).not.toBeNull();
    expect(
      document.querySelector('[data-scui-role="skeleton-wrapper"]')?.getAttribute('aria-busy'),
    ).toBe('true');
  });

  it('loading 为 false 时只出内容', () => {
    render(() => (
      <Skeleton loading={false}>
        <p data-testid="content">真实内容</p>
      </Skeleton>
    ));
    expect(document.querySelector('[data-testid="content"]')?.textContent).toBe('真实内容');
    expect(skeleton()).toBeNull();
  });

  it('loading 切换后骨架与内容互换，wrapper 的 aria-busy 同步', () => {
    const [loading, setLoading] = createSignal(true);
    render(() => (
      <Skeleton loading={loading()}>
        <p data-testid="content">真实内容</p>
      </Skeleton>
    ));
    expect(skeleton()).not.toBeNull();

    setLoading(false);
    expect(skeleton()).toBeNull();
    expect(document.querySelector('[data-testid="content"]')).not.toBeNull();
    expect(
      document.querySelector('[data-scui-role="skeleton-wrapper"]')?.hasAttribute('aria-busy'),
    ).toBe(false);
  });

  it('没有 children 时 loading=false 也仍显示骨架（独立形态）', () => {
    render(() => <Skeleton loading={false} />);
    expect(skeleton()).not.toBeNull();
    expect(document.querySelector('[data-scui-role="skeleton-wrapper"]')).toBeNull();
  });
});

describe('Skeleton / 属性透传', () => {
  it('独立模式下 class / style / 原生属性落在骨架根上', () => {
    render(() => <Skeleton class="extra" style="max-width: 200px" data-testid="sk" />);
    expect(skeleton()?.classList.contains('extra')).toBe(true);
    expect(skeleton()?.getAttribute('style')).toContain('max-width: 200px');
    expect(skeleton()?.getAttribute('data-testid')).toBe('sk');
  });

  it('包裹模式下 class / style 落在 wrapper 上，骨架本体不带调用方的 class', () => {
    render(() => (
      <Skeleton loading class="extra" style="max-width: 200px">
        <p>内容</p>
      </Skeleton>
    ));
    const wrapper = document.querySelector('[data-scui-role="skeleton-wrapper"]');
    expect(wrapper?.classList.contains('extra')).toBe(true);
    expect(wrapper?.getAttribute('style')).toContain('max-width: 200px');
    expect(skeleton()?.classList.contains('extra')).toBe(false);
  });
});
