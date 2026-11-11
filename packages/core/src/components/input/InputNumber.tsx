/**
 * 数字输入框（T2-04）。
 *
 * 结构复用 `Input` 的壳（`.scui-input` + `--scui-input-*` 变量）：尺寸、边框、
 * 焦点环、禁用与校验态只维护一份，`InputNumber` 额外挂 `__controls` 与 `__step`。
 *
 * 值语义见 `use-number-value.ts` 的三条不变式。这里只补两处 DOM 层的约定：
 *  - 控件是 `type="text"` + `inputMode="decimal"`，不是 `type="number"` ——
 *    原生数字框会吞掉 `'1.'` 这类中间态、在部分浏览器上滚轮误触改值，
 *    且无法展示千分位（`value` 必须是裸数字）。
 *  - **不加 `role="spinbutton"`**：ARIA 要求 spinbutton 恒有 `aria-valuenow`，
 *    而本组件允许空值（清空是合法操作）。把空值映射成 `0` 会让屏幕阅读器
 *    读出一个用户并没有填的数字 —— 宁可保留普通文本框语义，让键盘步进
 *    作为增强能力存在，可访问名称由使用方通过 `aria-label` / `<label>` 提供
 *    （与 `Input` 同一约定，见 `docs/08 §30.19`）。
 */
import { Show, splitProps } from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import { StepDownIcon, StepUpIcon } from './input-icons';
import { resolvePrecision } from './number-math';
import type { InputNumberProps } from './types';
import { resolveStatus } from './use-input-value';
import { useNumberValue } from './use-number-value';

export function InputNumber(props: InputNumberProps) {
  const [local, rest] = splitProps(props, [
    'value',
    'defaultValue',
    'onChange',
    'size',
    'status',
    'step',
    'precision',
    'min',
    'max',
    'thousands',
    'controls',
    'prefix',
    'suffix',
    'class',
    'disabled',
    'onInput',
    'onKeyDown',
    'onBlur',
  ]);

  const step = () => (local.step === undefined ? 1 : local.step);
  const precision = () => resolvePrecision(local.precision, step());

  const bridge = useNumberValue({
    value: () => local.value,
    defaultValue: () => local.defaultValue,
    onChange: () => local.onChange,
    precision,
    step,
    min: () => local.min,
    max: () => local.max,
    thousands: () => Boolean(local.thousands),
  });

  const disabled = () => Boolean(local.disabled) || (bridge.field?.disabled() ?? false);
  const invalid = () => resolveStatus(local.status, bridge.field) === 'error';

  // 到界时按钮置灰而不是「点了没反应」：后者会让用户以为组件坏了。
  const atMax = () => local.max !== undefined && (bridge.value() ?? 0) >= local.max;
  const atMin = () => local.min !== undefined && (bridge.value() ?? 0) <= local.min;
  const showControls = () => (local.controls ?? true) && !disabled();

  return (
    <span
      class={classNames(`${CSS_PREFIX}input`, `${CSS_PREFIX}input-number`, local.class)}
      data-scui-role="input-number"
      data-scui-size={local.size ?? 'medium'}
      data-scui-disabled={disabled() ? '' : undefined}
      data-scui-invalid={invalid() ? 'true' : 'false'}
    >
      <Show when={local.prefix}>
        <span class={`${CSS_PREFIX}input__prefix`}>{local.prefix}</span>
      </Show>

      <input
        {...rest}
        {...(bridge.field ? bridge.field.aria() : {})}
        class={`${CSS_PREFIX}input__control`}
        type="text"
        inputMode="decimal"
        autocomplete="off"
        value={bridge.text()}
        disabled={disabled()}
        aria-invalid={invalid() ? 'true' : 'false'}
        onInput={(event) => {
          bridge.input(event.currentTarget.value, event);

          const handler = local.onInput;
          if (!handler) return;
          if (typeof handler === 'function') handler(event);
          else handler[0](handler[1], event);
        }}
        onBlur={(event) => {
          bridge.blur();

          const handler = local.onBlur;
          if (!handler) return;
          if (typeof handler === 'function') handler(event);
          else handler[0](handler[1], event);
        }}
        onKeyDown={(event) => {
          const handler = local.onKeyDown;
          if (handler) {
            if (typeof handler === 'function') handler(event);
            else handler[0](handler[1], event);
          }

          if (event.defaultPrevented || event.isComposing) return;

          if (event.key === 'ArrowUp') {
            event.preventDefault();
            bridge.nudge(1);
            return;
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            bridge.nudge(-1);
            return;
          }
          // 回车 = 确认：把草稿归一化，等价于失焦，但不会真的移走焦点。
          if (event.key === 'Enter') {
            event.preventDefault();
            bridge.blur();
          }
        }}
      />

      <Show when={local.suffix}>
        <span class={`${CSS_PREFIX}input__suffix`}>{local.suffix}</span>
      </Show>

      <Show when={showControls()}>
        <span class={`${CSS_PREFIX}input-number__controls`}>
          <button
            type="button"
            class={`${CSS_PREFIX}input-number__step`}
            data-scui-role="input-number-up"
            data-scui-disabled={atMax() ? '' : undefined}
            aria-label="增加"
            tabIndex={-1}
            disabled={atMax()}
            onMouseDown={(event) => {
              // 阻止焦点转移到按钮：抢焦点会先触发控件的 blur 归一化，
              // 再点一次就变成「基于归一化后的值再步进」，两次操作叠在一起。
              event.preventDefault();
            }}
            onClick={() => bridge.nudge(1)}
          >
            <StepUpIcon />
          </button>
          <button
            type="button"
            class={`${CSS_PREFIX}input-number__step`}
            data-scui-role="input-number-down"
            data-scui-disabled={atMin() ? '' : undefined}
            aria-label="减少"
            tabIndex={-1}
            disabled={atMin()}
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onClick={() => bridge.nudge(-1)}
          >
            <StepDownIcon />
          </button>
        </span>
      </Show>
    </span>
  );
}
