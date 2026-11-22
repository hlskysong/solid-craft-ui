/**
 * 时间面板（T4-13）：TimePicker 与 DatePicker `showTime` 共用的唯一交互面。
 *
 * 不在公共 index 导出：TimePicker 用它做浮层内容，DatePicker 把它嵌进日历弹层，
 * 两边共用同一套列定义 / 键盘导航 / 禁用规则，避免两处各写一份时间列。
 *
 * SSR：面板只在客户端展开时挂载；本文件不读取当前时间，默认锚点来自 `DEFAULT_TIME`。
 */
import { createMemo, createSignal, Index } from 'solid-js';
import type { JSX } from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import {
  DEFAULT_TIME,
  hourOptions,
  isTimeAllowed,
  MERIDIEMS,
  minuteOptions,
  parseTime,
  timeIso,
} from './time';
import type { TimeColumn, TimeLimits, TimeValue } from './types';

export interface TimePanelProps {
  /** 当前值（24 小时制 ISO）。 */
  value: string;
  /** 选中回调，参数是 24 小时制 ISO。 */
  onChange: (iso: string) => void;
  /** 是否带秒。 */
  showSeconds?: boolean;
  /** 是否 12 小时制。 */
  hour12?: boolean;
  /** 禁用规则。 */
  limits?: TimeLimits;
  /** 整块禁用。 */
  disabled?: boolean;
  /** 嵌入别的弹层时不带自己的定位外壳。 */
  embedded?: boolean;
  /** 附加类名。 */
  class?: string;
}

interface TimeOption {
  key: string;
  label: string;
  selected: boolean;
  disabled: boolean;
  next: TimeValue;
}

interface TimeColumnDef {
  key: TimeColumn;
  label: string;
  options: readonly TimeOption[];
}

const NAV_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];

