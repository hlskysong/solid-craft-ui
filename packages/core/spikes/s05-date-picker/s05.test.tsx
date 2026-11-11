/**
 * S-05 实证：中文 locale、6×7 网格、禁用、键盘、非法输入恢复、SSR 锚点稳定。
 * ⚠️ 范围选择（RangePicker）按 docs/04 §5.4 属 v1.0，不在本 Spike。
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { parseDate } from '@internationalized/date';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildMonthGrid,
  formatMonthZh,
  moveFocus,
  parseInput,
  weekdayLabelsZh,
} from './calendar';
import { DEFAULT_ANCHOR, ScuiDatePicker } from './DatePicker';

afterEach(cleanup);

describe('S-05 中文 locale 与网格', () => {
  it('周首日周一 / 周日可配，月标题走 Intl 中文格式', () => {
    const mon = weekdayLabelsZh('mon');
    const sun = weekdayLabelsZh('sun');
    expect(mon).toHaveLength(7);
    expect(mon[0]).toContain('一');
    expect(sun[0]).toContain('日');
    expect(formatMonthZh(parseDate('2026-11-10'))).toContain('2026');
    expect(formatMonthZh(parseDate('2026-11-10'))).toContain('11');
  });

  it('6×7 固定网格，补位格与禁用格标记正确', () => {
    const grid = buildMonthGrid(parseDate('2026-11-10'), {
      disabledDate: (date) => date.day === 13,
    });
    expect(grid).toHaveLength(6);
    expect(grid.every((week) => week.length === 7)).toBe(true);
    const cells = grid.flat();
    expect(cells[0]?.iso).toBe('2026-10-26');
    expect(cells[0]?.outside).toBe(true);
    expect(cells.find((cell) => cell.iso === '2026-11-13')?.disabled).toBe(true);
  });

  it('严格 ISO 解析，非法输入返回 null', () => {
    expect(parseInput('2026-11-10')?.toString()).toBe('2026-11-10');
    expect(parseInput('2026/11/10')).toBeNull();
    expect(parseInput('2026-02-30')).toBeNull();
    expect(parseInput('')).toBeNull();
  });

  it('键盘导航按方向 / 周 / 月移动', () => {
    const base = parseDate('2026-11-10');
    expect(moveFocus(base, 'ArrowRight').toString()).toBe('2026-11-11');
    expect(moveFocus(base, 'ArrowDown').toString()).toBe('2026-11-17');
    expect(moveFocus(base, 'Home').toString()).toBe('2026-11-09');
    expect(moveFocus(base, 'End').toString()).toBe('2026-11-15');
    expect(moveFocus(base, 'PageDown').toString()).toBe('2026-12-10');
  });

  it('SSR 默认锚点是固定常量，不取系统当前时间', () => {
    expect(DEFAULT_ANCHOR?.toString()).toBe('2026-01-01');
  });
});

describe('S-05 组件交互', () => {
  it('受控值、选中回调、禁用日期不可选', () => {
    const onChange = vi.fn();
    render(() => (
      <ScuiDatePicker
        value="2026-11-10"
        onChange={onChange}
        disabledDate={(date) => date.day === 13}
        label="会议日期"
      />
    ));
    const input = screen.getByRole('textbox', { name: '会议日期' });
    expect(input).toHaveValue('2026-11-10');
    expect(document.querySelector('[data-scui-role="date-picker"]')).toHaveAttribute(
      'lang',
      'zh-CN',
    );
    expect(document.querySelector('[data-scui-day="2026-11-10"]')).toHaveAttribute(
      'data-scui-selected',
      '',
    );
    const disabled = document.querySelector('[data-scui-day="2026-11-13"]') as HTMLElement;
    expect(disabled).toBeDisabled();
    fireEvent.click(disabled);
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(document.querySelector('[data-scui-day="2026-11-12"]') as HTMLElement);
    expect(onChange).toHaveBeenCalledWith('2026-11-12');
  });

  it('非法输入失焦后恢复原值，键盘移动焦点日期', () => {
    render(() => <ScuiDatePicker value="2026-11-10" label="会议日期" />);
    const input = screen.getByRole('textbox', { name: '会议日期' });
    fireEvent.input(input, { target: { value: '不是日期' } });
    expect(input).toHaveValue('不是日期');
    fireEvent.blur(input);
    expect(input).toHaveValue('2026-11-10');

    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect(document.querySelector('[tabindex="0"][data-scui-day]')).toHaveAttribute(
      'data-scui-day',
      '2026-11-11',
    );
    fireEvent.keyDown(input, { key: 'PageDown' });
    expect(document.querySelector('[data-scui-role="month-label"]')?.textContent).toContain('12');
  });
});
