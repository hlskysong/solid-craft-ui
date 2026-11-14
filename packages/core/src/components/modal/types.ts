/**
 * `Modal` 的公共类型（T3-07，§4.2 与 `docs/04 §2.4`）。
 *
 * 组件层只表达「业务语义」：受控打开、异步确认、尺寸、文案；
 * Portal / 遮罩 / 焦点陷阱 / ESC 一律交给 `primitives/overlay`，
 * 第三方无头库的类型与 props 形态不越过原语层。
 *
 * R3：函数型 prop（`onOk` / `onCancel` / `onOpenChange`）一律直接声明为函数，
 * 不用 `MaybeAccessor` 包裹 —— 包裹后调用方写一个 getter 会变成「状态读取」
 * 而不是「回调」，语义会反过来。
 */
import type { JSX } from 'solid-js';

/** 三档宽度档位，与 Button / Pagination 的 `Size` 口径一致。 */
export type ModalSize = 'small' | 'medium' | 'large';

/** 关闭来源，`onCancel` 只覆盖用户主动取消；`ok` 由 `onOk` 成功后触发。 */
export type ModalCloseReason = 'ok' | 'cancel';

export interface ModalProps {
  /** 受控打开状态；给了就完全由调用方驱动，组件内部不回写。 */
  open?: boolean;
  /** 非受控初始状态。 @default false */
  defaultOpen?: boolean;
  /** 打开状态变化出口；任何关闭路径都会发，请求打开不会（无内置触发按钮）。 */
  onOpenChange?: (open: boolean) => void;
  /** 标题；渲染进 `Dialog.Title`，是 `aria-labelledby` 的来源。 */
  title: JSX.Element;
  /** 正文。 */
  children?: JSX.Element;
  /**
   * 底部操作区。传 `null` 表示整块不渲染（不留空盒子）；
   * 不传则渲染默认的「取消 / 确定」两个按钮。
   * @default undefined
   */
  footer?: JSX.Element | null;
  /** 默认确定按钮文案。 @default '确定' */
  okText?: string;
  /** 默认取消按钮文案。 @default '取消' */
  cancelText?: string;
  /**
   * 确认回调。返回 Promise 时进入异步关闭状态机：期间禁用确认按钮、
   * 拦截 ESC / 遮罩 / 关闭按钮 / 取消，resolve 后才关闭，reject 则保持打开。
   */
  onOk?: () => void | Promise<void>;
  /** 取消 / ESC / 遮罩 / 关闭按钮触发；异步提交期间不会触发。 */
  onCancel?: () => void;
  /**
   * 外部控制的确认加载态（表单提交由父组件发起时用）。
   * 与 `onOk` 返回 Promise 触发的内部 pending 取或。
   * @default false
   */
  confirmLoading?: boolean;
  /** 三档宽度。 @default 'medium' */
  size?: ModalSize;
  /** 显式宽度，覆盖 `size`；数字按 px 处理。 @default undefined */
  width?: number | string;
  /** 是否显示右上角关闭按钮。 @default true */
  closable?: boolean;
  /** 是否允许 ESC 关闭。 @default true */
  keyboard?: boolean;
  /** 是否允许点击遮罩关闭。 @default true */
  maskClosable?: boolean;
  /** 右上角关闭按钮的无障碍文案。 @default '关闭' */
  closeLabel?: string;
  /** 内容容器自定义类名。 @default undefined */
  class?: string;
}
