/**
 * T2-01 原语层客户端实证。
 *
 * 这里验的是「原语层自己负责的那部分」：DOM 契约（`data-scui-primitive` /
 * `data-scui-state`）、A11y 属性、键盘与选中链路、受控/非受控语义。
 * SSR 部分（双渲确定性 + 服务端不出弹层）由 `spikes/shared/ssr-smoke.mjs` 的
 * T2-01 入口验 —— vitest 跑在 jsdom，JSX 已被编成 `document.createElement`，做不了真 SSR。
 *
 * 不验样式：原语层不带任何 SCSS，视觉归上层组件。
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import { createRoot, createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PrimitiveDialog } from './dialog';
import { PrimitiveSelect } from './select';
import type { PrimitiveOption } from './types';
import { useClientReady } from './use-client-ready';

afterEach(cleanup);

describe('useClientReady', () => {
  it('首帧（组件体同步读取）必须是 false —— 否则客户端首帧就挂弹层，与 SSR 骨架 hydration 对不上', () => {
    let firstFrame: boolean | undefined;
    const dispose = createRoot((disposeRoot) => {
      const ready = useClientReady();
      // 组件体执行期 = 首帧，此刻 onMount 尚未运行
      firstFrame = ready();
      return disposeRoot;
    });

    expect(firstFrame).toBe(false);
    dispose();
  });
});

const options: PrimitiveOption[] = [
  { value: 'a', label: '石家庄' },
  { value: 'b', label: '邯郸' },
  { value: 'c', label: '唐山', disabled: true },
];

const selectRoot = () => document.querySelector('[data-scui-primitive="select"]');

/** 按选择器取元素；取不到直接失败，比 `as HTMLElement` 更早暴露问题 */
function element(selector: string): HTMLElement {
  const node = document.querySelector(selector);
  if (!(node instanceof HTMLElement)) throw new Error(`未找到元素 ${selector}`);
  return node;
}

