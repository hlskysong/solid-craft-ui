/**
 * 标签（T3-10）。
 *
 * 一个 `<span>` 加一段文案，尾部可选一个关闭按钮。状态走四个既有语义：
 * `data-scui-color`（配色，恒输出）、`data-scui-variant`（形态，恒输出，与
 * Skeleton / Tabs 同义）、`data-scui-bordered`（存在即真），以及
 * `data-scui-role="tag-close"` 这个结构锚点 —— 可关闭**不需要**新的状态属性，
 * 按钮在不在 DOM 里本身就是状态。
 *
 * 关闭是**非受控**的：组件自己移除 DOM 并发一次 `onClose`。与 Alert 同口径，
 * 「是否渲染」的真源在调用方，再加一层 `visible` 受控只会让已关掉的 Tag 继续
 * 占着组件树。关闭按钮恒带 `aria-label`，图标 `aria-hidden="true"`，避免 axe 的
 * button-name / 对比度违规。
 *
 * 根节点用 `<span>` 而非 `<div>`：标签是行内语义，可以直接嵌在表格单元格与段落里。
 */
import { createSignal, Show, splitProps, type JSX } from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import type { TagColor, TagProps, TagVariant } from './types';

const TAG_PROPS = [
  'color',
  'variant',
  'bordered',
  'closable',
  'closeLabel',
  'onClose',
  'children',
  'class',
] as const;

function CloseIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true">
      <path d="m4 4 8 8m0-8-8 8" stroke="currentcolor" stroke-width="1.6" stroke-linecap="round" />
    </svg>
  );
}

export function Tag(props: TagProps): JSX.Element {
  const [local, rest] = splitProps(props, TAG_PROPS);
  const [visible, setVisible] = createSignal(true);

  const color = (): TagColor => local.color ?? 'neutral';
  const variant = (): TagVariant => local.variant ?? 'dark';

  const close = (): void => {
    if (!visible()) return;
    setVisible(false);
    local.onClose?.();
  };

  return (
    <Show when={visible()}>
      <span
        {...rest}
        class={classNames(`${CSS_PREFIX}tag`, local.class)}
        data-scui-role="tag"
        data-scui-color={color()}
        data-scui-variant={variant()}
        data-scui-bordered={local.bordered === true ? '' : undefined}
      >
        <span class={`${CSS_PREFIX}tag__content`} data-scui-role="tag-content">
          {local.children}
        </span>
        <Show when={local.closable === true}>
          <button
            type="button"
            class={`${CSS_PREFIX}tag__close`}
            data-scui-role="tag-close"
            aria-label={local.closeLabel ?? '关闭标签'}
            onClick={close}
          >
            <CloseIcon />
          </button>
        </Show>
      </span>
    </Show>
  );
}
