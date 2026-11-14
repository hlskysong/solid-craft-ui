/**
 * `Tooltip` 单测（T3-09）。
 *
 * jsdom 能验的是「受控打开 / 方向属性 / 箭头开关 / 触发按钮语义」；
 * hover 延迟与 flip 定位是真实浏览器时序与布局，交给
 * `tests/e2e/specs/browser.spec.ts` 的 T3-09 用例与视觉基线。
 */
import { cleanup, render, screen, waitFor } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Tooltip } from './Tooltip';

afterEach(cleanup);

const content = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="tooltip"]');
const arrow = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="tooltip-arrow"]');
const trigger = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="tooltip-trigger"]');

const opened = async (): Promise<void> => {
  await waitFor(() => expect(content()).not.toBeNull());
};

describe('Tooltip：打开与方向', () => {
  it('默认关闭：只有触发按钮，浮层未挂载', () => {
    render(() => <Tooltip content="提示文案">悬停我</Tooltip>);
    expect(trigger()?.textContent).toContain('悬停我');
    expect(content()).toBeNull();
  });

  it('受控 open=true 打开，方向恒输出为 data-scui-anchor', async () => {
    render(() => (
      <Tooltip content="右侧提示" placement="right-start" open>
        悬停我
      </Tooltip>
    ));
    await opened();
    expect(content()?.getAttribute('data-scui-anchor')).toBe('right-start');
    expect(content()?.textContent).toContain('右侧提示');
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('默认方向是 top', async () => {
    render(() => (
      <Tooltip content="顶部提示" open>
        悬停我
      </Tooltip>
    ));
    await opened();
    expect(content()?.getAttribute('data-scui-anchor')).toBe('top');
  });

  it('defaultOpen 非受控打开，onOpenChange 只上报不吞掉事件', async () => {
    const onOpenChange = vi.fn();
    render(() => (
      <Tooltip content="提示" defaultOpen onOpenChange={onOpenChange}>
        悬停我
      </Tooltip>
    ));
    await opened();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('受控 open=false 时始终保持关闭，点击触发按钮也不自己改成打开', () => {
    render(() => (
      <Tooltip content="提示" open={false}>
        悬停我
      </Tooltip>
    ));
    expect(content()).toBeNull();
  });

  it('由调用方回弹：open 信号变 false 后浮层卸载', async () => {
    const [open, setOpen] = createSignal(true);
    render(() => (
      <Tooltip content="提示" open={open()}>
        悬停我
      </Tooltip>
    ));
    await opened();
    setOpen(false);
    await waitFor(() => expect(content()).toBeNull());
  });
});

describe('Tooltip：箭头与禁用', () => {
  it('默认渲染箭头', async () => {
    render(() => (
      <Tooltip content="提示" open>
        悬停我
      </Tooltip>
    ));
    await opened();
    expect(arrow()).not.toBeNull();
  });

  it('arrow=false 时箭头整块缺席', async () => {
    render(() => (
      <Tooltip content="提示" open arrow={false}>
        悬停我
      </Tooltip>
    ));
    await opened();
    expect(arrow()).toBeNull();
  });

  it('disabled 落到触发按钮的原生 disabled', () => {
    render(() => (
      <Tooltip content="提示" disabled>
        悬停我
      </Tooltip>
    ));
    expect(trigger()?.hasAttribute('disabled')).toBe(true);
  });
});
