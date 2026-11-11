/**
 * 对话框原语（T2-01）。
 *
 * 只做三件事：把 Kobalte Dialog 收敛成组件库自己的 props 契约、把弹层的挂载
 * 推迟到 `onMount`（服务端只出触发按钮这一静态骨架）、把状态写进 `data-scui-*`。
 *
 * 不做的：任何视觉样式、`ConfigProvider` 的 `portalContainer` 解析（属上层组件）、
 * 以及把 Kobalte 的类型漏进 `.d.ts`。
 */
import { Dialog as KobalteDialog } from '@kobalte/core/dialog';
import { createMemo, Show, type JSX } from 'solid-js';

import { resolveValue } from '../utils/resolve-value';
import type { PrimitiveDialogProps } from './types';
import { useClientReady } from './use-client-ready';

export function PrimitiveDialog(props: PrimitiveDialogProps): JSX.Element {
  const ready = useClientReady();
  const trigger = createMemo(() => resolveValue(props.trigger));
  const title = createMemo(() => resolveValue(props.title));
  const closeLabel = () => props.closeLabel ?? '关闭';

  return (
    <KobalteDialog defaultOpen={props.defaultOpen} onOpenChange={props.onOpenChange}>
      <KobalteDialog.Trigger class={props.class} data-scui-primitive="dialog-trigger">
        {trigger()}
      </KobalteDialog.Trigger>
      {/* 服务端不渲染弹层：Portal 构造即访问 document，且服务端没有焦点可管。
          客户端首帧同样为空（useClientReady 此时仍为 false），挂载后才装载，避免 hydration 不一致。 */}
      <Show when={ready()}>
        <KobalteDialog.Portal>
          <KobalteDialog.Overlay data-scui-primitive="dialog-overlay" />
          <KobalteDialog.Content data-scui-primitive="dialog-content">
            <KobalteDialog.Title data-scui-primitive="dialog-title">{title()}</KobalteDialog.Title>
            <KobalteDialog.Description data-scui-primitive="dialog-body">
              {props.children}
            </KobalteDialog.Description>
            <KobalteDialog.CloseButton data-scui-primitive="dialog-close" aria-label={closeLabel()}>
              {closeLabel()}
            </KobalteDialog.CloseButton>
          </KobalteDialog.Content>
        </KobalteDialog.Portal>
      </Show>
    </KobalteDialog>
  );
}
