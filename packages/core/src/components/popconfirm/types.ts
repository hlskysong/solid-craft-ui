/**
 * `Popconfirm` 的公共类型（T3-09，§4.2「确认气泡、异步」）。
 *
 * 方向复用 `PrimitiveAnchorPlacement`，对外以 `PopconfirmPlacement` 暴露；
 * 与 Tooltip 共用同一个 `data-scui-anchor` 属性（同一语义，不多起别名）。
 *
 * 异步协议与 `Modal` **完全同形**：`onOk` 返回 Promise 期间进入
 * `data-scui-pending`，确认按钮 loading、取消按钮 disabled、ESC / 外部交互
 * 被原语闸门拦截；resolve 后关闭、reject 保持打开，`isPending()` 早退防重复提交。
 * 不引入 `confirmLoading` 受控态：气泡上下文比对话框短，调用方直接返回
 * Promise 即可，多一层受控开关只会制造两个真源。
 *
 * R3：函数型 prop（`onOk` / `onCancel` / `onOpenChange`）直接声明为函数。
 */
import type { JSX } from 'solid-js';

import type { PrimitiveAnchorPlacement } from '../../primitives';

/** 锚定方向，默认 `top`。 */
export type PopconfirmPlacement = PrimitiveAnchorPlacement;

export interface PopconfirmProps {
  /** 确认标题，渲染进 `Popover.Title`，是 `aria-labelledby` 的来源。 */
  title: JSX.Element;
  /** 补充说明，渲染进 `Popover.Description`。 */
  description?: JSX.Element;
  /** 触发按钮内容。 @default '删除' */
  children?: JSX.Element;
  /** 确认按钮文案。 @default '确定' */
  okText?: string;
  /** 取消按钮文案。 @default '取消' */
  cancelText?: string;
  /** 确认回调；返回 Promise 时进入 pending，resolve 才关闭，reject 保持打开。 */
  onOk?: () => void | Promise<void>;
  /** 取消 / ESC / 点击外部时触发。 */
  onCancel?: () => void;
  /** 锚定方向，恒输出为 `data-scui-anchor`。 @default 'top' */
  placement?: PopconfirmPlacement;
  /** 是否渲染箭头。 @default true */
  arrow?: boolean;
  /** 是否禁用触发按钮。 @default false */
  disabled?: boolean;
  /** 受控打开状态；给了就完全由调用方驱动。 @default undefined */
  open?: boolean;
  /** 非受控初始状态。 @default false */
  defaultOpen?: boolean;
  /** 打开状态变化出口；点击触发 / 确认 / 取消 / ESC 都汇到这一条。 */
  onOpenChange?: (open: boolean) => void;
  /** 触发按钮自定义类名。 @default undefined */
  class?: string;
}
