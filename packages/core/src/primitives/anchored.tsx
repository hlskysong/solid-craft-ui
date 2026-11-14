/**
 * 锚定浮层原语（T3-09）。
 *
 * 这是 `Tooltip` / `Popconfirm` 的**唯一**浮层接缝，与 `primitives/overlay`
 * 分工明确：
 *  - `overlay` 是**模态**浮层，受控打开时没有 Trigger，所以必须自己记录
 *    `document.activeElement` 并在 `onCloseAutoFocus` 里归还焦点；
 *  - `anchored` 是**锚定**浮层，一定有 Trigger，Kobalte 的 DismissableLayer
 *    与 ButtonRoot 自带「ESC / outside dismiss + 关闭后焦点归还触发元素」。
 *
 * 因此本文件**刻意不写**任何 `onOpenAutoFocus` / `onCloseAutoFocus` /
 * `document.activeElement`：那会在 Kobalte 之外再实现第二套焦点语义，正是
 * `docs/08` 锚点「不得重复实现焦点归还与 ESC 契约」禁止的事。两条浮层链
 * 的**语义**一致（关闭后焦点回到触发元素），**实现**各归其主、零重复。
 *
 * `dismissible={false}` 只是给 Kobalte 的 dismiss 请求加一道 `preventDefault`
 * 闸门（与 `overlay` 的运行时拦截同口径），不是新的关闭出口。
 *
 * SSR：与 `select` / `overlay` 一致，Portal 只在 `useClientReady()` 为真
 * （客户端 onMount 后）装载，服务端与首帧都只输出 Trigger 静态骨架。
 * Kobalte 的 Portal 在服务端虽是空操作，但门控能保证 hydration 确定性。
 */
import { Popover as KobaltePopover } from '@kobalte/core/popover';
import { Tooltip as KobalteTooltip } from '@kobalte/core/tooltip';
import { Show, type JSX } from 'solid-js';

import type { PrimitivePopoverProps, PrimitiveTooltipProps } from './types';
import { useClientReady } from './use-client-ready';

/** 只做「阻止」：Kobalte 仍是唯一的 dismiss 实现者。 */
type DismissEvent = { preventDefault: () => void };

export function PrimitiveTooltip(props: PrimitiveTooltipProps): JSX.Element {
  const ready = useClientReady();

  return (
    <KobalteTooltip
      open={props.open}
      defaultOpen={props.defaultOpen}
      onOpenChange={props.onOpenChange}
      openDelay={props.openDelay ?? 200}
      closeDelay={props.closeDelay ?? 100}
      placement={props.placement ?? 'top'}
      gutter={props.gutter ?? 8}
      disabled={props.disabled}
    >
      <KobalteTooltip.Trigger {...props.triggerAttributes} disabled={props.disabled}>
        {props.trigger}
      </KobalteTooltip.Trigger>
      <Show when={ready()}>
        <KobalteTooltip.Portal>
          <KobalteTooltip.Content {...props.contentAttributes}>
            {props.children}
            <Show when={props.arrow !== false}>
              <KobalteTooltip.Arrow {...props.arrowAttributes} size={10} />
            </Show>
          </KobalteTooltip.Content>
        </KobalteTooltip.Portal>
      </Show>
    </KobalteTooltip>
  );
}

export function PrimitivePopover(props: PrimitivePopoverProps): JSX.Element {
  const ready = useClientReady();

  const blockDismiss = (event: DismissEvent): void => {
    if (props.dismissible !== false) return;
    event.preventDefault();
  };

  return (
    <KobaltePopover
      open={props.open}
      defaultOpen={props.defaultOpen}
      onOpenChange={props.onOpenChange}
      placement={props.placement ?? 'top'}
      gutter={props.gutter ?? 8}
    >
      <KobaltePopover.Trigger {...props.triggerAttributes} disabled={props.disabled}>
        {props.trigger}
      </KobaltePopover.Trigger>
      <Show when={ready()}>
        <KobaltePopover.Portal>
          <KobaltePopover.Content
            {...props.contentAttributes}
            onEscapeKeyDown={blockDismiss}
            onPointerDownOutside={blockDismiss}
            onInteractOutside={blockDismiss}
            onFocusOutside={blockDismiss}
          >
            <KobaltePopover.Title {...props.titleAttributes}>{props.title}</KobaltePopover.Title>
            <Show when={props.description !== undefined}>
              <KobaltePopover.Description {...props.descriptionAttributes}>
                {props.description}
              </KobaltePopover.Description>
            </Show>
            {props.children}
            <Show when={props.arrow !== false}>
              <KobaltePopover.Arrow {...props.arrowAttributes} size={10} />
            </Show>
          </KobaltePopover.Content>
        </KobaltePopover.Portal>
      </Show>
    </KobaltePopover>
  );
}
