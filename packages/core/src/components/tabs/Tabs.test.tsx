/**
 * `Tabs` 单测（T3-11）。
 *
 * 重点不是「有没有变体属性」，而是四件能被机器证伪的事：
 * ① 线型 / 卡片恒输出 `data-scui-variant`；② 受控优先级（受控时点击只发事件、
 * DOM 不自行回弹）；③ 激活态复用 `data-scui-current` 且与 `aria-selected` 双通道；
 * ④ **懒加载真的推迟了内容创建** —— 用 content 工厂的调用次数计数，而不是只
 * 断言「非激活 panel 没有 data 属性」。
 *
 * 键盘 / ARIA 由 Kobalte 原语输出（组件层零实现），这里只验它确实接上了；
 * 方向键 / Home / End 的完整路径在 browser.spec.ts 用真实浏览器验。
 */
import { cleanup, fireEvent, render } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Tabs } from './Tabs';
import type { TabItem } from './types';

afterEach(cleanup);

const root = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="tabs"]');
const tabs = (): HTMLElement[] => [
  ...document.querySelectorAll<HTMLElement>('[data-scui-role="tabs-tab"]'),
];
const panels = (): HTMLElement[] => [
  ...document.querySelectorAll<HTMLElement>('[data-scui-role="tabs-panel"]'),
];
const tabAt = (index: number): HTMLElement => tabs()[index]!;
const panelAt = (index: number): HTMLElement => panels()[index]!;

function makeItems(onContent?: (key: string) => void): TabItem[] {
  return ['a', 'b', 'c'].map((key) => ({
    key,
    label: `标签 ${key}`,
    content: () => {
      onContent?.(key);
      return <div data-testid={`panel-${key}`}>内容 {key}</div>;
    },
  }));
}

describe('Tabs：变体与 ARIA 由原语接上', () => {
  it('默认线型，根节点恒输出 data-scui-variant', () => {
    render(() => <Tabs items={makeItems()} />);
    expect(root()?.getAttribute('data-scui-variant')).toBe('line');
    expect(root()?.classList.contains('scui-tabs')).toBe(true);
  });

  it('variant=card 时属性与 class 都切换，且没有 modifier class', () => {
    render(() => <Tabs items={makeItems()} variant="card" class="my-tabs" />);
    expect(root()?.getAttribute('data-scui-variant')).toBe('card');
    expect(root()?.classList.contains('my-tabs')).toBe(true);
    expect(root()?.className).not.toMatch(/scui-tabs--/);
  });

  it('tablist 恒有可读名称，tab / panel 的 ARIA 角色由原语输出', () => {
    render(() => <Tabs items={makeItems()} aria-label="采购计划分区" />);
    const list = document.querySelector<HTMLElement>('[data-scui-role="tabs-list"]');
    expect(list?.getAttribute('role')).toBe('tablist');
    expect(list?.getAttribute('aria-label')).toBe('采购计划分区');
    expect(tabs()).toHaveLength(3);
    for (const tab of tabs()) {
      expect(tab.getAttribute('role')).toBe('tab');
      expect(tab.getAttribute('aria-selected')).toMatch(/^(true|false)$/);
      // Kobalte 0.13 的 aria-controls 只指向已挂载的 panel（懒加载下不代填）；
      // 组件层不重复实现 ARIA，只在属性存在时验它确实指向真实节点。
      const controls = tab.getAttribute('aria-controls');
      if (controls !== null) {
        expect(document.getElementById(controls)).not.toBeNull();
      }
    }
    expect(panels()[0]?.getAttribute('role')).toBe('tabpanel');
  });

  it('未指定 aria-label 时回落到默认名称', () => {
    render(() => <Tabs items={makeItems()} />);
    expect(document.querySelector('[role="tablist"]')?.getAttribute('aria-label')).toBe('标签页');
  });

  it('禁用项同时输出原生 disabled 与 data-scui-disabled', () => {
    const items = makeItems();
    items[1] = { ...items[1]!, disabled: true };
    render(() => <Tabs items={items} />);
    expect(tabAt(1).hasAttribute('disabled')).toBe(true);
    expect(tabAt(1).getAttribute('data-scui-disabled')).toBe('');
    expect(tabAt(0).hasAttribute('data-scui-disabled')).toBe(false);
  });
});

