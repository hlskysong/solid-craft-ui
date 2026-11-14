/**
 * `Spin` 的公共类型（T3-05）。
 *
 * 范围按 `docs/04 §4` 的 P0 条目「包裹 / 独立、延迟显示」：
 * 独立形态是一个自带 `role="status"` 的转圈；包裹形态在内容上层盖一层遮罩，
 * 并给容器 `aria-busy`。不做全屏 loading、不做进度百分比 —— 那是 `Progress` 的事。
 *
 * `delay` 的语义（`docs/08 §4.2` T3-05 验收列要求「延迟显示可测」）：
 * **从 `spinning` 变为 true 起算**，未到时间不渲染遮罩；期间若 `spinning` 转回 false，
 * 定时器立即取消，遮罩一次都不出现 —— 避免「请求 80ms 就回来、遮罩闪一下」的抖动。
 *
 * R3：`tip` / `children` 是节点，不套 `MaybeAccessor`。
 */
import type { JSX } from 'solid-js';

/** 尺寸档：只影响转圈直径与描边粗细。 */
export type SpinSize = 'small' | 'medium' | 'large';

/** `<Spin>` 入参。原生属性照常透传到根节点。 */
export interface SpinProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children' | 'style'> {
  /**
   * 是否加载中。
   * @default true
   */
  spinning?: boolean;
  /**
   * 延迟显示毫秒数。小于 0 按 0 处理（立即显示）。
   * @default 0
   */
  delay?: number;
  /**
   * 尺寸档。
   * @default 'medium'
   */
  size?: SpinSize;
  /**
   * 加载文案。不传时读屏仍会读到视觉隐藏的「加载中」，避免出现无声转圈。
   * @default undefined
   */
  tip?: JSX.Element;
  /**
   * 被包裹的内容。传了它才进入包裹模式（遮罩覆盖在内容上），
   * 不传则渲染独立转圈。
   * @default undefined
   */
  children?: JSX.Element;
  /**
   * 根节点样式；与 `class` 一样合并而非覆盖。
   */
  style?: string;
}
