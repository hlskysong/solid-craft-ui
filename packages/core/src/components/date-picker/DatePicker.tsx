/**
 * 日期选择（T2-10）。
 *
 * 三层分工：`calendar.ts` 只管日期（`@internationalized/date` + `Intl`），本文件只管
 * 交互与 `data-scui-*` 契约，`date-picker.scss` 只管视觉。
 *
 * 弹层内联在根节点里（`position: absolute`），不走 Portal：SSR 只输出输入框骨架，
 * 日历仅在客户端展开时挂载，所以服务端零 `today()` 调用、首帧与客户端一致。
 *
 * `editing` 状态机（`docs/04 §5.4` 点名的 bug 高发区）：
 *  输入框文本 = `editing() ? draft() : formatDate(当前值)`。
 *  - 点日历格 / 点「今天」：直接写值并退出编辑态；
 *  - 手输：只改 `draft`，失焦或回车才提交；
 *  - 提交时解析失败、越界或被 `disabledDate` 命中：**丢弃 draft 回到当前值**（可恢复）；
 *  - 受控方不回写时，退出编辑态即回弹到外部值，与其它控件口径一致。
 */
import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  Show,
  splitProps,
} from 'solid-js';
import type { JSX } from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import { resolveValue } from '../../utils/resolve-value';
import { resolveStatus, useInputValue } from '../input/use-input-value';
import {
  buildMonthGrid,
  DEFAULT_ANCHOR,
  dayLabel,
  formatDate,
  isAllowed,
  monthLabel,
  moveFocus,
  NAV_KEYS,
  parseIso,
  shiftMonths,
  todayIso,
  weekdayLabels,
  ZH_LOCALE,
  type DateLimits,
  type DateValue,
} from './calendar';
import type { DatePickerProps } from './types';

