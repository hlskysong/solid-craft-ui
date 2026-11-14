/**
 * `Drawer` 的公共类型（T3-08，§4.2 与 `docs/04 §2.4`）。
 *
 * 与 `Modal` 同口径：组件层只表达业务语义（受控打开 / 方向 / 尺寸 / 文案），
 * Portal / 遮罩 / 焦点陷阱 / ESC / 焦点归还全部交给 `primitives/overlay`，
 * 第三方无头库的类型与 props 形态不越过原语层。
 *
 * 方向刻意新增 `data-scui-side`，不复用既有属性：`data-scui-placement` 已被
 * App / Message 的「反馈容器出现位置」占用（六向值）、`data-scui-fixed` 是
 * Table 的固定列方向、`data-scui-direction` 表示书写方向 ltr/rtl、
 * `data-scui-orientation` 表示水平 / 垂直。一个属性名只表达一个语义（R1）。
 *
 * R3：函数型 prop（`onOpenChange`）直接声明为函数，不用 `MaybeAccessor` 包裹。
 */
import type { JSX } from 'solid-js';

/** 抽屉贴边方向，默认 `right`。 */
export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom';

/** 三档尺寸，与 Button / Pagination / Modal 的 `Size` 口径一致。 */
export type DrawerSize = 'small' | 'medium' | 'large';

export interface DrawerProps {
  /** 受控打开状态；给了就完全由调用方驱动，组件内部不回写。 */
  open?: boolean;
  /** 非受控初始状态。 @default false */
  defaultOpen?: boolean;
  /** 打开状态变化出口；ESC / 遮罩 / 关闭按钮都走这一条，请求打开不会（无内置触发按钮）。 */
  onOpenChange?: (open: boolean) => void;
  /** 标题；渲染进 `Dialog.Title`，是 `aria-labelledby` 的来源。 */
  title: JSX.Element;
  /** 正文。 */
  children?: JSX.Element;
  /**
   * 底部操作区。不传或传 `null` 时整块不渲染（不留空盒子）；
   * 与 Modal 不同，Drawer 没有默认确认 / 取消按钮，异步确认属于 Modal 的职责。
   * @default undefined
   */
  footer?: JSX.Element | null;
  /** 贴边方向。 @default 'right' */
  placement?: DrawerPlacement;
  /** 三档尺寸；左右方向控制宽度，上下方向控制高度。 @default 'medium' */
  size?: DrawerSize;
  /** 显式宽度，覆盖 `size`；数字按 px 处理。**只在 left / right 生效**。 @default undefined */
  width?: number | string;
  /** 显式高度，覆盖 `size`；数字按 px 处理。**只在 top / bottom 生效**。 @default undefined */
  height?: number | string;
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
