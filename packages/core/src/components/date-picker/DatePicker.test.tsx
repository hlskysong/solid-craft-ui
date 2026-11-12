/**
 * `DatePicker` 组件层单测（T2-10）。
 *
 * 日期运算 / 中文格式化已由 `calendar.ts` 的纯函数承担，这里只验组件层自己负责的事：
 *  1. `data-scui-*` 状态契约与三档尺寸、A11y 属性；
 *  2. 值桥（受控 / 非受控 / `<Form.Item>` 字段优先）；
 *  3. `editing` 状态机：手输合法就提交、非法或越界就回滚（不触发 `onChange`）；
 *  4. `min` / `max` / `disabledDate` 在日历格上真的禁用，点不动也进不去；
 *  5. 键盘（方向键 / 回车 / Esc）与清除。
 *
 * SSR 双渲确定性由 `spikes/shared/ssr-smoke.mjs` 的 T2-10 入口验：jsdom 下 JSX 已被
 * 编成 `document.createElement`，这里做不了真 SSR。
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import { today, getLocalTimeZone } from '@internationalized/date';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Form } from '../form';
import { DatePicker } from './DatePicker';

afterEach(cleanup);

function element<T extends HTMLElement = HTMLElement>(selector: string): T {
  const node = document.querySelector(selector);
  if (!(node instanceof HTMLElement)) throw new Error(`未找到元素 ${selector}`);
  return node as T;
}

const root = () => element('[data-scui-role="date-picker"]');
const control = () => element<HTMLInputElement>('[data-scui-role="date-input"]');
const calendar = () => document.querySelector('[data-scui-role="calendar"]');
const dayCell = (iso: string) => element<HTMLButtonElement>(`button[data-scui-day="${iso}"]`);

const openCalendar = () => {
  fireEvent.click(control());
};

describe('DatePicker 状态契约与 A11y', () => {
  it('默认输出 medium / invalid=false，且未展开时不渲染日历', () => {
    render(() => <DatePicker />);

    expect(root().getAttribute('data-scui-size')).toBe('medium');
    expect(root().getAttribute('data-scui-invalid')).toBe('false');
    expect(root().hasAttribute('data-scui-open')).toBe(false);
    expect(root().hasAttribute('data-scui-disabled')).toBe(false);
    expect(root().getAttribute('lang')).toBe('zh-CN');
    expect(calendar()).toBeNull();
    // 可编辑 combobox + dialog 弹层：input 裸挂 aria-expanded 会被 axe 判 critical，
    // 所以 role=combobox 是 A11y 契约的一部分，不是可选装饰。
    expect(control().getAttribute('role')).toBe('combobox');
    expect(control().getAttribute('aria-haspopup')).toBe('dialog');
    expect(control().getAttribute('aria-expanded')).toBe('false');
  });

  it('三档尺寸与 error / disabled 状态', () => {
    render(() => (
      <>
        <DatePicker size="small" />
        <DatePicker size="large" status="error" />
        <DatePicker disabled />
      </>
    ));

    const roots = document.querySelectorAll('[data-scui-role="date-picker"]');
    expect(roots[0]?.getAttribute('data-scui-size')).toBe('small');
    expect(roots[1]?.getAttribute('data-scui-size')).toBe('large');
    expect(roots[1]?.getAttribute('data-scui-invalid')).toBe('true');
    const disabledRoot = roots[2];
    expect(disabledRoot?.hasAttribute('data-scui-disabled')).toBe(true);
    const disabledInput = disabledRoot?.querySelector('input');
    expect(disabledInput instanceof HTMLInputElement && disabledInput.disabled).toBe(true);
  });

  it('展开后输出中文月标题与 6×7 网格', () => {
    render(() => <DatePicker defaultValue="2026-03-15" />);
    openCalendar();

    expect(root().hasAttribute('data-scui-open')).toBe(true);
    expect(control().getAttribute('aria-expanded')).toBe('true');
    expect(calendar()).not.toBeNull();
    expect(element('[data-scui-role="month-label"]').textContent).toBe('2026年3月');

    const weekdays = [...document.querySelectorAll('[data-scui-role="weekdays"] th')].map(
      (node) => node.textContent,
    );
    expect(weekdays).toEqual(['周一', '周二', '周三', '周四', '周五', '周六', '周日']);
    expect(document.querySelectorAll('button[data-scui-day]')).toHaveLength(42);
    // 选中态用 aria-pressed 表达（td 不挂 gridcell，aria-selected 没有合法宿主）。
    expect(dayCell('2026-03-15').getAttribute('aria-pressed')).toBe('true');
    expect(dayCell('2026-03-16').getAttribute('aria-pressed')).toBe('false');
  });

  it('周首日可切到周日', () => {
    render(() => <DatePicker weekStartsOn="sun" />);
    openCalendar();

    const weekdays = [...document.querySelectorAll('[data-scui-role="weekdays"] th')].map(
      (node) => node.textContent,
    );
    expect(weekdays[0]).toBe('周日');
  });
});

describe('DatePicker 值桥', () => {
  it('非受控：点格选中并回写输入框', async () => {
    const onChange = vi.fn();
    render(() => <DatePicker defaultValue="2026-03-15" onChange={onChange} />);
    openCalendar();

    fireEvent.click(dayCell('2026-03-20'));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('2026-03-20'));
    expect(control().value).toBe('2026-03-20');
    expect(calendar()).toBeNull();
  });

  it('受控：外部不回写时保持外部值（标准回弹）', () => {
    const onChange = vi.fn();
    render(() => <DatePicker value="2026-03-15" onChange={onChange} />);
    openCalendar();

    fireEvent.click(dayCell('2026-03-20'));

    expect(onChange).toHaveBeenCalledWith('2026-03-20');
    expect(control().value).toBe('2026-03-15');
  });

  it('format 只改显示不改值', () => {
    const onChange = vi.fn();
    render(() => (
      <DatePicker defaultValue="2026-03-15" format="YYYY年M月D日" onChange={onChange} />
    ));

    expect(control().value).toBe('2026年3月15日');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('被 <Form.Item> 包裹时以字段值为唯一数据源，并继承字段 aria', () => {
    render(() => (
      <Form initialValues={{ signDate: '2026-03-15' }}>
        <Form.Item name="signDate" label="签署日期">
          <DatePicker />
        </Form.Item>
      </Form>
    ));

    expect(control().value).toBe('2026-03-15');
    expect(control().getAttribute('aria-labelledby')).toBeTruthy();
    expect(control().id).toBeTruthy();
    openCalendar();
    fireEvent.click(dayCell('2026-03-18'));
    expect(control().value).toBe('2026-03-18');
  });
});

describe('DatePicker editing 状态机', () => {
  it('手输合法 ISO 回车即提交', async () => {
    const onChange = vi.fn();
    render(() => <DatePicker onChange={onChange} />);

    fireEvent.input(control(), { target: { value: '2026-05-06' } });
    fireEvent.keyDown(control(), { key: 'Enter' });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('2026-05-06'));
    expect(control().value).toBe('2026-05-06');
  });

  it('非法输入失焦后恢复为当前值，且不触发 onChange', () => {
    const onChange = vi.fn();
    render(() => <DatePicker defaultValue="2026-03-15" onChange={onChange} />);

    fireEvent.input(control(), { target: { value: '2026-02-31' } });
    expect(control().value).toBe('2026-02-31');

    fireEvent.blur(control());

    expect(control().value).toBe('2026-03-15');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('越界输入（早于 min）失焦后恢复，不写值', () => {
    const onChange = vi.fn();
    render(() => <DatePicker defaultValue="2026-03-15" min="2026-03-10" onChange={onChange} />);

    fireEvent.input(control(), { target: { value: '2026-03-01' } });
    fireEvent.blur(control());

    expect(control().value).toBe('2026-03-15');
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('DatePicker 边界与键盘', () => {
  it('min / max 在日历格上禁用越界日期', () => {
    render(() => <DatePicker min="2026-03-10" max="2026-03-20" />);
    openCalendar();

    expect(dayCell('2026-03-09').disabled).toBe(true);
    expect(dayCell('2026-03-09').hasAttribute('data-scui-disabled')).toBe(true);
    expect(dayCell('2026-03-21').disabled).toBe(true);
    expect(dayCell('2026-03-10').disabled).toBe(false);
    expect(dayCell('2026-03-20').disabled).toBe(false);
  });

  it('disabledDate 与 min / max 叠加生效，禁用格点不动', () => {
    const onChange = vi.fn();
    render(() => (
      <DatePicker
        defaultValue="2026-03-15"
        max="2026-03-28"
        disabledDate={(date) => date.day % 2 === 0}
        onChange={onChange}
      />
    ));
    openCalendar();

    expect(dayCell('2026-03-16').disabled).toBe(true);
    expect(dayCell('2026-03-17').disabled).toBe(false);
    expect(dayCell('2026-03-29').disabled).toBe(true);

    fireEvent.click(dayCell('2026-03-16'));
    expect(onChange).not.toHaveBeenCalled();
    expect(control().value).toBe('2026-03-15');
  });

  it('方向键移动焦点、回车选中、Esc 关闭', async () => {
    const onChange = vi.fn();
    render(() => <DatePicker defaultValue="2026-03-15" onChange={onChange} />);
    openCalendar();

    fireEvent.keyDown(control(), { key: 'ArrowRight' });
    await waitFor(() => expect(dayCell('2026-03-16').getAttribute('tabindex')).toBe('0'));

    fireEvent.keyDown(control(), { key: 'Enter' });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('2026-03-16'));

    openCalendar();
    fireEvent.keyDown(control(), { key: 'Escape' });
    expect(calendar()).toBeNull();
  });

  it('PageDown 翻到下个月，选区仍留在原值', () => {
    render(() => <DatePicker defaultValue="2026-03-15" />);
    openCalendar();

    fireEvent.keyDown(control(), { key: 'PageDown' });

    expect(element('[data-scui-role="month-label"]').textContent).toBe('2026年4月');
    expect(control().value).toBe('2026-03-15');
  });

  it('「今天」按钮选中当天', async () => {
    const onChange = vi.fn();
    render(() => <DatePicker onChange={onChange} />);
    openCalendar();

    const expected = today(getLocalTimeZone()).toString();
    fireEvent.click(element('[data-scui-role="date-today"]'));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(expected));
    expect(control().value).toBe(expected);
  });
});

describe('DatePicker 清除', () => {
  it('有值且 allowClear 时出现清除按钮，点击发空串', async () => {
    const onChange = vi.fn();
    render(() => <DatePicker defaultValue="2026-03-15" allowClear onChange={onChange} />);

    fireEvent.click(element('[data-scui-role="date-clear"]'));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(''));
    expect(control().value).toBe('');
    expect(document.querySelector('[data-scui-role="date-clear"]')).toBeNull();
  });

  it('无值或禁用时不渲染清除按钮', () => {
    render(() => (
      <>
        <DatePicker allowClear />
        <DatePicker defaultValue="2026-03-15" allowClear disabled />
      </>
    ));

    expect(document.querySelectorAll('[data-scui-role="date-clear"]')).toHaveLength(0);
  });
});
