/**
 * S-02 客户端实证：样式覆盖钩（data-*）、键盘、焦点、SSR 契约。
 * Phase 0 只验可行性，不验全键盘矩阵（docs/01 §9 / docs/07 §6）。
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

import { ScuiDialog } from './Dialog';
import { ScuiSelect, type SelectOption } from './Select';

const options: SelectOption[] = [
  { value: 'a', label: '石家庄' },
  { value: 'b', label: '邯郸' },
  { value: 'c', label: '唐山', disabled: true },
];

describe('S-02 Kobalte Select 封装', () => {
  it('输出 CSS_PREFIX 派生类名与 data-* 状态，触发按钮 A11y 属性齐全', () => {
    render(() => <ScuiSelect options={options} aria-label="城市" />);
    const trigger = screen.getByRole('button', { name: '请选择' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('data-scui-size', 'medium');
    expect(trigger).toHaveClass('scui-select-trigger');
    expect(document.querySelector('.scui-select')).toHaveAttribute('data-scui-size', 'medium');
  });

  it('getter 注入（响应式契约）与 disabled 生效', () => {
    render(() => (
      <ScuiSelect
        options={() => options}
        value={() => 'a'}
        disabled={() => true}
        size="large"
        aria-label="城市"
      />
    ));
    const trigger = screen.getByRole('button', { name: '石家庄' });
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute('data-scui-size', 'large');
    expect(document.querySelector('.scui-select')).toHaveAttribute('data-scui-disabled', '');
  });

  it('点击展开列表、键盘选中并回调、Esc 关闭', async () => {
    const onChange = vi.fn();
    render(() => <ScuiSelect options={options} onChange={onChange} aria-label="城市" />);
    const trigger = screen.getByRole('button', { name: '请选择' });

    // 封装层的键盘契约：ArrowDown 展开 → 选项 Enter 提交 → Escape 关闭
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    // HiddenSelect 会同时渲染同文案的 <option>，用 data-scui-option 精确定位 Portal 项
    const optionB = document.querySelector('[data-scui-option="b"]') as HTMLElement;
    expect(optionB).toBeInTheDocument();

    // Kobalte 打开后把焦点收进 listbox（焦点陷阱 / 首项高亮），这是期望的 A11y 行为
    expect(screen.getByRole('listbox').contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(optionB, { key: 'Enter' });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('b'));

    fireEvent.keyDown(trigger, { key: 'Escape' });
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
  });

  it('禁用选项不可选中', async () => {
    const onChange = vi.fn();
    render(() => <ScuiSelect options={options} onChange={onChange} aria-label="城市" />);
    fireEvent.keyDown(screen.getByRole('button', { name: '请选择' }), { key: 'ArrowUp' });
    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument());
    expect(document.querySelector('[data-scui-option="c"]')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('S-02 Kobalte Dialog 封装', () => {
  it('触发后弹出对话框并可关闭，焦点交给内容区', async () => {
    render(() => <ScuiDialog trigger="打开设置" title="设置">预研内容</ScuiDialog>);
    const trigger = screen.getByRole('button', { name: '打开设置' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('data-scui-role', 'dialog-trigger');

    fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(screen.getByText('设置')).toBeInTheDocument();
    const close = document.querySelector('[data-scui-role="dialog-close"]');
    expect(close).toHaveAttribute('aria-label', 'Dismiss');

    fireEvent.click(close as HTMLElement);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
