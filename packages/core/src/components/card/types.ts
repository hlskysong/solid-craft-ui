/**
 * `Card` 的公共类型（T3-10，§4.2 与 `docs/04 §2.3`「标题、操作、封面、加载」）。
 *
 * 范围严格按 §4.2 验收列的四项，不加 `hoverable` / `size` / `bordered` 等冻结面
 * 没要求的开关：S 复杂度组件多一个布尔就多一套选择器与一份 Demo 基线，而调用方
 * 完全可以用 `class` 覆盖。尺寸口径仍是 `small | medium | large`，但 Card 不暴露它。
 *
 * 加载态**复用** `data-scui-loading`（Select / Table 已登记的「存在即真」口径），
 * 并在 `body` 里直接组合 T3-05 的 `Skeleton`，不自建第二套占位骨架。
 *
 * R3：函数型 prop 直接声明为函数，不用 `MaybeAccessor` 包裹；本组件无函数型 prop。
 */
import type { JSX } from 'solid-js';

/** `<Card>` 入参。原生属性照常透传到根节点。 */
export interface CardProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
  /** 卡片标题；省略时整块表头按 `extra` 是否存在决定，二者都不传则表头整块缺席。 */
  title?: JSX.Element;
  /** 表头右侧操作区；不传时整块不渲染，不留空盒子。 */
  extra?: JSX.Element;
  /** 封面，位于表头之上；常放 `<img>` 或自定义渐变块。 */
  cover?: JSX.Element;
  /**
   * 加载态。为 `true` 时根节点输出 `data-scui-loading`，正文换成 `Skeleton`；
   * 表头与封面照常渲染，避免加载前后整张卡片跳动。
   * @default false
   */
  loading?: boolean;
  /** 卡片正文；`loading` 为真时不被渲染。 */
  children?: JSX.Element;
}
