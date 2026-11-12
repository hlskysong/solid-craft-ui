/**
 * `Select` 组件层单测（T2-07）。
 *
 * 原语层的键盘 / typeahead / 焦点 / Portal 已由 `src/primitives/primitives.test.tsx`
 * 覆盖，这里只验组件层自己负责的四件事：值桥（受控 / 非受控 / 字段优先级）、
 * 本地搜索与空态、清除、以及 `data-scui-*` 状态契约与 A11y 属性。
 *
 * SSR 双渲确定性由 `spikes/shared/ssr-smoke.mjs` 的 T2-07 入口验，
 * jsdom 下 JSX 已被编成 `document.createElement`，这里做不了真 SSR。
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Select } from './Select';
import type { SelectOption } from './types';

afterEach(cleanup);

const options: SelectOption[] = [
  { value: 'sjz', label: '石家庄' },
  { value: 'hd', label: '邯郸' },
  { value: 'ts', label: '唐山', disabled: true },
];

function element<T extends HTMLElement = HTMLElement>(selector: string): T {
  const node = document.querySelector(selector);
  if (!(node instanceof HTMLElement)) throw new Error(`未找到元素 ${selector}`);
  return node as T;
}

const root = () => element('[data-scui-role="select"]');
const trigger = () => element<HTMLButtonElement>('[data-scui-primitive="select-trigger"]');
const optionNodes = () => document.querySelectorAll('[data-scui-option]');

async function openSelect(): Promise<void> {
  fireEvent.keyDown(trigger(), { key: 'ArrowDown' });
  await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument());
}

describe('Select：状态契约与 A11y', () => {
  it('默认输出 medium / invalid=false / 占位文案，展开前没有 open 标记', () => {
    render(() => <Select options={options} aria-label="城市" />);

    expect(root()).toHaveAttribute('data-scui-role', 'select');
    expect(root()).toHaveAttribute('data-scui-size', 'medium');
    expect(root()).toHaveAttribute('data-scui-invalid', 'false');
    expect(root()).not.toHaveAttribute('data-scui-open');
    expect(trigger()).toHaveTextContent('请选择');
    expect(trigger()).toHaveAttribute('aria-invalid', 'false');
  });

  it('三档尺寸、error / disabled / loading 各自落到 data-* 与 aria 上', () => {
    const { unmount } = render(() => (
      <Select options={options} size="large" status="error" aria-label="城市" />
    ));
    expect(root()).toHaveAttribute('data-scui-size', 'large');
    expect(root()).toHaveAttribute('data-scui-invalid', 'true');
    expect(trigger()).toHaveAttribute('aria-invalid', 'true');
    unmount();

    render(() => <Select options={options} disabled loading aria-label="城市" />);
    expect(root()).toHaveAttribute('data-scui-disabled', '');
    expect(root()).toHaveAttribute('data-scui-loading', '');
    expect(root()).toHaveAttribute('aria-busy', 'true');
    expect(trigger()).toBeDisabled();
  });

  it('size 由响应式 props 驱动，变化时 DOM 属性同步更新', () => {
    const [small, setSmall] = createSignal(true);
    render(() => <Select options={options} size={small() ? 'small' : 'large'} />);
    expect(root()).toHaveAttribute('data-scui-size', 'small');
    setSmall(false);
    expect(root()).toHaveAttribute('data-scui-size', 'large');
  });
});

describe('Select：值桥', () => {
  it('非受控：键盘展开 → 选中 → 回调 → 显示更新 → 收起', async () => {
    const onChange = vi.fn();
    render(() => <Select options={options} onChange={onChange} aria-label="城市" />);

    await openSelect();
    expect(root()).toHaveAttribute('data-scui-open', '');

    fireEvent.keyDown(element('[data-scui-option="hd"]'), { key: 'Enter' });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('hd'));
    await waitFor(() => expect(trigger()).toHaveTextContent('邯郸'));
    await waitFor(() => expect(root()).not.toHaveAttribute('data-scui-open'));
  });

  it('受控：外部不回写时保持原值，但回调照常发出', async () => {
    const onChange = vi.fn();
    render(() => <Select options={options} value="sjz" onChange={onChange} aria-label="城市" />);

    await openSelect();
    fireEvent.click(element('[data-scui-option="hd"]'));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('hd'));
    await waitFor(() => expect(trigger()).toHaveTextContent('石家庄'));
  });

  it('defaultValue 只作为初始值，选中后仍可更新', () => {
    render(() => <Select options={options} defaultValue="hd" aria-label="城市" />);
    expect(trigger()).toHaveTextContent('邯郸');
  });

  it('options 传 getter 时保持响应式，展示文案随列表更新', () => {
    const [list, setList] = createSignal<SelectOption[]>([{ value: 'x', label: '旧选项' }]);
    render(() => <Select options={list} value="x" aria-label="城市" />);
    expect(trigger()).toHaveTextContent('旧选项');

    setList([{ value: 'x', label: '新选项' }]);
    expect(trigger()).toHaveTextContent('新选项');
  });

  it('禁用选项不可选中', async () => {
    const onChange = vi.fn();
    render(() => <Select options={options} onChange={onChange} aria-label="城市" />);

    await openSelect();
    const disabledOption = element('[data-scui-option="ts"]');
    expect(disabledOption).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(disabledOption);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Select：搜索 / 空态 / 加载', () => {
  it('本地搜索按 label 过滤，无匹配时输出空态', async () => {
    render(() => <Select options={options} searchable aria-label="城市" />);
    await openSelect();

    const search = element<HTMLInputElement>('[data-scui-role="select-search"]');
    expect(search).toHaveAttribute('aria-label', '搜索');

    fireEvent.input(search, { target: { value: '邯' } });
    await waitFor(() => expect(optionNodes()).toHaveLength(1));
    expect(element('[data-scui-option="hd"]')).toBeInTheDocument();

    fireEvent.input(search, { target: { value: '不存在' } });
    await waitFor(() =>
      expect(element('[data-scui-role="select-empty"]')).toHaveTextContent('无匹配结果'),
    );
  });

  it('关闭后重开会清空搜索词，不把上一次过滤带进下一次', async () => {
    render(() => <Select options={options} searchable aria-label="城市" />);
    await openSelect();
    fireEvent.input(element<HTMLInputElement>('[data-scui-role="select-search"]'), {
      target: { value: '邯' },
    });
    await waitFor(() => expect(optionNodes()).toHaveLength(1));

    fireEvent.keyDown(trigger(), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    await openSelect();

    expect(element<HTMLInputElement>('[data-scui-role="select-search"]').value).toBe('');
    expect(optionNodes()).toHaveLength(3);
  });

  it('选项为空时输出空态，空态文案可覆盖', async () => {
    render(() => <Select options={[]} emptyText="暂无数据" aria-label="城市" />);
    await openSelect();
    expect(element('[data-scui-role="select-empty"]')).toHaveTextContent('暂无数据');
  });

  it('loading 时不渲染选项，只显示加载提示', async () => {
    render(() => <Select options={options} loading loadingText="正在获取" aria-label="城市" />);
    await openSelect();

    expect(element('[data-scui-role="select-loading"]')).toHaveTextContent('正在获取');
    expect(optionNodes()).toHaveLength(0);
  });
});

describe('Select：清除', () => {
  it('有选中值时才出现，点击后发出空串并回到占位文案', () => {
    const onChange = vi.fn();
    const { unmount } = render(() => (
      <Select options={options} clearable onChange={onChange} aria-label="城市" />
    ));
    expect(screen.queryByRole('button', { name: '清除' })).not.toBeInTheDocument();
    unmount();

    render(() => (
      <Select options={options} defaultValue="hd" clearable onChange={onChange} aria-label="城市" />
    ));
    const clear = screen.getByRole('button', { name: '清除' });
    expect(clear).toHaveAttribute('data-scui-role', 'select-clear');

    fireEvent.click(clear);
    expect(onChange).toHaveBeenCalledWith('');
    expect(trigger()).toHaveTextContent('请选择');
    expect(screen.queryByRole('button', { name: '清除' })).not.toBeInTheDocument();
  });

  it('禁用态不渲染清除按钮，清除按钮的无障碍名称可覆盖', () => {
    render(() => (
      <Select
        options={options}
        defaultValue="hd"
        clearable
        clearLabel="清空选择"
        disabled
        aria-label="城市"
      />
    ));
    expect(screen.queryByRole('button', { name: '清空选择' })).not.toBeInTheDocument();
  });
});
