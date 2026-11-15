/**
 * `Tag` 单测（T3-10）。
 *
 * 覆盖 §4.2 验收列的三项：颜色 / 可关闭 / 边框。颜色五档的**视觉差异**交给
 * 视觉基线与 browser 的 computed style 实证，这里只钉「属性恒输出、枚举不漏档」；
 * 关闭按钮钉「aria-label 恒有、点击只发一次回调、DOM 真的移除」。
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Tag } from './Tag';

afterEach(cleanup);

const root = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="tag"]');
const closeButton = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="tag-close"]');

describe('Tag：颜色与边框', () => {
  it('默认 color=neutral 且恒输出 data-scui-color', () => {
    render(() => <Tag>草稿</Tag>);
    expect(root()?.getAttribute('data-scui-color')).toBe('neutral');
    expect(root()?.hasAttribute('data-scui-bordered')).toBe(false);
  });

  for (const color of ['primary', 'neutral', 'success', 'warning', 'danger'] as const) {
    it(`${color} 走同一个 data-scui-color 属性`, () => {
      render(() => <Tag color={color}>{color}</Tag>);
      expect(root()?.getAttribute('data-scui-color')).toBe(color);
    });
  }

  it('bordered 是存在即真：true 输出空串、false 与省略都缺席', () => {
    const [bordered, setBordered] = createSignal(false);
    render(() => <Tag bordered={bordered()}>带边框</Tag>);
    expect(root()?.hasAttribute('data-scui-bordered')).toBe(false);

    setBordered(true);
    expect(root()?.getAttribute('data-scui-bordered')).toBe('');

    setBordered(false);
    expect(root()?.hasAttribute('data-scui-bordered')).toBe(false);
  });

  it('color 是响应式的：切换后属性跟着变', () => {
    const [color, setColor] = createSignal<'primary' | 'danger'>('primary');
    render(() => <Tag color={color()}>状态</Tag>);
    expect(root()?.getAttribute('data-scui-color')).toBe('primary');
    setColor('danger');
    expect(root()?.getAttribute('data-scui-color')).toBe('danger');
  });

  it('class 合并且原生属性透传到根节点', () => {
    render(() => (
      <Tag class="my-tag" data-testid="tag-root">
        已归档
      </Tag>
    ));
    expect(root()?.classList.contains('scui-tag')).toBe(true);
    expect(root()?.classList.contains('my-tag')).toBe(true);
    expect(root()?.getAttribute('data-testid')).toBe('tag-root');
    expect(screen.getByTestId('tag-root').textContent).toContain('已归档');
  });
});

describe('Tag：可关闭', () => {
  it('默认无关闭按钮，onClose 不会被触发', () => {
    const onClose = vi.fn();
    render(() => <Tag onClose={onClose}>草稿</Tag>);
    expect(closeButton()).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closable 为 true 时按钮带默认无障碍文案与隐藏图标', () => {
    render(() => <Tag closable>草稿</Tag>);
    const button = closeButton();
    expect(button?.getAttribute('aria-label')).toBe('关闭标签');
    expect(button?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('closeLabel 覆盖无障碍文案', () => {
    render(() => (
      <Tag closable closeLabel="移除这个标签">
        草稿
      </Tag>
    ));
    expect(closeButton()?.getAttribute('aria-label')).toBe('移除这个标签');
  });

  it('点击关闭移除自身 DOM 且只发一次 onClose', () => {
    const onClose = vi.fn();
    render(() => (
      <Tag closable onClose={onClose}>
        草稿
      </Tag>
    ));
    const button = closeButton();
    expect(button).not.toBeNull();
    if (button) fireEvent.click(button);
    expect(root()).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('多个标签各自独立关闭，互不影响', () => {
    const onClose = vi.fn();
    render(() => (
      <div>
        <Tag closable onClose={onClose}>
          甲
        </Tag>
        <Tag closable onClose={onClose}>
          乙
        </Tag>
      </div>
    ));
    fireEvent.click(document.querySelectorAll('[data-scui-role="tag-close"]')[0]!);
    expect(document.querySelectorAll('[data-scui-role="tag"]')).toHaveLength(1);
    expect(document.querySelector('[data-scui-role="tag-content"]')?.textContent).toBe('乙');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
