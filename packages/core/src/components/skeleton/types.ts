/**
 * `Skeleton` 的公共类型（T3-05）。
 *
 * 范围按 `docs/04 §4` 的 P0 条目「文本 / 表格 / 卡片骨架」：五种形状 + 包裹模式。
 * 形状用 `variant` 一个字符串开关，而不是 `title` / `avatar` / `paragraph` 三个布尔
 * ——三个布尔能拼出不存在的组合（头像 + 表格），字符串枚举不会（R2 = A）。
 *
 * 硬性约束来自 `docs/08 §4.2` T3-05 验收列：**骨架与真实内容同尺寸、切换不抖动**。
 * 因此每一个形状的块高都直接引用被替代组件的尺寸 token（见 `skeleton.scss`），
 * 不写裸像素；文本骨架的行块高恒等于 `--scui-line-height-md`，三行骨架 = 三行文本。
 *
 * R3：`children` 是节点，不套 `MaybeAccessor`。
 */
import type { JSX } from 'solid-js';

/**
 * 骨架形状。
 * - `text`：段落，`rows` 行，末行收窄；
 * - `card`：卡片，标题条 + 正文行；
 * - `table`：表格，表头行 + `rows` 行，与 Table 默认密度的行高一致；
 * - `button`：单条，高度取按钮中年档；
 * - `avatar`：圆形，尺寸取常用头像档。
 */
export type SkeletonVariant = 'text' | 'card' | 'table' | 'button' | 'avatar';

/** `<Skeleton>` 入参。原生属性照常透传到根节点。 */
export interface SkeletonProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'children' | 'style'
> {
  /**
   * 形状。
   * @default 'text'
   */
  variant?: SkeletonVariant;
  /**
   * 行数，只对 `text` / `table` 生效；小于 1 的值按 1 处理。
   * @default 3
   */
  rows?: number;
  /**
   * 微光动画。开启后仍尊重 `prefers-reduced-motion: reduce`（系统要求减动效时静止）。
   * @default false
   */
  active?: boolean;
  /**
   * 包裹模式开关，**只有传了 `children` 才有意义**：
   * `true` 显示骨架、`false` 显示内容；不传 `children` 时恒显示骨架。
   * @default false
   */
  loading?: boolean;
  /**
   * 被包裹的真实内容。传了它才进入包裹模式（外层多一个 `aria-busy` 容器）。
   * @default undefined
   */
  children?: JSX.Element;
  /**
   * 根节点样式；与 `class` 一样合并而非覆盖。
   */
  style?: string;
}