describe('Tabs：受控优先级与激活态双通道', () => {
  it('缺省时激活第一项，data-scui-current 与 aria-selected 同源', () => {
    render(() => <Tabs items={makeItems()} />);
    expect(tabAt(0).getAttribute('data-scui-current')).toBe('');
    expect(tabAt(0).getAttribute('aria-selected')).toBe('true');
    expect(tabAt(1).hasAttribute('data-scui-current')).toBe(false);
    expect(tabAt(1).getAttribute('aria-selected')).toBe('false');
  });

  it('defaultValue 指定初始项，点击后非受控自行切换并只发一次 onChange', () => {
    const onChange = vi.fn();
    render(() => <Tabs items={makeItems()} defaultValue="b" onChange={onChange} />);
    expect(tabAt(1).getAttribute('data-scui-current')).toBe('');
    fireEvent.click(tabAt(2));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('c');
    expect(tabAt(2).getAttribute('data-scui-current')).toBe('');
    expect(tabAt(1).hasAttribute('data-scui-current')).toBe(false);
  });

  it('受控 value 优先于 defaultValue 与内部状态，点击只通知不回弹', () => {
    const onChange = vi.fn();
    render(() => <Tabs items={makeItems()} value="a" defaultValue="b" onChange={onChange} />);
    expect(tabAt(0).getAttribute('data-scui-current')).toBe('');
    fireEvent.click(tabAt(1));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('b');
    // 调用方没回弹，DOM 必须仍停在 a —— 组件不能自己偷偷写状态
    expect(tabAt(0).getAttribute('data-scui-current')).toBe('');
    expect(tabAt(1).hasAttribute('data-scui-current')).toBe(false);
  });

  it('受控 value 变化后激活态跟随回弹', () => {
    const [value, setValue] = createSignal('a');
    render(() => <Tabs items={makeItems()} value={value()} />);
    setValue('c');
    expect(tabAt(2).getAttribute('data-scui-current')).toBe('');
    expect(tabAt(0).hasAttribute('data-scui-current')).toBe(false);
  });

  it('激活态不混用 -active / -selected', () => {
    render(() => <Tabs items={makeItems()} />);
    expect(tabAt(0).hasAttribute('data-scui-active')).toBe(false);
    expect(tabAt(0).hasAttribute('data-scui-selected')).toBe(false);
  });
});

describe('Tabs：懒加载推迟内容创建', () => {
  it('lazy 默认 true：只有激活 panel 的 content 工厂被调用', () => {
    const calls: string[] = [];
    render(() => <Tabs items={makeItems((key) => calls.push(key))} />);
    expect(calls).toEqual(['a']);
    expect(document.querySelector('[data-testid="panel-a"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="panel-b"]')).toBeNull();
  });

  it('切到第二项后旧 panel 卸载、新 panel 才创建', () => {
    const calls: string[] = [];
    render(() => <Tabs items={makeItems((key) => calls.push(key))} />);
    fireEvent.click(tabAt(1));
    expect(calls).toContain('b');
    expect(document.querySelector('[data-testid="panel-b"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="panel-a"]')).toBeNull();
    expect(document.querySelector('[data-testid="panel-c"]')).toBeNull();
  });

  it('lazy=false 时三个 panel 首帧全挂载，非激活的用原生 hidden 收起', () => {
    const calls: string[] = [];
    render(() => <Tabs items={makeItems((key) => calls.push(key))} lazy={false} />);
    expect(calls.sort()).toEqual(['a', 'b', 'c']);
    expect(panels()).toHaveLength(3);
    expect(panelAt(0).hasAttribute('hidden')).toBe(false);
    expect(panelAt(1).hasAttribute('hidden')).toBe(true);
    expect(panelAt(2).hasAttribute('hidden')).toBe(true);
  });

  it('lazy=false 切换时只改 hidden，不重新创建内容', () => {
    const calls: string[] = [];
    render(() => <Tabs items={makeItems((key) => calls.push(key))} lazy={false} />);
    fireEvent.click(tabAt(1));
    expect(calls.sort()).toEqual(['a', 'b', 'c']);
    expect(panelAt(0).hasAttribute('hidden')).toBe(true);
    expect(panelAt(1).hasAttribute('hidden')).toBe(false);
  });
});
