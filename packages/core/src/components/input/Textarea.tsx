/**
 * 多行输入框（T2-03，「Textarea 并入 Input」）。
 *
 * 与 `Input` 共用同一套值桥与 `data-scui-*` 口径，差异只在三件事：
 * 自动高度、字数统计、清除按钮的位置（贴在右下角，与统计同行）。
 *
 * 自动高度**只在客户端测量**：服务端没有布局，读 `scrollHeight` 会得到 0，
 * 首帧因此保持 `rows` 决定的静态高度（与 T2-01 的两阶段渲染同一口径）。
 * jsdom 下 `scrollHeight` 同样是 0，所以测量函数在取不到值时直接返回 ——
 * 否则会把内联高度写成 `0px`，反而把测试环境的样式打坏。
 */
import { createEffect, Show, splitProps } from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import { ClearIcon } from './input-icons';
import type { TextareaAutoSize, TextareaProps } from './types';
import { resolveStatus, useInputValue } from './use-input-value';

/** `true` 等价于「最少 2 行、不封顶」：单行高度会让多行输入框看起来像输入框缩水。 */
const DEFAULT_MIN_ROWS = 2;

interface ResolvedAutoSize {
  minRows: number;
  maxRows?: number;
}

function resolveAutoSize(autoSize: boolean | TextareaAutoSize | undefined) {
  if (!autoSize) return undefined;
  if (autoSize === true) return { minRows: DEFAULT_MIN_ROWS };

  return { minRows: autoSize.minRows ?? DEFAULT_MIN_ROWS, maxRows: autoSize.maxRows };
}

export function Textarea(props: TextareaProps) {
  const [local, rest] = splitProps(props, [
    'value',
    'defaultValue',
    'onChange',
    'size',
    'status',
    'autoSize',
    'showCount',
    'allowClear',
    'onClear',
    'maxLength',
    'class',
    'disabled',
    'rows',
    'onInput',
  ]);

  const bridge = useInputValue<HTMLTextAreaElement>({
    value: () => local.value,
    defaultValue: () => local.defaultValue,
    onChange: () => local.onChange,
  });

  let control: HTMLTextAreaElement | undefined;

  const size = () => local.size ?? 'medium';
  const disabled = () => Boolean(local.disabled) || (bridge.field?.disabled() ?? false);
  const invalid = () => resolveStatus(local.status, bridge.field) === 'error';
  const autoSize = (): ResolvedAutoSize | undefined => resolveAutoSize(local.autoSize);
  const showClear = () => Boolean(local.allowClear) && bridge.value().length > 0 && !disabled();
  const hasCount = () => Boolean(local.showCount);

  // 自动高度：先归零再按内容撑开，否则缩短内容时高度只增不减。
  // 上限用 maxRows × 行高换算成像素，超过后改由 textarea 内部滚动承担。
  createEffect(() => {
    const config = autoSize();
    const element = control;
    const content = bridge.value();

    if (!config || !element || content === undefined) return;
    if (!element.scrollHeight) return;

    const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);
    element.style.height = 'auto';

    if (config.maxRows && Number.isFinite(lineHeight) && lineHeight > 0) {
      element.style.maxHeight = `${config.maxRows * lineHeight}px`;
      element.style.overflowY = 'auto';
    } else {
      element.style.maxHeight = '';
      element.style.overflowY = '';
    }

    element.style.height = `${element.scrollHeight}px`;
  });

  const clear = () => {
    local.onClear?.();
    bridge.setValue('');
    control?.focus();
  };

  return (
    <span
      class={classNames(`${CSS_PREFIX}textarea`, local.class)}
      data-scui-role="textarea"
      data-scui-size={size()}
      data-scui-disabled={disabled() ? '' : undefined}
      data-scui-invalid={invalid() ? 'true' : 'false'}
      data-scui-auto-size={autoSize() ? '' : undefined}
      data-scui-count={hasCount() ? '' : undefined}
    >
      <textarea
        {...rest}
        {...(bridge.field ? bridge.field.aria() : {})}
        ref={(element) => {
          control = element;
        }}
        class={`${CSS_PREFIX}textarea__control`}
        rows={autoSize()?.minRows ?? local.rows}
        value={bridge.value()}
        disabled={disabled()}
        aria-invalid={invalid() ? 'true' : 'false'}
        onInput={(event) => {
          bridge.setValue(event.currentTarget.value, event);

          const handler = local.onInput;
          if (!handler) return;
          if (typeof handler === 'function') handler(event);
          else handler[0](handler[1], event);
        }}
      />

      <Show when={showClear() || hasCount()}>
        <span class={`${CSS_PREFIX}textarea__footer`}>
          <Show when={showClear()}>
            <button
              type="button"
              class={`${CSS_PREFIX}textarea__clear`}
              data-scui-role="textarea-clear"
              aria-label="清除"
              tabIndex={-1}
              onClick={clear}
            >
              <ClearIcon />
            </button>
          </Show>
          <Show when={hasCount()}>
            <span class={`${CSS_PREFIX}textarea__count`} data-scui-role="textarea-count">
              {bridge.value().length}
              {local.maxLength === undefined ? null : ` / ${local.maxLength}`}
            </span>
          </Show>
        </span>
      </Show>
    </span>
  );
}
