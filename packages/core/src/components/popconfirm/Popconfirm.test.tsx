/**
 * `Popconfirm` 单测（T3-09）。
 *
 * 覆盖 §4.2「异步确认」在 jsdom 能判的部分：pending 属性、防重复提交、
 * resolve 才关闭、reject 保持打开可重试、受控优先级、取消与文案覆盖。
 * ESC / 外部点击在 pending 期间的拦截由原语 `dismissible` 闸门负责，
 * jsdom 没有 DismissableLayer 的真实事件链，交给 browser 用例实证。
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Popconfirm } from './Popconfirm';

afterEach(cleanup);

const content = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="popconfirm"]');
const trigger = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="popconfirm-trigger"]');
const arrow = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="popconfirm-arrow"]');
const okButton = (): HTMLElement => screen.getByRole('button', { name: '确定' });
const cancelButton = (): HTMLElement => screen.getByRole('button', { name: '取消' });

const opened = async (): Promise<void> => {
  await waitFor(() => expect(content()).not.toBeNull());
};

function deferred(): { promise: Promise<void>; resolve: () => void; reject: () => void } {
  let resolve!: () => void;
  let reject!: () => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('Popconfirm：打开与方向', () => {
  it('默认关闭：只有触发按钮', () => {
    render(() => <Popconfirm title="确认删除？">删除</Popconfirm>);
    expect(trigger()?.textContent).toContain('删除');
    expect(content()).toBeNull();
  });

  it('defaultOpen 打开：标题 / 描述 / 按钮与方向属性齐备', async () => {
    render(() => (
      <Popconfirm
        title="确认删除？"
        description="删除后不可恢复"
        placement="bottom-end"
        defaultOpen
      >
        删除
      </Popconfirm>
    ));
    await opened();
    expect(content()?.getAttribute('data-scui-anchor')).toBe('bottom-end');
    expect(content()?.textContent).toContain('确认删除？');
    expect(content()?.textContent).toContain('删除后不可恢复');
    expect(okButton()).toBeInTheDocument();
    expect(cancelButton()).toBeInTheDocument();
  });

  it('默认方向 top；文案可被 okText / cancelText 覆盖', async () => {
    render(() => (
      <Popconfirm title="确认提交？" okText="提交" cancelText="返回" open>
        按钮
      </Popconfirm>
    ));
    await opened();
    expect(content()?.getAttribute('data-scui-anchor')).toBe('top');
    expect(screen.getByRole('button', { name: '提交' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '返回' })).toBeInTheDocument();
  });

  it('arrow=false 时箭头整块缺席', async () => {
    render(() => (
      <Popconfirm title="标题" open arrow={false}>
        按钮
      </Popconfirm>
    ));
    await opened();
    expect(arrow()).toBeNull();
  });

  it('disabled 落到触发按钮的原生 disabled', () => {
    render(() => (
      <Popconfirm title="标题" disabled>
        按钮
      </Popconfirm>
    ));
    expect(trigger()?.hasAttribute('disabled')).toBe(true);
  });
});

describe('Popconfirm：关闭路径与受控优先级', () => {
  it('点取消关闭并只发一次 onCancel', async () => {
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();
    render(() => (
      <Popconfirm title="标题" defaultOpen onCancel={onCancel} onOpenChange={onOpenChange}>
        按钮
      </Popconfirm>
    ));
    await opened();
    fireEvent.click(cancelButton());
    await waitFor(() => expect(content()).toBeNull());
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('同步 onOk 立即关闭', async () => {
    const onOk = vi.fn();
    render(() => (
      <Popconfirm title="标题" defaultOpen onOk={onOk}>
        按钮
      </Popconfirm>
    ));
    await opened();
    fireEvent.click(okButton());
    await waitFor(() => expect(content()).toBeNull());
    expect(onOk).toHaveBeenCalledTimes(1);
  });

  it('受控 open=true：点确定只发事件，DOM 由调用方回弹', async () => {
    const onOpenChange = vi.fn();
    render(() => (
      <Popconfirm title="标题" open onOpenChange={onOpenChange}>
        按钮
      </Popconfirm>
    ));
    await opened();
    fireEvent.click(okButton());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(content()).not.toBeNull();
  });

  it('调用方回弹：open 信号变 false 后浮层卸载', async () => {
    const [open, setOpen] = createSignal(true);
    render(() => (
      <Popconfirm title="标题" open={open()}>
        按钮
      </Popconfirm>
    ));
    await opened();
    setOpen(false);
    await waitFor(() => expect(content()).toBeNull());
  });
});

describe('Popconfirm：异步确认', () => {
  it('Promise 未 settle 时 pending 属性 + 按钮禁用 + 重复点击只发一次', async () => {
    const d = deferred();
    const onOk = vi.fn(() => d.promise);
    render(() => (
      <Popconfirm title="标题" defaultOpen onOk={onOk}>
        按钮
      </Popconfirm>
    ));
    await opened();

    fireEvent.click(okButton());
    expect(onOk).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(content()?.getAttribute('data-scui-pending')).toBe(''));
    expect(okButton()).toBeDisabled();
    expect(cancelButton()).toBeDisabled();

    fireEvent.click(okButton());
    fireEvent.click(cancelButton());
    expect(onOk).toHaveBeenCalledTimes(1);
    expect(content()).not.toBeNull();

    d.resolve();
    await waitFor(() => expect(content()).toBeNull());
  });

  it('reject 保持打开且可重试', async () => {
    const d = deferred();
    const onOk = vi
      .fn()
      .mockImplementationOnce(() => d.promise)
      .mockImplementationOnce(() => Promise.resolve());
    render(() => (
      <Popconfirm title="标题" defaultOpen onOk={onOk}>
        按钮
      </Popconfirm>
    ));
    await opened();
    fireEvent.click(okButton());
    await waitFor(() => expect(content()?.getAttribute('data-scui-pending')).toBe(''));

    d.reject();
    await waitFor(() => expect(content()?.getAttribute('data-scui-pending')).toBeNull());
    expect(content()).not.toBeNull();

    fireEvent.click(okButton());
    expect(onOk).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(content()).toBeNull());
  });
});
