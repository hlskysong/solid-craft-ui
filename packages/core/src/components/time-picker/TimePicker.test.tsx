/**
 * `TimePicker` 单测（T4-13）。
 *
 * 覆盖值格式 / 12 小时制 / 时间列选择 / 手输恢复 / 禁用规则 / 键盘 / data-* 契约。
 * 焦点陷阱与真实指针行为交给 browser.spec.ts 的 T4-13 用例。
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TimePicker } from './TimePicker';

afterEach(cleanup);

const picker = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="time-picker"]');
const input = (): HTMLInputElement | null =>
  document.querySelector<HTMLInputElement>('[data-scui-role="time-input"]');
const popup = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="time-popup"]');
const options = (column: string): HTMLElement[] =>
  Array.from(
    document.querySelectorAll<HTMLElement>(
      `[data-scui-role="time-column"][data-scui-time-unit="${column}"] [data-scui-role="time-option"]`,
    ),
  );

const open = async (): Promise<void> => {
  const el = input();
  if (el) fireEvent.click(el);
  await waitFor(() => expect(popup()).not.toBeNull());
};

describe('TimePicker：值与显示', () => {
  it('默认输出输入框骨架与状态两态，弹层不在 DOM', () => {
    render(() => <TimePicker aria-label="时间" />);
    expect(picker()?.getAttribute('data-scui-size')).toBe('medium');
    expect(picker()?.getAttribute('data-scui-invalid')).toBe('false');
    expect(input()?.getAttribute('aria-expanded')).toBe('false');
    expect(popup()).toBeNull();
  });

  it('受控值按 24 小时制回显', () => {
    render(() => <TimePicker value="14:05" aria-label="时间" />);
    expect(input()?.value).toBe('14:05');
  });

  it('showSeconds 时值与显示带秒', () => {
    render(() => <TimePicker value="14:05:30" showSeconds aria-label="时间" />);
    expect(input()?.value).toBe('14:05:30');
  });

  it('hour12 只改变显示，不改变值', () => {
    render(() => <TimePicker value="14:05" hour12 format="A HH:mm" aria-label="时间" />);
    expect(input()?.value).toBe('下午 02:05');
  });

  it('自定义格式', () => {
    render(() => <TimePicker value="14:05" format="H 时 mm 分" aria-label="时间" />);
    expect(input()?.value).toBe('14 时 05 分');
  });
});

describe('TimePicker：选择与状态机', () => {
  it('点时间列选项写值，浮层保持打开可继续选', async () => {
    const onChange = vi.fn();
    render(() => <TimePicker defaultValue="09:30" onChange={onChange} aria-label="时间" />);
    await open();

    const minute = options('minute').find((el) => el.getAttribute('data-scui-index') === '45');
    expect(minute).toBeDefined();
    fireEvent.click(minute as HTMLElement);

    expect(onChange).toHaveBeenCalledWith('09:45');
    expect(popup()).not.toBeNull();
  });

  it('点确定关闭弹层并把焦点还给输入框', async () => {
    render(() => <TimePicker defaultValue="09:30" aria-label="时间" />);
    await open();
    const ok = screen.getByRole('button', { name: '确定' });
    fireEvent.click(ok);
    await waitFor(() => expect(popup()).toBeNull());
    expect(document.activeElement).toBe(input());
  });

  it('手输非法值失焦后回弹到当前值', () => {
    render(() => <TimePicker defaultValue="09:30" aria-label="时间" />);
    const el = input();
    if (!el) throw new Error('input 为空');
    fireEvent.input(el, { target: { value: '25:99' } });
    expect(el.value).toBe('25:99');
    fireEvent.blur(el);
    expect(el.value).toBe('09:30');
  });

  it('手输越界被 min / max 拒绝', () => {
    render(() => <TimePicker defaultValue="09:30" min="08:00" max="10:00" aria-label="时间" />);
    const el = input();
    if (!el) throw new Error('input 为空');
    fireEvent.input(el, { target: { value: '12:00' } });
    fireEvent.blur(el);
    expect(el.value).toBe('09:30');
  });

  it('allowClear 有值时出现清除按钮，点击清空', () => {
    const onChange = vi.fn();
    render(() => (
      <TimePicker defaultValue="09:30" allowClear onChange={onChange} aria-label="时间" />
    ));
    const clear = screen.getByRole('button', { name: '清除' });
    fireEvent.click(clear);
    expect(onChange).toHaveBeenCalledWith('');
    expect(input()?.value).toBe('');
  });

  it('status=error 输出 invalid 两态', () => {
    render(() => <TimePicker value="09:30" status="error" aria-label="时间" />);
    expect(picker()?.getAttribute('data-scui-invalid')).toBe('true');
  });
});

describe('TimePicker：键盘与禁用', () => {
  it('ArrowDown 打开、Escape 关闭', async () => {
    render(() => <TimePicker defaultValue="09:30" aria-label="时间" />);
    fireEvent.keyDown(input() as HTMLInputElement, { key: 'ArrowDown' });
    await waitFor(() => expect(popup()).not.toBeNull());
    fireEvent.keyDown(input() as HTMLInputElement, { key: 'Escape' });
    await waitFor(() => expect(popup()).toBeNull());
  });

  it('面板内方向键切列，不冒泡给外层日历', async () => {
    const onOuterKey = vi.fn();
    render(() => (
      <fieldset onKeyDown={onOuterKey}>
        <TimePicker defaultValue="09:30" aria-label="时间" />
      </fieldset>
    ));
    await open();
    const option = document.querySelector('[data-scui-role="time-option"]');
    fireEvent.keyDown(option as HTMLElement, { key: 'ArrowLeft' });
    expect(onOuterKey).not.toHaveBeenCalled();
  });

  it('disabledTime 命中的选项不可点', async () => {
    render(() => (
      <TimePicker
        defaultValue="09:30"
        disabledTime={(time) => time.hour === 10}
        aria-label="时间"
      />
    ));
    await open();
    const hour10 = options('hour').find((el) => el.getAttribute('data-scui-index') === '10');
    expect(hour10?.hasAttribute('data-scui-disabled')).toBe(true);
    expect((hour10 as HTMLButtonElement).disabled).toBe(true);
  });

  it('disabled 时不打开弹层', () => {
    render(() => <TimePicker defaultValue="09:30" disabled aria-label="时间" />);
    fireEvent.click(input() as HTMLInputElement);
    expect(popup()).toBeNull();
    expect(picker()?.hasAttribute('data-scui-disabled')).toBe(true);
  });
});
