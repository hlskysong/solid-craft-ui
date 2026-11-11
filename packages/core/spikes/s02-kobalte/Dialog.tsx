/**
 * S-02 可行性预研：Kobalte 0.13 Dialog 封装。
 * 与 Select 共用同一套 data-* / CSS_PREFIX 约定，验证封装口径可统一。
 */
import { Dialog as KobalteDialog } from '@kobalte/core/dialog';
import { createMemo, type JSX } from 'solid-js';

import { CSS_PREFIX } from '../../src/scope';
import { classNames } from '../../src/utils/class-names';
import { resolveValue, type MaybeAccessor } from '../../src/utils/resolve-value';

export interface ScuiDialogProps {
  /** 触发按钮文案；值 / getter 均可。 */
  trigger: MaybeAccessor<string>;
  /** 对话框标题；值 / getter 均可。 */
  title: MaybeAccessor<string>;
  /** 内容区。 */
  children?: JSX.Element;
  /** 初始是否打开。 @default false */
  defaultOpen?: boolean;
  /** 打开状态变化回调。 */
  onOpenChange?: (open: boolean) => void;
}

export function ScuiDialog(props: ScuiDialogProps): JSX.Element {
  const trigger = createMemo(() => resolveValue(props.trigger));
  const title = createMemo(() => resolveValue(props.title));

  return (
    <KobalteDialog
      defaultOpen={props.defaultOpen}
      onOpenChange={props.onOpenChange}
    >
      <KobalteDialog.Trigger
        class={classNames(`${CSS_PREFIX}dialog-trigger`)}
        data-scui-role="dialog-trigger"
      >
        {trigger()}
      </KobalteDialog.Trigger>
      <KobalteDialog.Portal>
        <KobalteDialog.Overlay class={classNames(`${CSS_PREFIX}dialog-overlay`)} />
        <KobalteDialog.Content
          class={classNames(`${CSS_PREFIX}dialog-content`)}
          data-scui-role="dialog-content"
        >
          <KobalteDialog.Title>{title()}</KobalteDialog.Title>
          <KobalteDialog.Description data-scui-role="dialog-body">
            {props.children}
          </KobalteDialog.Description>
          <KobalteDialog.CloseButton data-scui-role="dialog-close">
            关闭
          </KobalteDialog.CloseButton>
        </KobalteDialog.Content>
      </KobalteDialog.Portal>
    </KobalteDialog>
  );
}
