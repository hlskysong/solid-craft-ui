/**
 * 浮层原语（T3-07）：`Modal`（T3-07）与 `Drawer`（T3-08）共用的**唯一**浮层接缝。
 *
 * Portal、遮罩、焦点陷阱、ESC / 外部点击关闭、焦点归还只在这里实现一次；
 * 上层组件只负责视觉（属性包）与业务状态机（受控 open / 异步提交）。
 *
 * 为什么不是复用 T2-01 的 `PrimitiveDialog`：那份原语强制自带 `Dialog.Trigger`、
 * 只有 `defaultOpen`，表达不了「业务侧外部按钮受控打开」的 Modal / Drawer，
 * 也没有异步关闭期间拦截 dismiss 的钩子。改它会动到 T2-01 已验收的契约，
 * 因此并列新增一份受控浮层原语，两者共用同一个 `useClientReady`。
 *
 * 焦点归还为什么必须自己做：Kobalte 的 `onCloseAutoFocus` 只 focus
 * `context.triggerRef()`，而该 ref 仅 `Dialog.Trigger` 会注册；受控打开时
 * 没有 Trigger，焦点会直接丢失（这是 T3-07 验收项「ESC 后焦点归还触发元素」
 * 的真实风险）。本原语在 `onOpenAutoFocus`（焦点移入弹层之前）记录
 * `document.activeElement`，关闭时接管默认行为并归还。
 *
 * 第三方库类型不越过 `./types`：本文件是唯一 import `@kobalte` 的浮层实现。
 */
import { Dialog as KobalteDialog } from '@kobalte/core/dialog';
import { createSignal, Show, type JSX } from 'solid-js';

import type { PrimitiveOverlayProps } from './types';
import { useClientReady } from './use-client-ready';

export function PrimitiveOverlay(props: PrimitiveOverlayProps): JSX.Element {
  const ready = useClientReady();
  const [restoreTarget, setRestoreTarget] = createSignal<HTMLElement | null>(null);

  const keyboard = () => props.keyboard !== false;
  const maskClosable = () => props.maskClosable !== false;
  const dismissible = () => props.dismissible !== false;
  const closeLabel = () => props.closeLabel ?? '关闭';

  /** 焦点即将移入弹层，此刻 `activeElement` 仍是触发元素。 */
  const onOpenAutoFocus = (event: Event): void => {
    if (typeof document !== 'undefined') {
      const active = document.activeElement;
      if (active instanceof HTMLElement) setRestoreTarget(active);
    }
    props.onOpenAutoFocus?.(event);
  };

  /** 接管 Kobalte 的默认归还：它只会 focus triggerRef，受控打开时为空。 */
  const onCloseAutoFocus = (event: Event): void => {
    event.preventDefault();
    const target = restoreTarget();
    if (target?.isConnected === true) target.focus();
    setRestoreTarget(null);
    props.onCloseAutoFocus?.(event);
  };

  /**
   * `dismissible=false`（异步提交中）是运行时拦截，`keyboard` / `maskClosable`
   * 是静态配置，两者正交：只用一个总开关会让「禁 ESC 但允许点遮罩」这类
   * 常规配置无法实现。
   */
  const onEscapeKeyDown = (event: KeyboardEvent): void => {
    if (!dismissible() || !keyboard()) event.preventDefault();
  };
  /**
   * Kobalte 的 outside dismiss 与下面的遮罩 handler 会形成两个关闭出口
   * （可能连发两次 onOpenChange(false)），因此一律挡掉，外部点击只保留
   * `onMaskPointerDown` 这一个出口。
   */
  const blockOutside = (event: Event): void => {
    event.preventDefault();
  };
  /**
   * 遮罩点击：Kobalte 的 modal 模式给 body 设了 `pointer-events: none`，
   * 且 `DialogOverlay` 自己的 onPointerDown 只做 preventDefault（防焦点转移），
   * **不会**触发 dismiss —— 实测点遮罩完全不关闭。官方给的 onPointerDown
   * 钩子在这里显式发一次关闭请求，走上层同一个受控 onOpenChange，
   * `maskClosable=false` 与异步 pending 都在这一个条件里拦住。
   *
   * 不判 `event.target === event.currentTarget`：Solid 的 `on*` 走事件委托，
   * 委托 handler 里的 currentTarget 不是遮罩节点，这个判断会永远 return
   * （jsdom 直接派发时恰好成立，造成「单测绿 / 浏览器红」）。
   * 内容不会误触这里的必要条件：Kobalte modal 给 body 设 `pointer-events:none`、
   * 只给 Overlay 设 `auto`，因此 Modal / Drawer 的 Content **必须**在自己的
   * SCSS 里显式写 `pointer-events: auto`；否则内容区点击会穿到遮罩并关闭浮层。
   */
  const onMaskPointerDown = (): void => {
    if (!dismissible() || !maskClosable()) return;
    props.onOpenChange?.(false);
  };

  return (
    <KobalteDialog open={props.open} onOpenChange={props.onOpenChange} modal>
      {/* 服务端与客户端首帧都不挂 Portal：`ready` 由 useClientReady 统一裁决，
          避免 hydration mismatch；打开态再由 Kobalte 自己的 Presence 控制。 */}
      <Show when={ready()}>
        <KobalteDialog.Portal>
          <KobalteDialog.Overlay {...props.overlayAttributes} onPointerDown={onMaskPointerDown} />
          <KobalteDialog.Content
            {...props.contentAttributes}
            onOpenAutoFocus={onOpenAutoFocus}
            onCloseAutoFocus={onCloseAutoFocus}
            onEscapeKeyDown={onEscapeKeyDown}
            onPointerDownOutside={blockOutside}
            onInteractOutside={blockOutside}
          >
            <KobalteDialog.Title {...props.titleAttributes}>{props.title}</KobalteDialog.Title>
            <div {...props.bodyAttributes}>{props.children}</div>
            <Show when={props.footer}>
              <div {...props.footerAttributes}>{props.footer}</div>
            </Show>
            <Show when={props.closable !== false}>
              <KobalteDialog.CloseButton
                {...props.closeAttributes}
                disabled={!dismissible()}
                aria-label={closeLabel()}
              >
                <span aria-hidden="true">×</span>
              </KobalteDialog.CloseButton>
            </Show>
          </KobalteDialog.Content>
        </KobalteDialog.Portal>
      </Show>
    </KobalteDialog>
  );
}
