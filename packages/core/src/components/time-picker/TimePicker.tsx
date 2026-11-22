/**
 * 时间选择（T4-13）。
 *
 * 结构沿用 DatePicker：输入框 + 内联浮层（不走 Portal），SSR 只输出输入框骨架，
 * 时间列在客户端展开时才挂载。值一律是 24 小时制 ISO `HH:mm`（`showSeconds`
 * 时 `HH:mm:ss`），12 小时制只改变显示。
 *
 * 编辑态与 DatePicker 同口径：手输只改 draft，失焦 / 回车才提交；解析失败或越界
 * 则丢弃 draft 回到当前值。受控方不回写时退出编辑态即回弹到外部值。
 */
import { createMemo, createSignal, createUniqueId, Show, splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import { resolveValue } from '../../utils/resolve-value';
import { resolveStatus, useInputValue } from '../input/use-input-value';
import { TimePanel } from './TimePanel';
import { formatTime, isTimeAllowed, parseTime, timeIso } from './time';
import type { TimeLimits, TimePickerProps } from './types';

export function TimePicker(props: TimePickerProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'value',
    'defaultValue',
    'onChange',
    'showSeconds',
    'hour12',
    'format',
    'min',
    'max',
    'disabledTime',
    'placeholder',
    'size',
    'status',
    'disabled',
    'allowClear',
    'clearLabel',
    'okLabel',
    'aria-label',
    'name',
    'class',
  ]);

  const bridge = useInputValue<HTMLInputElement>({
    value: () => local.value,
    defaultValue: () => local.defaultValue,
    onChange: () => (local.onChange ? (next: string) => local.onChange?.(next) : undefined),
  });

  let control: HTMLInputElement | undefined;
  let root: HTMLDivElement | undefined;
  const panelId = `${CSS_PREFIX}time-panel-${createUniqueId()}`;

  const [draft, setDraft] = createSignal('');
  const [editing, setEditing] = createSignal(false);
  const [open, setOpen] = createSignal(false);

  const withSeconds = () => local.showSeconds === true;
  const twelve = () => Boolean(resolveValue(local.hour12 ?? false));
  const size = () => local.size ?? 'medium';
  const pattern = () => {
    if (local.format !== undefined) return local.format;
    // hour12 的默认显示必须带 A，否则「上午/下午」列选了却看不出效果。
    return (twelve() ? 'A ' : '') + (withSeconds() ? 'HH:mm:ss' : 'HH:mm');
  };
  const disabled = createMemo(
    () => Boolean(resolveValue(local.disabled ?? false)) || (bridge.field?.disabled() ?? false),
  );
  const invalid = () => resolveStatus(local.status, bridge.field) === 'error';

  const limits = createMemo<TimeLimits>(() => ({
    min: local.min ? resolveValue(local.min) : undefined,
    max: local.max ? resolveValue(local.max) : undefined,
    disabledTime: local.disabledTime,
  }));

  const current = createMemo(() => parseTime(bridge.value()));
  const display = createMemo(() => {
    if (editing()) return draft();
    const time = current();
    return time ? formatTime(time, pattern(), twelve()) : bridge.value();
  });

  const close = (restoreFocus: boolean): void => {
    setOpen(false);
    if (restoreFocus) control?.focus();
  };

  const commit = (iso: string): void => {
    if (iso !== bridge.value()) bridge.setValue(iso);
    setDraft('');
    setEditing(false);
  };

  const clear = (): void => {
    commit('');
    setOpen(false);
    control?.focus();
  };

  const confirmDraft = (): void => {
    if (!editing()) return;
    const parsed = parseTime(draft());
    if (parsed && isTimeAllowed(parsed, limits())) {
      commit(timeIso(parsed, withSeconds() || pattern().includes('ss')));
    }
    setDraft('');
    setEditing(false);
  };

  const openPanel = (): void => {
    if (disabled()) return;
    setOpen(true);
  };

  const onControlKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openPanel();
      return;
    }
    if (event.key === 'Enter') {
      if (open()) {
        event.preventDefault();
        close(true);
        return;
      }
      confirmDraft();
    }
  };

  return (
    <div
      {...rest}
      ref={(element) => {
        root = element;
      }}
      class={classNames(`${CSS_PREFIX}time-picker`, local.class)}
      data-scui-role="time-picker"
      data-scui-size={size()}
      data-scui-invalid={invalid() ? 'true' : 'false'}
      data-scui-disabled={disabled() ? '' : undefined}
      data-scui-open={open() ? '' : undefined}
      lang="zh-CN"
      onFocusOut={(event) => {
        const next = event.relatedTarget;
        // Solid on* 走事件委托，handler 里的 currentTarget 不是根节点 —— 必须用 ref，
        // 否则点面板里的选项会被误判为「焦点离开控件」而立刻收起弹层。
        if (next instanceof Node && root?.contains(next)) return;
        setOpen(false);
      }}
    >
      <input
        {...(bridge.field ? bridge.field.aria() : {})}
        ref={(element) => {
          control = element;
        }}
        class={`${CSS_PREFIX}time-picker__input`}
        data-scui-role="time-input"
        type="text"
        name={local.name}
        value={display()}
        placeholder={local.placeholder ?? (withSeconds() ? 'HH:mm:ss' : 'HH:mm')}
        aria-label={local['aria-label'] ?? '时间'}
        aria-invalid={invalid() ? 'true' : 'false'}
        role="combobox"
        aria-haspopup="dialog"
        aria-expanded={open() ? 'true' : 'false'}
        aria-controls={open() ? panelId : undefined}
        autocomplete="off"
        disabled={disabled()}
        onInput={(event) => {
          setDraft(event.currentTarget.value);
          setEditing(true);
        }}
        onClick={() => {
          if (!open()) openPanel();
        }}
        onBlur={confirmDraft}
        onKeyDown={onControlKeyDown}
      />

      <Show when={local.allowClear && bridge.value().length > 0 && !disabled()}>
        <button
          type="button"
          class={`${CSS_PREFIX}time-picker__clear`}
          data-scui-role="time-clear"
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
          id={panelId}
          class={`${CSS_PREFIX}time-picker__popup`}
          data-scui-role="time-popup"
          role="dialog"
          aria-modal="false"
          aria-label="选择时间"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              close(true);
            }
            if (event.key === 'Tab') setOpen(false);
          }}
        >
          <TimePanel
            value={bridge.value()}
            onChange={commit}
            showSeconds={withSeconds()}
            hour12={twelve()}
            limits={limits()}
            disabled={disabled()}
          />
          <div class={`${CSS_PREFIX}time-picker__footer`}>
            <button
              type="button"
              class={`${CSS_PREFIX}time-picker__action`}
              data-scui-role="time-ok"
              onClick={() => close(true)}
            >
              {local.okLabel ?? '确定'}
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
}
