/**
 * 详情页键值展示（T3-11）。
 *
 * 一张 `<dl>` 承载所有键值：每个 item 用 `<div>` 分组 `<dt>` + `<dd>`，这是
 * HTML5 合法的 dl 结构，读屏器会读出「字段名 → 值」而不是虚假的表格行列。
 *
 * 列数与跨列走两层：根节点恒输出 `data-scui-column`（1 / 2 / 3），item 恒输出
 * `data-scui-span`（默认 1），SCSS 由它们派生两个 CSS 变量给 grid 用。恒输出
 * 而不是「存在即真」，是为了让 SSR 与客户端首帧的属性完全一致。
 *
 * 表头与 Card 同口径：`title` / `extra` 都为 undefined 时整块缺席，不留空盒子。
 * `bordered` 复用 Table / Tag 已登记的「存在即真」属性。
 */
import { For, Show, splitProps, type JSX } from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import type { DescriptionsColumn, DescriptionsProps } from './types';

const DESCRIPTIONS_PROPS = ['items', 'title', 'extra', 'column', 'bordered', 'class'] as const;

export function Descriptions(props: DescriptionsProps): JSX.Element {
  const [local, rest] = splitProps(props, DESCRIPTIONS_PROPS);
  const column = (): DescriptionsColumn => local.column ?? 2;
  const hasHeader = (): boolean => local.title !== undefined || local.extra !== undefined;

  return (
    <div
      {...rest}
      class={classNames(`${CSS_PREFIX}descriptions`, local.class)}
      data-scui-role="descriptions"
      data-scui-column={column()}
      data-scui-bordered={local.bordered === true ? '' : undefined}
    >
      <Show when={hasHeader()}>
        <div class={`${CSS_PREFIX}descriptions__header`} data-scui-role="descriptions-header">
          <Show when={local.title !== undefined}>
            <div class={`${CSS_PREFIX}descriptions__title`} data-scui-role="descriptions-title">
              {local.title}
            </div>
          </Show>
          <Show when={local.extra !== undefined}>
            <div class={`${CSS_PREFIX}descriptions__extra`} data-scui-role="descriptions-extra">
              {local.extra}
            </div>
          </Show>
        </div>
      </Show>
      <dl class={`${CSS_PREFIX}descriptions__list`} data-scui-role="descriptions-list">
        <For each={local.items}>
          {(item) => (
            <div
              class={`${CSS_PREFIX}descriptions__item`}
              data-scui-role="descriptions-item"
              data-scui-span={item.span ?? 1}
            >
              <dt class={`${CSS_PREFIX}descriptions__label`} data-scui-role="descriptions-label">
                {item.label}
              </dt>
              <dd
                class={`${CSS_PREFIX}descriptions__content`}
                data-scui-role="descriptions-content"
              >
                {item.children}
              </dd>
            </div>
          )}
        </For>
      </dl>
    </div>
  );
}
