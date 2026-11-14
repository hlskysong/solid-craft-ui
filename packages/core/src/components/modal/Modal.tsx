/**
 * 模态对话框（T3-07）。
 *
 * 分层：`primitives/overlay` 是唯一的浮层接缝（Portal / 遮罩 / 焦点陷阱 /
 * ESC / 焦点归还），本文件只负责业务状态机与视觉属性包。T3-08 的 `Drawer`
 * 复用同一个原语，不重复实现浮层行为。
 *
 * 状态单点：`open > defaultOpen > 内部信号`，与 Select / Table / Pagination
 * 同一受控口径。无论受控与否，**传给原语的永远是受控值**，这样 Kobalte 的
 * `onOpenChange(false)` 只是一次「关闭请求」，异步提交期间可以直接吞掉，
 * 不必和它内部状态抢方向盘。
 *
 * 异步关闭：`onOk` 返回 Promise 时进入 pending，期间确认按钮 loading、
 * ESC / 遮罩 / 关闭按钮 / 取消全部失效，resolve 后才关闭；`pending()` 早退
 * 同时挡住重复点击（防重复提交）。reject 保持打开，由业务侧自行提示。
 *
 * SSR：弹层只在 `useClientReady()` 为真（客户端 onMount 后）挂载，服务端
 * 输出为空，由调用方自己的触发按钮承担静态骨架。
 */
import { createSignal, splitProps, type JSX } from 'solid-js';

import { PrimitiveOverlay, type PrimitiveOverlayAttributes } from '../../primitives';
import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import { Button } from '../button';
import type { ModalProps } from './types';

const MODAL_PROPS = [
  'open',
  'defaultOpen',
  'onOpenChange',
  'title',
  'children',
  'footer',
  'okText',
  'cancelText',
  'onOk',
  'onCancel',
  'confirmLoading',
  'size',
  'width',
  'closable',
  'keyboard',
  'maskClosable',
  'closeLabel',
  'class',
] as const;

export function Modal(props: ModalProps): JSX.Element {
  const [local] = splitProps(props, MODAL_PROPS);

  const [internalOpen, setInternalOpen] = createSignal(local.defaultOpen === true);
  const [asyncPending, setAsyncPending] = createSignal(false);

  const isOpen = () => local.open ?? internalOpen();
  const isPending = () => local.confirmLoading === true || asyncPending();

  /** 统一关闭出口；受控时只发事件，不改内部信号（DOM 由调用方回弹）。 */
  const applyClose = (): void => {
    if (local.open === undefined) setInternalOpen(false);
    local.onOpenChange?.(false);
  };

  const requestCancel = (): void => {
    if (isPending()) return;
    local.onCancel?.();
    applyClose();
  };

  /** 确认：同步回调直接关，异步回调进 pending，resolve 后才关。 */
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
        // reject 时保持打开：业务侧通常已经在 onOk 里给出错误反馈
        setAsyncPending(false);
      },
    );
  };

  /** Kobalte 的 onOpenChange(false) 只代表「用户想关」，不是既成事实。 */
  const handleOpenChange = (next: boolean): void => {
    if (next) return;
    requestCancel();
  };

  const footer = (): JSX.Element | null => {
    if (local.footer === null) return null;
    if (local.footer !== undefined) return local.footer;
    return (
      <>
        <Button variant="outline" color="neutral" disabled={isPending()} onClick={requestCancel}>
          {local.cancelText ?? '取消'}
        </Button>
        <Button loading={isPending()} onClick={handleOk}>
          {local.okText ?? '确定'}
        </Button>
      </>
    );
  };

  /** 显式 width 走内联自定义属性，优先级高于三档 size 的类规则。 */
  const contentStyle = (): string | undefined => {
    const width = local.width;
    if (width === undefined) return undefined;
    return `--scui-modal-width: ${typeof width === 'number' ? `${width}px` : width};`;
  };

  const contentAttributes = (): PrimitiveOverlayAttributes => ({
    class: classNames(`${CSS_PREFIX}modal`, local.class),
    style: contentStyle(),
    'data-scui-role': 'modal',
    'data-scui-size': local.size ?? 'medium',
    'data-scui-pending': isPending() ? '' : undefined,
  });

  return (
    <PrimitiveOverlay
      open={isOpen()}
      onOpenChange={handleOpenChange}
      title={local.title}
      footer={footer()}
      closeLabel={local.closeLabel ?? '关闭'}
      closable={local.closable !== false}
      keyboard={local.keyboard !== false}
      maskClosable={local.maskClosable !== false}
      dismissible={!isPending()}
      overlayAttributes={{
        class: `${CSS_PREFIX}modal__overlay`,
        'data-scui-role': 'modal-overlay',
      }}
      contentAttributes={contentAttributes()}
      titleAttributes={{
        class: `${CSS_PREFIX}modal__title`,
        'data-scui-role': 'modal-title',
      }}
      bodyAttributes={{
        class: `${CSS_PREFIX}modal__body`,
        'data-scui-role': 'modal-body',
      }}
      footerAttributes={{
        class: `${CSS_PREFIX}modal__footer`,
        'data-scui-role': 'modal-footer',
      }}
      closeAttributes={{
        class: `${CSS_PREFIX}modal__close`,
        'data-scui-role': 'modal-close',
      }}
    >
      {local.children}
    </PrimitiveOverlay>
  );
}
