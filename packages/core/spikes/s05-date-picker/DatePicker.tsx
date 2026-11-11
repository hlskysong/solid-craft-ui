/**
 * S-05 可行性预研：DatePicker 基础 / 禁用 / 键盘 / 中文 locale。
 *
 * 范围仅基础单选（RangePicker 按 docs/04 §5.4 仍属 v1.0）。
 * SSR 安全：默认锚点是固定日期常量，绝不调用 today() / Date.now() 作为初始值。
 */
import type { CalendarDate } from '@internationalized/date';
import { createMemo, createSignal, For, type JSX } from 'solid-js';

import { CSS_PREFIX } from '../../src/scope';
import { classNames } from '../../src/utils/class-names';
import { resolveValue, type MaybeAccessor } from '../../src/utils/resolve-value';

import {
  buildMonthGrid,
  formatMonthZh,
  moveFocus,
  parseInput,
  weekdayLabelsZh,
  ZH_LOCALE,
  type WeekStart,
} from './calendar';

/** SSR 稳定锚点：不取系统当前时间。 */
export const DEFAULT_ANCHOR = parseInput('2026-01-01');

export interface ScuiDatePickerProps {
  /** ISO 日期字符串（YYYY-MM-DD）；值 / getter 均可。 @default undefined */
  value?: MaybeAccessor<string | undefined>;
  /** 选中回调，返回 ISO 字符串。 */
  onChange?: (iso: string) => void;
  /** 禁用日期判定。 */
  disabledDate?: (date: CalendarDate) => boolean;
  /** 周首日。 @default 'mon' */
  weekStartsOn?: WeekStart;
  /** 输入框占位文案。 @default 'YYYY-MM-DD' */
  placeholder?: string;
  /** 无障碍标签。 @default '日期' */
  label?: string;
}

export function ScuiDatePicker(props: ScuiDatePickerProps): JSX.Element {
  const anchor = DEFAULT_ANCHOR;
  if (!anchor) throw new Error('S-05 固定锚点解析失败');
  const valueIso = createMemo(() => resolveValue(props.value) ?? '');
  const [editing, setEditing] = createSignal(valueIso());
  const [focused, setFocused] = createSignal<CalendarDate>(parseInput(valueIso()) ?? anchor);
  const [open, setOpen] = createSignal(false);
  const weekStart = createMemo(() => props.weekStartsOn ?? 'mon');
  const labels = createMemo(() => weekdayLabelsZh(weekStart()));
  const grid = createMemo(() =>
    buildMonthGrid(focused(), {
      weekStart: weekStart(),
      disabledDate: props.disabledDate,
    }),
  );

  const choose = (iso: string, disabled: boolean) => {
    if (disabled) return;
    setEditing(iso);
    setOpen(false);
    props.onChange?.(iso);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const keys = [
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
      'PageUp',
      'PageDown',
    ];
    if (keys.includes(event.key)) {
      event.preventDefault();
      setOpen(true);
      setFocused(moveFocus(focused(), event.key));
      return;
    }
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key === 'Enter') {
      const parsed = parseInput(editing());
      if (parsed) choose(parsed.toString(), props.disabledDate?.(parsed) ?? false);
      else setOpen(true);
    }
  };

  return (
    <div
      class={classNames(`${CSS_PREFIX}date-picker`)}
      data-scui-role="date-picker"
      data-scui-open={open() ? '' : undefined}
      lang={ZH_LOCALE}
    >
      <input
        class={classNames(`${CSS_PREFIX}date-input`)}
        data-scui-role="date-input"
        type="text"
        aria-label={props.label ?? '日期'}
        placeholder={props.placeholder ?? 'YYYY-MM-DD'}
        value={editing()}
        onInput={(event) => setEditing(event.currentTarget.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (!parseInput(editing())) setEditing(valueIso());
        }}
      />
      {/* 用真实 table / tr / th / td 承载日历语义，不在 div 上硬挂 ARIA role */}
      <table
        class={classNames(`${CSS_PREFIX}calendar`)}
        data-scui-role="calendar"
        aria-label={formatMonthZh(focused())}
        hidden={!open()}
      >
        <caption data-scui-role="month-label">{formatMonthZh(focused())}</caption>
        <thead>
          <tr data-scui-role="weekdays">
            <For each={labels()}>
              {(label) => <th scope="col">{label}</th>}
            </For>
          </tr>
        </thead>
        <tbody>
          <For each={grid()}>
            {(week) => (
              <tr>
                <For each={week}>
                  {(cell) => (
                    <td>
                      <button
                        type="button"
                        data-scui-day={cell.iso}
                        data-scui-outside={cell.outside ? '' : undefined}
                        data-scui-disabled={cell.disabled ? '' : undefined}
                        data-scui-selected={valueIso() === cell.iso ? '' : undefined}
                        aria-pressed={valueIso() === cell.iso}
                        aria-disabled={cell.disabled}
                        disabled={cell.disabled}
                        tabindex={focused().toString() === cell.iso ? 0 : -1}
                        onClick={() => choose(cell.iso, cell.disabled)}
                      >
                        {cell.date.day}
                      </button>
                    </td>
                  )}
                </For>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
}