describe('PrimitiveDialog', () => {
  it('触发按钮带 dialog A11y 契约，点击后弹出并把标题 / 描述 / 关闭按钮渲染到位', async () => {
    render(() => (
      <PrimitiveDialog trigger="打开设置" title="设置">
        原语层内容
      </PrimitiveDialog>
    ));

    const trigger = screen.getByRole('button', { name: '打开设置' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('data-scui-primitive', 'dialog-trigger');

    fireEvent.click(trigger);

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(screen.getByText('设置')).toBeInTheDocument();
    expect(screen.getByText('原语层内容')).toBeInTheDocument();
    expect(document.querySelector('[data-scui-primitive="dialog-content"]')).toBeInTheDocument();
    expect(document.querySelector('[data-scui-primitive="dialog-overlay"]')).toBeInTheDocument();

    const close = element('[data-scui-primitive="dialog-close"]');
    expect(close).toHaveAttribute('aria-label', '关闭');

    fireEvent.click(close);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('关闭按钮文案可覆盖，且 aria-label 跟随文案而不是库内置的 Dismiss', async () => {
    render(() => (
      <PrimitiveDialog trigger="打开" title="标题" closeLabel="知道了">
        内容
      </PrimitiveDialog>
    ));

    fireEvent.click(screen.getByRole('button', { name: '打开' }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    const close = element('[data-scui-primitive="dialog-close"]');
    expect(close).toHaveTextContent('知道了');
    expect(close).toHaveAttribute('aria-label', '知道了');
  });

  it('class 透传到触发按钮（原语层不产出自己的类名）', () => {
    render(() => (
      <PrimitiveDialog trigger="打开" title="标题" class="scui-modal__trigger">
        内容
      </PrimitiveDialog>
    ));

    expect(screen.getByRole('button', { name: '打开' })).toHaveClass('scui-modal__trigger');
  });

  it('打开状态回调在受控 / 非受控下都会触发', async () => {
    const onOpenChange = vi.fn();
    render(() => (
      <PrimitiveDialog trigger="打开" title="标题" onOpenChange={onOpenChange}>
        内容
      </PrimitiveDialog>
    ));

    fireEvent.click(screen.getByRole('button', { name: '打开' }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(true));
  });
});

describe('PrimitiveSelect', () => {
  it('默认输出收起态与占位文案，根节点带 primitive / state 契约', () => {
    render(() => <PrimitiveSelect options={options} aria-label="城市" />);

    const root = selectRoot();
    expect(root).toHaveAttribute('data-scui-state', 'closed');

    const trigger = screen.getByRole('button', { name: '请选择' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('data-scui-primitive', 'select-trigger');
  });

  it('键盘展开 → 选中 → 回调 → 收起，状态与文案同步', async () => {
    const onChange = vi.fn();
    render(() => <PrimitiveSelect options={options} onChange={onChange} aria-label="城市" />);

    const trigger = screen.getByRole('button', { name: '请选择' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });

    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    expect(selectRoot()).toHaveAttribute('data-scui-state', 'open');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // HiddenSelect 会同时渲染同文案的 <option>，用 data-scui-option 精确定位 Portal 项
    const optionB = element('[data-scui-option="b"]');
    fireEvent.keyDown(optionB, { key: 'Enter' });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('b'));
    await waitFor(() => expect(selectRoot()).toHaveAttribute('data-scui-state', 'closed'));
    await waitFor(() => expect(trigger).toHaveTextContent('邯郸'));
  });

  it('Escape 收起，且不触发值变化', async () => {
    const onChange = vi.fn();
    render(() => <PrimitiveSelect options={options} onChange={onChange} aria-label="城市" />);

    const trigger = screen.getByRole('button', { name: '请选择' });
    fireEvent.keyDown(trigger, { key: 'ArrowUp' });
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));

    fireEvent.keyDown(trigger, { key: 'Escape' });
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('受控 value 优先于内部状态：外部不给新值则显示不变', async () => {
    const onChange = vi.fn();
    render(() => (
      <PrimitiveSelect options={options} value="a" onChange={onChange} aria-label="城市" />
    ));

    const trigger = screen.getByRole('button', { name: '石家庄' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));

    fireEvent.click(element('[data-scui-option="b"]'));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('b'));

    // 受控：回调发生了，但显示仍由外部 value 决定
    await waitFor(() => expect(trigger).toHaveTextContent('石家庄'));
  });

  it('禁用态：按钮禁用、键盘不应展开、根节点带禁用标记', () => {
    render(() => <PrimitiveSelect options={options} disabled aria-label="城市" />);

    const trigger = screen.getByRole('button', { name: '请选择' });
    expect(trigger).toBeDisabled();
    expect(selectRoot()).toHaveAttribute('data-scui-disabled', '');

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('禁用选项不可选中', async () => {
    const onChange = vi.fn();
    render(() => <PrimitiveSelect options={options} onChange={onChange} aria-label="城市" />);

    fireEvent.keyDown(screen.getByRole('button', { name: '请选择' }), { key: 'ArrowDown' });
    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument());

    const optionC = element('[data-scui-option="c"]');
    expect(optionC).toHaveAttribute('aria-disabled', 'true');

    fireEvent.keyDown(optionC, { key: 'Enter' });
    fireEvent.click(optionC);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('options 传 getter 时保持响应式（原语层不冻结列表）', () => {
    const [list, setList] = createSignal<PrimitiveOption[]>([{ value: 'x', label: '旧选项' }]);

    render(() => <PrimitiveSelect options={list} value="x" aria-label="城市" />);
    expect(screen.getByRole('button', { name: '旧选项' })).toBeInTheDocument();

    setList([{ value: 'x', label: '新选项' }]);
    expect(screen.getByRole('button', { name: '新选项' })).toBeInTheDocument();
  });
});