export function DatePicker(props: DatePickerProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'value',
    'defaultValue',
    'onChange',
    'min',
    'max',
    'disabledDate',
    'format',
    'weekStartsOn',
    'placeholder',
    'size',
    'status',
    'disabled',
    'allowClear',
    'clearLabel',
    'todayLabel',
    'aria-label',
    'name',
    'class',
  ]);

  const bridge = useInputValue<HTMLInputElement>({
    value: () => local.value,
    defaultValue: () => local.defaultValue,
    // 值桥回调是「值 + 原生事件」两参；DatePicker 公共契约是单参，包一层避免透出 undefined。
    onChange: () => (local.onChange ? (next: string) => local.onChange?.(next) : undefined),
  });

  let control: HTMLInputElement | undefined;
  const dayButtons = new Map<string, HTMLButtonElement>();
  /** 是否要在本次「开弹层 / 移动焦点」后把 DOM 焦点交给日历格（仅键盘路径置真）。 */
  let pendingGridFocus = false;

  const calendarId = `${CSS_PREFIX}date-calendar-${createUniqueId()}`;

  const [draft, setDraft] = createSignal('');
  const [editing, setEditing] = createSignal(false);
  const [open, setOpen] = createSignal(false);
  const [focused, setFocused] = createSignal<DateValue>(DEFAULT_ANCHOR);

  const pattern = () => local.format ?? 'YYYY-MM-DD';
  const weekStart = () => local.weekStartsOn ?? 'mon';
  const size = () => local.size ?? 'medium';
  const disabled = createMemo(
    () => Boolean(resolveValue(local.disabled ?? false)) || (bridge.field?.disabled() ?? false),
  );
  const invalid = () => resolveStatus(local.status, bridge.field) === 'error';

  const minDate = createMemo<DateValue | null>(() =>
    local.min ? parseIso(resolveValue(local.min)) : null,
  );
  const maxDate = createMemo<DateValue | null>(() =>
    local.max ? parseIso(resolveValue(local.max)) : null,
  );
  const limits = createMemo<DateLimits>(() => ({
    min: minDate(),
    max: maxDate(),
    disabledDate: local.disabledDate,
  }));

  const selected = createMemo<DateValue | null>(() => parseIso(bridge.value()));
  const selectedIso = () => selected()?.toString() ?? '';
  const focusedIso = () => focused().toString();

  // 编辑态显示 draft；否则显示按 format 格式化的当前值（非法存量值原样回显，避免吞数据）。
  const display = createMemo(() => {
    if (editing()) return draft();
    const date = selected();
    return date ? formatDate(date, pattern()) : bridge.value();
  });

  const grid = createMemo(() =>
    buildMonthGrid(focused(), { weekStart: weekStart(), limits: limits() }),
  );

  createEffect(() => {
    if (!open()) return;
    const iso = focused().toString();
    if (!pendingGridFocus) return;
    pendingGridFocus = false;
    // 等 `For` 把本月节点插进 DOM 后再移交焦点，避免焦点落到已卸载的旧格上。
    queueMicrotask(() => dayButtons.get(iso)?.focus());
  });

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) control?.focus();
  };

  const commit = (iso: string) => {
    if (iso !== bridge.value()) bridge.setValue(iso);
    setDraft('');
    setEditing(false);
  };

  const clear = () => {
    commit('');
    close(false);
    control?.focus();
  };

  const confirmDraft = () => {
    if (!editing()) return;
    const parsed = parseIso(draft());
    if (parsed && isAllowed(parsed, limits())) commit(parsed.toString());
    setDraft('');
    setEditing(false);
  };

  const choose = (date: DateValue) => {
    if (disabled() || !isAllowed(date, limits())) return;
    commit(date.toString());
    close(true);
  };

  const openCalendar = () => {
    if (disabled()) return;
    setFocused(selected() ?? minDate() ?? DEFAULT_ANCHOR);
    setOpen(true);
  };

  const onControlKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key === 'Enter') {
      if (open()) {
        event.preventDefault();
        choose(focused());
        return;
      }
      confirmDraft();
      return;
    }
    if (!NAV_KEYS.includes(event.key)) return;
    event.preventDefault();
    pendingGridFocus = true;
    if (!open()) {
      openCalendar();
      return;
    }
    setFocused(moveFocus(focused(), event.key, weekStart()));
  };

  const onPopupKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
      return;
    }
    // Tab 只负责离开弹层，不让焦点在 42 个格子间空转。
    if (event.key === 'Tab') {
      setOpen(false);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      choose(focused());
      return;
    }
    if (!NAV_KEYS.includes(event.key)) return;
    event.preventDefault();
    pendingGridFocus = true;
    setFocused(moveFocus(focused(), event.key, weekStart()));
  };

  const chooseToday = () => {
    const date = parseIso(todayIso());
    if (date) choose(date);
  };

  return (
    <div
      {...rest}
      class={classNames(`${CSS_PREFIX}date-picker`, local.class)}
      data-scui-role="date-picker"
      data-scui-size={size()}
      data-scui-invalid={invalid() ? 'true' : 'false'}
      data-scui-disabled={disabled() ? '' : undefined}
      data-scui-open={open() ? '' : undefined}
      lang={ZH_LOCALE}
      onFocusOut={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        setOpen(false);
      }}
    >
      <input
        {...(bridge.field ? bridge.field.aria() : {})}
        ref={(element) => {
          control = element;
        }}
        class={`${CSS_PREFIX}date-picker__input`}
        data-scui-role="date-input"
        type="text"
        name={local.name}
        value={display()}
        placeholder={local.placeholder ?? 'YYYY-MM-DD'}
        aria-label={local['aria-label'] ?? '日期'}
        aria-invalid={invalid() ? 'true' : 'false'}
        // WAI-ARIA 1.2 的「可编辑 combobox + dialog 弹层」：input 裸挂 aria-expanded 会被
        // axe 判 aria-allowed-attr(critical)（textbox 不允许该状态），必须显式声明 combobox。
        role="combobox"
        aria-haspopup="dialog"
        aria-expanded={open() ? 'true' : 'false'}
        aria-controls={open() ? calendarId : undefined}
        autocomplete="off"
        disabled={disabled()}
        onInput={(event) => {
          setDraft(event.currentTarget.value);
          setEditing(true);
        }}
        onClick={() => {
          if (!open()) openCalendar();
        }}
        onBlur={confirmDraft}
        onKeyDown={onControlKeyDown}
      />

      <Show when={local.allowClear && bridge.value().length > 0 && !disabled()}>
        <button
          type="button"
          class={`${CSS_PREFIX}date-picker__clear`}
          data-scui-role="date-clear"
          aria-label={local.clearLabel ?? '清除'}
          tabIndex={-1}
          onClick={clear}
        >
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true">
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </Show>

      <Show when={open()}>
        <div
          class={`${CSS_PREFIX}date-picker__popup`}
          data-scui-role="calendar-popup"
          role="dialog"
          aria-modal="false"
          aria-label={`${monthLabel(focused())}，选择日期`}
          onKeyDown={onPopupKeyDown}
        >
          <div class={`${CSS_PREFIX}date-picker__header`}>
            <button
              type="button"
              class={`${CSS_PREFIX}date-picker__nav`}
              data-scui-role="month-prev"
              aria-label="上个月"
              onClick={() => setFocused(shiftMonths(focused(), -1))}
            >
              ‹
            </button>
            <span class={`${CSS_PREFIX}date-picker__month`} data-scui-role="month-label">
              {monthLabel(focused())}
            </span>
            <button
              type="button"
              class={`${CSS_PREFIX}date-picker__nav`}
              data-scui-role="month-next"
              aria-label="下个月"
              onClick={() => setFocused(shiftMonths(focused(), 1))}
            >
              ›
            </button>
          </div>

          {/* 用真实 table / th / td 承载日历语义，不在 div 上硬挂角色，也不给 td 强挂
              role=gridcell：非交互原生元素挂交互角色会被 biome 判 a11y 错误，且 aria-selected
              无处安放。选中态改由格子按钮的 aria-pressed 表达（与 S-05 试点同一取舍）。 */}
          <table
            id={calendarId}
            class={`${CSS_PREFIX}date-picker__calendar`}
            data-scui-role="calendar"
            aria-label={monthLabel(focused())}
          >
            <thead>
              <tr data-scui-role="weekdays">
                <For each={weekdayLabels(weekStart())}>
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
                            ref={(element) => {
                              dayButtons.set(cell.iso, element);
                            }}
                            class={`${CSS_PREFIX}date-picker__day`}
                            data-scui-day={cell.iso}
                            data-scui-outside={cell.outside ? '' : undefined}
                            data-scui-disabled={cell.disabled ? '' : undefined}
                            data-scui-selected={cell.iso === selectedIso() ? '' : undefined}
                            aria-label={dayLabel(cell.date)}
                            aria-pressed={cell.iso === selectedIso() ? 'true' : 'false'}
                            aria-disabled={cell.disabled ? 'true' : undefined}
                            disabled={cell.disabled}
                            tabindex={cell.iso === focusedIso() ? 0 : -1}
                            onClick={() => choose(cell.date)}
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

          <div class={`${CSS_PREFIX}date-picker__footer`}>
            <button
              type="button"
              class={`${CSS_PREFIX}date-picker__action`}
              data-scui-role="date-today"
              onClick={chooseToday}
            >
              {local.todayLabel ?? '今天'}
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
}
