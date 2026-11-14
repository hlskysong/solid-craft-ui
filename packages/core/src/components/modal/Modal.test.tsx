/**
 * `Modal` 单测（T3-07）。
 *
 * 覆盖 §4.2 T3-07 验收列里能在 jsdom 判的部分：受控 / 非受控、异步关闭期间
 * 防重复提交、ESC / 取消 / 关闭按钮三条路径、footer 语义、尺寸与宽度。
 *
 * 焦点陷阱与「ESC 后焦点归还触发元素」是真实浏览器布局 / 焦点行为，
 * jsdom 没有 focus scope，交给 `tests/e2e/specs/browser.spec.ts` 的 T3-07 用例；
 * SSR 不渲染弹层由 `spikes/shared/ssr-smoke.mjs` 的 T3-07 入口 + 原语层
 * `useClientReady` 首帧断言共同覆盖。
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Modal } from './Modal';

afterEach(cleanup);

const dialog = (): HTMLElement | null => document.querySelector<HTMLElement>('[role="dialog"]');
const content = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="modal"]');
const footer = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="modal-footer"]');
const closeButton = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="modal-close"]');
const okButton = (): HTMLElement => screen.getByRole('button', { name: '确定' });
const cancelButton = (): HTMLElement => screen.getByRole('button', { name: '取消' });

const openDialog = async (): Promise<void> => {
  await waitFor(() => expect(dialog()).not.toBeNull());
};

describe('Modal：打开与受控优先级', () => {
  it('默认关闭：DOM 里既没有 dialog 也没有遮罩', () => {
    render(() => <Modal title="标题">正文</Modal>);
    expect(dialog()).toBeNull();
    expect(document.querySelector('[data-scui-role="modal-overlay"]')).toBeNull();
  });

  it('defaultOpen 非受控打开，标题成为 dialog 的 accessible name', async () => {
    render(() => (
      <Modal title="编辑采购计划" defaultOpen>
        <p>正文</p>
      </Modal>
    ));
    await openDialog();
    expect(screen.getByRole('dialog', { name: '编辑采购计划' })).toBeInTheDocument();
    expect(content()?.getAttribute('data-scui-size')).toBe('medium');
  });

  it('受控 open=true 打开；点确定只发事件，DOM 必须由调用方回弹', async () => {
    const onOpenChange = vi.fn();
    render(() => (
      <Modal title="标题" open onOpenChange={onOpenChange}>
        正文
      </Modal>
    ));
    await openDialog();

    fireEvent.click(okButton());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    // 受控时组件不得自己改状态：调用方没回写，弹层仍在
    expect(dialog()).not.toBeNull();
  });

  it('非受控点确定后真正关闭', async () => {
    const onOpenChange = vi.fn();
    render(() => (
      <Modal title="标题" defaultOpen onOpenChange={onOpenChange}>
        正文
      </Modal>
    ));
    await openDialog();
    fireEvent.click(okButton());
    await waitFor(() => expect(dialog()).toBeNull());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('外部信号驱动受控开关可反复打开', async () => {
    const [open, setOpen] = createSignal(false);
    render(() => (
      <Modal title="标题" open={open()} onOpenChange={setOpen}>
        正文
      </Modal>
    ));
    expect(dialog()).toBeNull();
    setOpen(true);
    await openDialog();
    fireEvent.click(okButton());
    await waitFor(() => expect(dialog()).toBeNull());
    setOpen(true);
    await openDialog();
  });
});

describe('Modal：关闭路径与 footer', () => {
  it('取消按钮触发 onCancel，并带出 onOpenChange(false)', async () => {
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();
    render(() => (
      <Modal title="标题" defaultOpen onCancel={onCancel} onOpenChange={onOpenChange}>
        正文
      </Modal>
    ));
    await openDialog();
    fireEvent.click(cancelButton());
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(dialog()).toBeNull());
  });

  it('ESC 关闭走同一条 onCancel 路径', async () => {
    const onCancel = vi.fn();
    render(() => (
      <Modal title="标题" defaultOpen onCancel={onCancel}>
        正文
      </Modal>
    ));
    await openDialog();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(dialog()).toBeNull());
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('keyboard=false 时 ESC 不关闭', async () => {
    const onCancel = vi.fn();
    render(() => (
      <Modal title="标题" defaultOpen keyboard={false} onCancel={onCancel}>
        正文
      </Modal>
    ));
    await openDialog();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(dialog()).not.toBeNull();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('右上角关闭按钮有可读名称，点击后关闭', async () => {
    render(() => (
      <Modal title="标题" defaultOpen closeLabel="收起">
        正文
      </Modal>
    ));
    await openDialog();
    const close = closeButton();
    expect(close?.getAttribute('aria-label')).toBe('收起');
    expect(close?.getAttribute('disabled')).toBeNull();
    if (close) fireEvent.click(close);
    await waitFor(() => expect(dialog()).toBeNull());
  });

  it('closable=false 不渲染关闭按钮', async () => {
    render(() => (
      <Modal title="标题" defaultOpen closable={false}>
        正文
      </Modal>
    ));
    await openDialog();
    expect(closeButton()).toBeNull();
  });

  it('点遮罩关闭：走 onCancel 与 onOpenChange 同一条出口', async () => {
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();
    render(() => (
      <Modal title="标题" defaultOpen onCancel={onCancel} onOpenChange={onOpenChange}>
        正文
      </Modal>
    ));
    await openDialog();
    const overlay = document.querySelector<HTMLElement>('[data-scui-role="modal-overlay"]');
    expect(overlay).not.toBeNull();
    if (overlay) fireEvent.pointerDown(overlay);
    // 单一出口：Kobalte 自己的 outside dismiss 必须被挡掉，不能连发两次
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(dialog()).toBeNull());
  });

  it('maskClosable=false 时点遮罩不关闭', async () => {
    const onCancel = vi.fn();
    render(() => (
      <Modal title="标题" defaultOpen maskClosable={false} onCancel={onCancel}>
        正文
      </Modal>
    ));
    await openDialog();
    const overlay = document.querySelector<HTMLElement>('[data-scui-role="modal-overlay"]');
    if (overlay) fireEvent.pointerDown(overlay);
    expect(onCancel).not.toHaveBeenCalled();
    expect(dialog()).not.toBeNull();
  });

  it('footer={null} 整块不渲染，不留空盒子', async () => {
    render(() => (
      <Modal title="标题" defaultOpen footer={null}>
        正文
      </Modal>
    ));
    await openDialog();
    expect(footer()).toBeNull();
    expect(screen.queryByRole('button', { name: '确定' })).toBeNull();
  });

  it('自定义 footer 整体替换默认按钮', async () => {
    render(() => (
      <Modal title="标题" defaultOpen footer={<button type="button">去归档</button>}>
        正文
      </Modal>
    ));
    await openDialog();
    expect(screen.getByRole('button', { name: '去归档' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '确定' })).toBeNull();
  });

  it('okText / cancelText 可覆盖默认文案', async () => {
    render(() => (
      <Modal title="标题" defaultOpen okText="提交" cancelText="返回">
        正文
      </Modal>
    ));
    await openDialog();
    expect(screen.getByRole('button', { name: '提交' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '返回' })).toBeInTheDocument();
  });
});

describe('Modal：尺寸与宽度', () => {
  it('三档 size 写进 data-scui-size', async () => {
    const [size, setSize] = createSignal<'small' | 'medium' | 'large'>('small');
    render(() => (
      <Modal title="标题" defaultOpen size={size()}>
        正文
      </Modal>
    ));
    await openDialog();
    expect(content()?.getAttribute('data-scui-size')).toBe('small');
    setSize('large');
    await waitFor(() => expect(content()?.getAttribute('data-scui-size')).toBe('large'));
  });

  it('width 数字按 px 写进内联自定义属性，字符串原样保留', async () => {
    const [width, setWidth] = createSignal<number | string>(640);
    render(() => (
      <Modal title="标题" defaultOpen width={width()}>
        正文
      </Modal>
    ));
    await openDialog();
    expect(content()?.getAttribute('style')).toContain('--scui-modal-width: 640px');
    setWidth('60vw');
    await waitFor(() => expect(content()?.getAttribute('style')).toContain('60vw'));
  });
});

describe('Modal：异步关闭与防重复提交', () => {
  /** 返回一个可手动 resolve / reject 的 Promise，便于精确控制时序。 */
  function deferred(): { promise: Promise<void>; resolve: () => void; reject: () => void } {
    let resolve!: () => void;
    let reject!: () => void;
    const promise = new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }

  it('onOk 返回 Promise 期间：pending 属性 + 按钮禁用 + 重复点击只发一次', async () => {
    const d = deferred();
    const onOk = vi.fn(() => d.promise);
    render(() => (
      <Modal title="标题" defaultOpen onOk={onOk}>
        正文
      </Modal>
    ));
    await openDialog();

    fireEvent.click(okButton());
    expect(onOk).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(content()?.getAttribute('data-scui-pending')).toBe(''));
    expect(okButton()).toBeDisabled();
    expect(cancelButton()).toBeDisabled();
    expect(closeButton()?.hasAttribute('disabled')).toBe(true);

    fireEvent.click(okButton());
    fireEvent.click(cancelButton());
    expect(onOk).toHaveBeenCalledTimes(1);
    expect(dialog()).not.toBeNull();

    d.resolve();
    await waitFor(() => expect(dialog()).toBeNull());
  });

  it('pending 期间 ESC 与遮罩点击都不会关闭，也不会触发 onCancel', async () => {
    const d = deferred();
    const onCancel = vi.fn();
    render(() => (
      <Modal title="标题" defaultOpen onCancel={onCancel} onOk={() => d.promise}>
        正文
      </Modal>
    ));
    await openDialog();
    fireEvent.click(okButton());
    await waitFor(() => expect(content()?.getAttribute('data-scui-pending')).toBe(''));

    fireEvent.keyDown(document, { key: 'Escape' });
    const overlay = document.querySelector<HTMLElement>('[data-scui-role="modal-overlay"]');
    if (overlay) fireEvent.pointerDown(overlay);
    expect(dialog()).not.toBeNull();
    expect(onCancel).not.toHaveBeenCalled();

    d.resolve();
    await waitFor(() => expect(dialog()).toBeNull());
  });

  it('onOk reject 时保持打开且可重试', async () => {
    const d = deferred();
    const onOk = vi
      .fn()
      .mockImplementationOnce(() => d.promise)
      .mockImplementationOnce(() => Promise.resolve());
    render(() => (
      <Modal title="标题" defaultOpen onOk={onOk}>
        正文
      </Modal>
    ));
    await openDialog();
    fireEvent.click(okButton());
    await waitFor(() => expect(content()?.getAttribute('data-scui-pending')).toBe(''));

    d.reject();
    await waitFor(() => expect(content()?.getAttribute('data-scui-pending')).toBeNull());
    expect(dialog()).not.toBeNull();

    fireEvent.click(okButton());
    expect(onOk).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(dialog()).toBeNull());
  });

  it('confirmLoading 受控时同样进入 pending 并拦截关闭', async () => {
    const onCancel = vi.fn();
    render(() => (
      <Modal title="标题" defaultOpen confirmLoading onCancel={onCancel}>
        正文
      </Modal>
    ));
    await openDialog();
    expect(content()?.getAttribute('data-scui-pending')).toBe('');
    expect(okButton()).toBeDisabled();
    fireEvent.click(cancelButton());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).not.toHaveBeenCalled();
    expect(dialog()).not.toBeNull();
  });

  it('同步 onOk 不进 pending，直接关闭', async () => {
    const onOk = vi.fn();
    render(() => (
      <Modal title="标题" defaultOpen onOk={onOk}>
        正文
      </Modal>
    ));
    await openDialog();
    fireEvent.click(okButton());
    expect(onOk).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(dialog()).toBeNull());
  });
});