/** 与 TimePicker 共用的时间列面板（内部组件，不进公共导出）。 */
export function TimePanel(props: TimePanelProps): JSX.Element {
  const optionRefs = new Map<string, HTMLButtonElement>();
  const [active, setActive] = createSignal<{ column: TimeColumn; index: number } | null>(null);

  const current = createMemo<TimeValue>(() => parseTime(props.value) ?? { ...DEFAULT_TIME });
  const withSeconds = () => props.showSeconds === true;
  const twelve = () => props.hour12 === true;
  const limits = (): TimeLimits => props.limits ?? {};

  const columns = createMemo<readonly TimeColumnDef[]>(() => {
    const time = current();
    const next = (patch: Partial<TimeValue>): TimeValue => ({ ...time, ...patch });
    const make = (
      key: TimeColumn,
      source: readonly { value: number | string; label: string }[],
      build: (value: number | string) => TimeValue,
    ): TimeOption[] =>
      source.map((item) => {
        const candidate = build(item.value);
        return {
          key: `${key}:${item.value}`,
          label: item.label,
          selected:
            key === 'meridiem'
              ? (item.value === 'am') === time.hour < 12
              : key === 'hour'
                ? candidate.hour === time.hour
                : key === 'minute'
                  ? candidate.minute === time.minute
                  : candidate.second === time.second,
          disabled: props.disabled === true || !isTimeAllowed(candidate, limits()),
          next: candidate,
        };
      });

    const result: TimeColumnDef[] = [];
    if (twelve()) {
      result.push({
        key: 'meridiem',
        label: '时段',
        options: make('meridiem', MERIDIEMS, (value) =>
          next({ hour: (time.hour % 12) + (value === 'pm' ? 12 : 0) }),
        ),
      });
    }
    result.push({
      key: 'hour',
      label: '时',
      options: make('hour', hourOptions(twelve()), (value) => {
        const display = Number(value);
        const hour = twelve() ? (display % 12) + (time.hour < 12 ? 0 : 12) : display;
        return next({ hour });
      }),
    });
    result.push({
      key: 'minute',
      label: '分',
      options: make('minute', minuteOptions(), (value) => next({ minute: Number(value) })),
    });
    if (withSeconds()) {
      result.push({
        key: 'second',
        label: '秒',
        options: make('second', minuteOptions(), (value) => next({ second: Number(value) })),
      });
    }
    return result;
  });

  const focusOption = (column: TimeColumn, index: number): void => {
    const list = columns().find((item) => item.key === column)?.options ?? [];
    if (list.length === 0) return;
    const wrapped = ((index % list.length) + list.length) % list.length;
    setActive({ column, index: wrapped });
    const key = list[wrapped]?.key;
    if (key) queueMicrotask(() => optionRefs.get(key)?.focus());
  };

  const currentIndex = (column: TimeColumn): number => {
    const list = columns().find((item) => item.key === column)?.options ?? [];
    const hit = active();
    if (hit?.column === column) return hit.index;
    const selected = list.findIndex((option) => option.selected);
    return selected < 0 ? 0 : selected;
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (!NAV_KEYS.includes(event.key)) return;
    event.preventDefault();
    // 嵌在 DatePicker 弹层里时，方向键不能被外层日历导航抢走。
    event.stopPropagation();
    const list = columns();
    const hit = active();
    const columnIndex = Math.max(
      0,
      list.findIndex((item) => item.key === (hit?.column ?? list[0]?.key)),
    );
    const column = list[columnIndex];
    if (!column) return;
    const index = currentIndex(column.key);
    switch (event.key) {
      case 'ArrowUp':
        focusOption(column.key, index - 1);
        break;
      case 'ArrowDown':
        focusOption(column.key, index + 1);
        break;
      case 'ArrowLeft':
        focusOption(list[Math.max(0, columnIndex - 1)]?.key ?? column.key, index);
        break;
      case 'ArrowRight':
        focusOption(list[Math.min(list.length - 1, columnIndex + 1)]?.key ?? column.key, index);
        break;
      case 'Home':
        focusOption(column.key, 0);
        break;
      case 'End':
        focusOption(column.key, column.options.length - 1);
        break;
    }
  };

  const apply = (option: TimeOption, column: TimeColumn, index: number): void => {
    if (option.disabled) return;
    setActive({ column, index });
    props.onChange(timeIso(option.next, withSeconds()));
  };

  return (
    <div
      class={classNames(`${CSS_PREFIX}time-picker__panel`, props.class)}
      data-scui-role="time-panel"
      data-scui-hour12={twelve() ? '' : undefined}
      data-scui-seconds={withSeconds() ? '' : undefined}
    >
      <Index each={columns()}>
        {(column) => (
          <div
            class={`${CSS_PREFIX}time-picker__column`}
            data-scui-role="time-column"
            data-scui-time-unit={column().key}
          >
            <div class={`${CSS_PREFIX}time-picker__column-label`} aria-hidden="true">
              {column().label}
            </div>
            <div
              class={`${CSS_PREFIX}time-picker__options`}
              role="listbox"
              aria-label={column().label}
              aria-disabled={props.disabled === true ? 'true' : undefined}
            >
              {/* 列与选项数量固定，值变化只改内容：用 Index 按位置复用 DOM。
                  若用 For（按对象引用 keyed），每次值变化都会重建全部按钮，
                  被点按钮销毁 → focusout.relatedTarget=null → 外层误关弹层（T4-13 实测）。 */}
              <Index each={column().options}>
                {(option, index) => (
                  <div role="presentation">
                    <button
                      ref={(element) => {
                        optionRefs.set(option().key, element);
                      }}
                      type="button"
                      role="option"
                      class={`${CSS_PREFIX}time-picker__option`}
                      data-scui-role="time-option"
                      data-scui-index={index}
                      data-scui-selected={option().selected ? '' : undefined}
                      data-scui-disabled={option().disabled ? '' : undefined}
                      aria-selected={option().selected ? 'true' : 'false'}
                      aria-disabled={option().disabled ? 'true' : undefined}
                      disabled={option().disabled}
                      tabindex={option().selected ? 0 : -1}
                      onKeyDown={onKeyDown}
                      onFocus={() => setActive({ column: column().key, index })}
                      onClick={() => apply(option(), column().key, index)}
                    >
                      {option().label}
                    </button>
                  </div>
                )}
              </Index>
            </div>
          </div>
        )}
      </Index>
    </div>
  );
}
