/**
 * `Tag` 的公共类型（T3-10，§4.2 与 `docs/04 §2.3`「颜色、可关闭、边框」）。
 *
 * 颜色**复用** `data-scui-color`：Button 早已输出这个属性，取值也和
 * `demos/shared.tsx` 的 `COLORS` 完全同口径（primary / neutral / success /
 * warning / danger）。刻意不复用 `data-scui-kind`（那是「一条反馈自身的语义
 * 类型」，取值 info/success/warning/error/loading）或 `data-scui-variant`
 * （那是 Skeleton 的骨架形状）——同名不同义会违反 R1。
 *
 * 边框复用 `data-scui-bordered`（Table 已登记的「存在即真」口径）；可关闭只是
 * 结构开关，不需要新状态属性。范围严格按 §4.2 三项，不加 size / disabled 等
 * 冻结面没要求的开关。
 *
 * R3：函数型 prop（`onClose`）直接声明为函数，不用 `MaybeAccessor` 包裹。
 */
import type { JSX } from 'solid-js';

/** 标签配色，默认 `neutral`（对应 TDesign 的 `default`）；与 Button 的 `data-scui-color` 同一套取值。 */
export type TagColor = 'primary' | 'neutral' | 'success' | 'warning' | 'danger';

/**
 * 标签形态，默认 `dark`（TDesign 口径）：
 * - `dark` 实底反白字；
 * - `light` 浅底彩字；
 * - `outline` 白底彩边彩字；
 * - `light-outline` 浅底彩边彩字。
 *
 * 走 `data-scui-variant`，与 Skeleton / Tabs 的「视觉变体」同一语义（R1）。
 */
export type TagVariant = 'dark' | 'light' | 'outline' | 'light-outline';

/** `<Tag>` 入参。原生属性照常透传到根节点。 */
export interface TagProps extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'children' | 'color'> {
  /**
   * 配色，恒输出为 `data-scui-color`。
   * @default 'neutral'
   */
  color?: TagColor;
  /**
   * 形态，恒输出为 `data-scui-variant`，默认 `dark`。
   * `outline` / `light-outline` 自带彩边；`dark` / `light` 无边框。
   * @default 'dark'
   */
  variant?: TagVariant;
  /**
   * 是否显示外边框；为真时输出存在即真的 `data-scui-bordered`。
   * 边框恒占 1px（无边框时用透明色），切换不抖动。
   * @default false
   */
  bordered?: boolean;
  /**
   * 是否可关闭；为真时尾部多一个带 `aria-label` 的按钮。
   * @default false
   */
  closable?: boolean;
  /** 关闭按钮的无障碍文案。 @default '关闭标签' */
  closeLabel?: string;
  /** 点击关闭后触发；组件内部同时移除自身 DOM（与 Alert 一致的非受控口径）。 */
  onClose?: () => void;
  /** 标签文案。 */
  children?: JSX.Element;
}
