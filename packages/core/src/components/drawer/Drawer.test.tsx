/**
 * `Drawer` 单测（T3-08）。
 *
 * 覆盖 §4.2 T3-08 验收列里能在 jsdom 判的部分：受控 / 非受控、四方向、
 * 三档尺寸、方向对应的显式尺寸归一、键盘与遮罩关闭路径、footer 语义。
 *
 * 焦点陷阱与「ESC 后焦点归还触发元素」是真实浏览器的布局 / 焦点行为，
 * jsdom 没有 focus scope，交给 `tests/e2e/specs/browser.spec.ts` 的 T3-08 用例；
 * 「不重复实现浮层行为」由 `check:ci` 判据 4k 静态钉住（组件层不得出现
 * Portal / focus scope / ESC 钩子 / 第三方无头库）。
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DrawerPlacement, DrawerSize } from './types';
import { Drawer } from './Drawer';

afterEach(cleanup);

const dialog = (): HTMLElement | null => document.querySelector<HTMLElement>('[role="dialog"]');
const content = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="drawer"]');
const overlay = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="drawer-overlay"]');
const footer = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="drawer-footer"]');
const closeButton = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="drawer-close"]');

const openDrawer = async (): Promise<void> => {
  await waitFor(() => expect(dialog()).not.toBeNull());
};

describe('Drawer：打开与受控优先级', () => {
  it('默认关闭：DOM 里既没有 dialog 也没有遮罩', () => {
    render(() => <Drawer title="标题">正文</Drawer>);
    expect(dialog()).toBeNull();
    expect(overlay()).toBeNull();
  });

  it('defaultOpen 非受控打开，标题成为 dialog 的 accessible name', async () => {
    render(() => (
      <Drawer title="设备采购明细" defaultOpen>
        <p>正文</p>
      </Drawer>
    ));
    await openDrawer();
    expect(screen.getByRole('dialog', { name: '设备采购明细' })).toBeInTheDocument();
    expect(content()?.getAttribute('data-scui-side')).toBe('right');
    expect(content()?.getAttribute('data-scui-size')).toBe('medium');
  });

  it('受控 open=true 打开；点关闭只发事件，DOM 必须由调用方回弹', async () => {
    const onOpenChange = vi.fn();
    render(() => (
      <Drawer title="标题" open onOpenChange={onOpenChange}>
        正文
      </Drawer>
    ));
    await openDrawer();

    const close = closeButton();
    if (close) fireEvent.click(close);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    // 受控时组件不得自己改状态：调用方没回写，抽屉仍在
    expect(dialog()).not.toBeNull();
  });

  it('非受控点关闭后真正关闭', async () => {
    const onOpenChange = vi.fn();
    render(() => (
      <Drawer title="标题" defaultOpen onOpenChange={onOpenChange}>
        正文
      </Drawer>
    ));
    await openDrawer();
    const close = closeButton();
    if (close) fireEvent.click(close);
    await waitFor(() => expect(dialog()).toBeNull());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('外部信号驱动受控开关可反复打开', async () => {
    const [open, setOpen] = createSignal(false);
    render(() => (
      <Drawer title="标题" open={open()} onOpenChange={setOpen}>
        正文
      </Drawer>
    ));
    expect(dialog()).toBeNull();
    setOpen(true);
    await openDrawer();
    const close = closeButton();
    if (close) fireEvent.click(close);
    await waitFor(() => expect(dialog()).toBeNull());
    setOpen(true);
    await openDrawer();
  });
});

describe('Drawer：四方向与尺寸', () => {
  it('四个方向都写进 data-scui-side', async () => {
    const [side, setSide] = createSignal<DrawerPlacement>('left');
    render(() => (
      <Drawer title="标题" defaultOpen placement={side()}>
        正文
      </Drawer>
    ));
    await openDrawer();
    for (const next of ['left', 'right', 'top', 'bottom'] as const) {
      setSide(next);
      await waitFor(() => expect(content()?.getAttribute('data-scui-side')).toBe(next));
    }
  });

  it('三档 size 写进 data-scui-size', async () => {
    const [size, setSize] = createSignal<DrawerSize>('small');
    render(() => (
      <Drawer title="标题" defaultOpen size={size()}>
        正文
      </Drawer>
    ));
    await openDrawer();
    expect(content()?.getAttribute('data-scui-size')).toBe('small');
    for (const next of ['medium', 'large'] as const) {
      setSize(next);
      await waitFor(() => expect(content()?.getAttribute('data-scui-size')).toBe(next));
    }
  });

  it('width 只在左右方向生效，height 只在上下方向生效', async () => {
    const [side, setSide] = createSignal<DrawerPlacement>('right');
    render(() => (
      <Drawer title="标题" defaultOpen placement={side()} width={640} height={320}>
        正文
      </Drawer>
    ));
    await openDrawer();
    expect(content()?.getAttribute('style')).toContain('--scui-drawer-size: 640px');

    setSide('top');
    await waitFor(() =>
      expect(content()?.getAttribute('style')).toContain('--scui-drawer-size: 320px'),
    );
    expect(content()?.getAttribute('style')).not.toContain('640px');
  });

  it('显式尺寸数字按 px 处理，字符串原样保留', async () => {
    render(() => (
      <Drawer title="标题" defaultOpen width="60vw">
        正文
      </Drawer>
    ));
    await openDrawer();
    expect(content()?.getAttribute('style')).toContain('--scui-drawer-size: 60vw');
  });

  it('没传显式尺寸时不写内联自定义属性，交给三档 CSS 规则', async () => {
    render(() => (
      <Drawer title="标题" defaultOpen size="large">
        正文
      </Drawer>
    ));
    await openDrawer();
    // Kobalte 的 modal 模式自己会给 Content 写 pointer-events: auto，
    // 不能断言「style 属性为空」，只能断言我们没往里写自定义尺寸变量。
    expect(content()?.getAttribute('style') ?? '').not.toContain('--scui-drawer-size');
  });
});

describe('Drawer：关闭路径与 footer', () => {
  it('ESC 关闭走 onOpenChange(false)', async () => {
    const onOpenChange = vi.fn();
    render(() => (
      <Drawer title="标题" defaultOpen onOpenChange={onOpenChange}>
        正文
      </Drawer>
    ));
    await openDrawer();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(dialog()).toBeNull());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('keyboard=false 时 ESC 不关闭', async () => {
    const onOpenChange = vi.fn();
    render(() => (
      <Drawer title="标题" defaultOpen keyboard={false} onOpenChange={onOpenChange}>
        正文
      </Drawer>
    ));
    await openDrawer();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(dialog()).not.toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('点遮罩关闭：只发一次 onOpenChange(false)', async () => {
    const onOpenChange = vi.fn();
    render(() => (
      <Drawer title="标题" defaultOpen onOpenChange={onOpenChange}>
        正文
      </Drawer>
    ));
    await openDrawer();
    expect(overlay()).not.toBeNull();
    const mask = overlay();
    if (mask) fireEvent.pointerDown(mask);
    // 单一出口：Kobalte 自己的 outside dismiss 必须被原语挡掉，不能连发两次
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(dialog()).toBeNull());
  });

  it('maskClosable=false 时点遮罩不关闭', async () => {
    const onOpenChange = vi.fn();
    render(() => (
      <Drawer title="标题" defaultOpen maskClosable={false} onOpenChange={onOpenChange}>
        正文
      </Drawer>
    ));
    await openDrawer();
    const mask = overlay();
    if (mask) fireEvent.pointerDown(mask);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(dialog()).not.toBeNull();
  });

  it('右上角关闭按钮有可读名称，点击后关闭', async () => {
    render(() => (
      <Drawer title="标题" defaultOpen closeLabel="收起">
        正文
      </Drawer>
    ));
    await openDrawer();
    expect(closeButton()?.getAttribute('aria-label')).toBe('收起');
    expect(closeButton()?.getAttribute('disabled')).toBeNull();
    const close = closeButton();
    if (close) fireEvent.click(close);
    await waitFor(() => expect(dialog()).toBeNull());
  });

  it('closable=false 不渲染关闭按钮', async () => {
    render(() => (
      <Drawer title="标题" defaultOpen closable={false}>
        正文
      </Drawer>
    ));
    await openDrawer();
    expect(closeButton()).toBeNull();
  });

  it('默认不渲染 footer，footer={null} 也不留空盒子', async () => {
    const { unmount } = render(() => (
      <Drawer title="标题" defaultOpen>
        正文
      </Drawer>
    ));
    await openDrawer();
    expect(footer()).toBeNull();
    unmount();

    render(() => (
      <Drawer title="标题" defaultOpen footer={null}>
        正文
      </Drawer>
    ));
    await openDrawer();
    expect(footer()).toBeNull();
  });

  it('自定义 footer 整块渲染，无默认确认按钮', async () => {
    render(() => (
      <Drawer title="标题" defaultOpen footer={<button type="button">去归档</button>}>
        正文
      </Drawer>
    ));
    await openDrawer();
    expect(footer()).not.toBeNull();
    expect(screen.getByRole('button', { name: '去归档' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '确定' })).toBeNull();
  });
});
