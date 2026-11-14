/**
 * 确认气泡（T3-09）。
 *
 * 分层：`primitives/anchored` 的 `PrimitivePopover` 是唯一浮层接缝，Portal /
 * 定位 / 箭头 / ESC / outside dismiss / 关闭后焦点归还触发元素全部由 Kobalte
 * 实现。本文件只有三件事：受控优先级、异步 pending 状态机、视觉属性包。
 * **不出现** `document.activeElement` / `onCloseAutoFocus` / `onEscapeKeyDown`
 * 等钩子 —— 那是锚点禁止的「第二套焦点与 ESC 语义」。
 *
 * pending 期间不自己拦 ESC，而是把 `dismissible={false}` 交给原语：原语给
 * Kobalte 的 dismiss 请求加一道 `preventDefault` 闸门，关闭出口仍只有一条。
 * 这与 `PrimitiveOverlay.dismissible` 同口径，语义一致、实现不重复。
 *
 * `data-scui-pending` 复用 T3-07 已登记的属性（「请求已发出、不能重复发」），
 * 不复用 `data-scui-loading`（后者表达「内容还在取」）。
 */
import { createSignal, splitProps, type JSX } from 'solid-js';

import { Button } from '../button';
import {
  PrimitivePopover,
  type PrimitiveAnchoredAttributes,
  type PrimitiveAnchorPlacement,
} from '../../primitives';
import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import type { PopconfirmProps } from './types';

const POPCONFIRM_PROPS = [
  'title',
  'description',
  'children',
  'okText',
  'cancelText',
  'onOk',
  'onCancel',
  'placement',
  'arrow',
  'disabled',
  'open',
  'defaultOpen',
  'onOpenChange',
  'class',
] as const;

export function Popconfirm(props: PopconfirmProps): JSX.Element {
  const [local] = splitProps(props, POPCONFIRM_PROPS);

  const [internalOpen, setInternalOpen] = createSignal(local.defaultOpen === true);
  const [asyncPending, setAsyncPending] = createSignal(false);

  const isOpen = () => local.open ?? internalOpen();
  const isPending = () => asyncPending();
  const placement = (): PrimitiveAnchorPlacement => local.placement ?? 'top';

  /** 统一关闭出口；受控时只发事件，不改内部信号（DOM 由调用方回弹）。 */
  const applyClose = (): void => {
    if (local.open === undefined) setInternalOpen(false);
    local.onOpenChange?.(false);
  };

  const requestCancel = (): void => {
    if (isPending()) return;
    applyClose();
    local.onCancel?.();
  };

  const handleOpenChange = (next: boolean): void => {
    if (!next) {
      requestCancel();
      return;
    }
    if (local.open === undefined) setInternalOpen(true);
    local.onOpenChange?.(true);
  };

  const handleOk = (): void => {
    if (isPending()) return;
    const result = local.onOk?.();
    if (result === undefined || typeof result.then !== 'function') {
      applyClose();
      return;
    }
    setAsyncPending(true);
    void result.then(
      () => {
        setAsyncPending(false);
        applyClose();
      },
      () => {
        setAsyncPending(false);
      },
    );
  };

  const contentAttributes = (): PrimitiveAnchoredAttributes => ({
    class: `${CSS_PREFIX}popconfirm`,
    'data-scui-role': 'popconfirm',
    'data-scui-anchor': placement(),
    'data-scui-pending': isPending() ? '' : undefined,
  });

  return (
    <PrimitivePopover
      open={isOpen()}
      onOpenChange={handleOpenChange}
      placement={placement()}
      arrow={local.arrow !== false}
      disabled={local.disabled}
      dismissible={!isPending()}
      title={local.title}
      description={local.description}
      trigger={local.children ?? '删除'}
      triggerAttributes={{
        class: classNames(`${CSS_PREFIX}popconfirm__trigger`, local.class),
        'data-scui-role': 'popconfirm-trigger',
      }}
      contentAttributes={contentAttributes()}
      titleAttributes={{
        class: `${CSS_PREFIX}popconfirm__title`,
        'data-scui-role': 'popconfirm-title',
      }}
      descriptionAttributes={{
        class: `${CSS_PREFIX}popconfirm__description`,
        'data-scui-role': 'popconfirm-description',
      }}
      arrowAttributes={{
        class: `${CSS_PREFIX}popconfirm__arrow`,
        'data-scui-role': 'popconfirm-arrow',
      }}
    >
      <div class={`${CSS_PREFIX}popconfirm__footer`} data-scui-role="popconfirm-footer">
        <Button variant="outline" color="neutral" disabled={isPending()} onClick={requestCancel}>
          {local.cancelText ?? '取消'}
        </Button>
        <Button loading={isPending()} onClick={handleOk}>
          {local.okText ?? '确定'}
        </Button>
      </div>
    </PrimitivePopover>
  );
}
