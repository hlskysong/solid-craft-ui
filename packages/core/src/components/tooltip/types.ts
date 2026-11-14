/**
 * `Tooltip` 的公共类型（T3-09，§4.2「定位 / 延迟 / 箭头」）。
 *
 * 方向值直接复用原语层的 `PrimitiveAnchorPlacement`（12 向，与 Floating UI
 * 同形），但对外只暴露 `TooltipPlacement` 别名 —— 公共 API 不出现
 * `primitives` 命名空间，也不越出任何第三方类型。
 *
 * 刻意新增 `data-scui-anchor`，不复用 `data-scui-placement`（App / Message
 * 的反馈容器六向位置）或 `data-scui-side`（Drawer 贴视口四边）：这里的语义是
 * 「浮层挂在触发元素哪一侧」，一个属性名只表达一个语义（R1）。
 *
 * R3：函数型 prop（`onOpenChange`）直接声明为函数，不用 `MaybeAccessor` 包裹。
 */
import type { JSX } from 'solid-js';

import type { PrimitiveAnchorPlacement } from '../../primitives';

/** 锚定方向，默认 `top`。 */
export type TooltipPlacement = PrimitiveAnchorPlacement;

export interface TooltipProps {
  /** 提示内容，渲染进 `role="tooltip"` 的浮层。 */
  content: JSX.Element;
  /** 触发元素内容；原语负责包成按钮并接管 hover / focus 时序与键盘。 */
  children: JSX.Element;
  /** 锚定方向，恒输出为 `data-scui-anchor`。 @default 'top' */
  placement?: TooltipPlacement;
  /** 指针进入触发元素到打开的时间（ms）。 @default 200 */
  openDelay?: number;
  /** 指针离开到关闭的时间（ms）。 @default 100 */
  closeDelay?: number;
  /** 是否渲染箭头。 @default true */
  arrow?: boolean;
  /** 是否禁用触发（禁用后不响应 hover / focus）。 @default false */
  disabled?: boolean;
  /** 受控打开状态；给了就完全由调用方驱动。 @default undefined */
  open?: boolean;
  /** 非受控初始状态。 @default false */
  defaultOpen?: boolean;
  /** 打开状态变化出口；hover / focus / ESC 都汇到这一条。 */
  onOpenChange?: (open: boolean) => void;
  /** 触发按钮自定义类名。 @default undefined */
  class?: string;
}
