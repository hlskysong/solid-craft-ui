/**
 * 标签页（T3-11）。
 *
 * 分工严格按 `docs/02 L563`：`tablist` / `tab` / `tabpanel`、方向键 / Home / End、
 * roving tabindex、`aria-selected` / `aria-controls` 全部由 Kobalte Tabs 原语输出，
 * 本文件**一行键盘与焦点逻辑都不写**。组件层只负责四件事：受控值优先级、
 * 样式变体、懒加载开关、以及把状态落成 `data-scui-*`。
 *
 * 不新建 `primitives/tabs.tsx`：`PrimitiveSelect` 存在是因为 R2 的
 * string ↔ option 对象映射，`PrimitiveOverlay` / `anchored` 存在是因为多个组件
 * 要共用焦点归还与遮罩出口；Tabs 只有本组件消费、value 本来就是字符串，
 * 多包一层只会把「零重复实现」拆成两份真源。
 *
 * 激活态刻意复用 `data-scui-current`（与 Pagination 的「当前位于」同义），
 * 和 Kobalte 的 `aria-selected` 形成双通道；不碰已被 Skeleton 占用的 `-active`
 * 与「列表项被选中」的 `-selected`。
 */
import { Tabs as KobalteTabs } from '@kobalte/core/tabs';
import { For, createSignal, splitProps, type JSX } from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import type { TabsProps, TabsVariant } from './types';

const TABS_PROPS = [
  'items',
  'value',
  'defaultValue',
  'onChange',
  'variant',
  'lazy',
  'aria-label',
  'class',
] as const;

export function Tabs(props: TabsProps): JSX.Element {
  const [local, rest] = splitProps(props, TABS_PROPS);
  const [internal, setInternal] = createSignal<string | undefined>(undefined);

  const firstKey = (): string => local.items[0]?.key ?? '';
  const current = (): string => local.value ?? internal() ?? local.defaultValue ?? firstKey();
  const variant = (): TabsVariant => local.variant ?? 'line';
  const lazy = (): boolean => local.lazy !== false;

  const handleChange = (key: string): void => {
    // 受控时只通知、不写内部状态；DOM 由调用方把新 value 回弹进来。
    if (local.value === undefined) setInternal(key);
    local.onChange?.(key);
  };

  return (
    <div
      {...rest}
      class={classNames(`${CSS_PREFIX}tabs`, local.class)}
      data-scui-role="tabs"
      data-scui-variant={variant()}
    >
      <KobalteTabs value={current()} onChange={handleChange} activationMode="automatic">
        <KobalteTabs.List
          class={`${CSS_PREFIX}tabs__list`}
          data-scui-role="tabs-list"
          aria-label={local['aria-label'] ?? '标签页'}
        >
          <For each={local.items}>
            {(item) => (
              <KobalteTabs.Trigger
                value={item.key}
                disabled={item.disabled === true}
                class={`${CSS_PREFIX}tabs__tab`}
                data-scui-role="tabs-tab"
                data-scui-current={item.key === current() ? '' : undefined}
                data-scui-disabled={item.disabled === true ? '' : undefined}
              >
                {item.label}
              </KobalteTabs.Trigger>
            )}
          </For>
        </KobalteTabs.List>
        <For each={local.items}>
          {(item) => (
            <KobalteTabs.Content
              value={item.key}
              forceMount={!lazy()}
              hidden={!lazy() && item.key !== current()}
              class={`${CSS_PREFIX}tabs__panel`}
              data-scui-role="tabs-panel"
              data-scui-current={item.key === current() ? '' : undefined}
            >
              {item.content?.()}
            </KobalteTabs.Content>
          )}
        </For>
      </KobalteTabs>
    </div>
  );
}
