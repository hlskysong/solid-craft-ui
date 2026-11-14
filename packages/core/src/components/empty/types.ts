/**
 * `Empty` 的公共类型（T3-05）。
 *
 * 范围按 `docs/04 §4` 的 P0 条目「空状态、自定义插画」：一句话描述 + 一块插画 +
 * 可选的底部操作区，不做表单向导、不做错误码分支。
 *
 * R3 说明：`description` / `image` 都是**节点**而不是渲染函数，所以不套
 * `MaybeAccessor` —— `typeof value === 'function'` 无法区分「要渲染的函数」与
 * 「返回值的 getter」，套了会把 `() => <Icon />` 误判成取值器。
 *
 * R2 说明：`size` 只接受字符串字面量，不暴露 `{ small: {...} }` 这类配置对象。
 */
import type { JSX } from 'solid-js';

/**
 * 尺寸档：只影响插画块尺寸与字号档，不影响文案排版。
 * 与全局口径一致，只有 small / medium / large，不存在 sm / md。
 */
export type EmptySize = 'small' | 'medium' | 'large';

/** `<Empty>` 入参。原生属性照常透传到根节点。 */
export interface EmptyProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children' | 'style'> {
  /**
   * 描述文案。传节点而不是字符串，是因为业务经常要带一个「新建」链接或代码片段。
   * @default '暂无数据'
   */
  description?: JSX.Element;
  /**
   * 自定义插画。给了就整体替换内置图形（不是叠加）。
   * 内置图形带 `aria-hidden`，自定义插画由调用方自己决定是否可读。
   * 显式传 `null` 表示**不要插画**（纯文字空状态）；不传则用内置图形。
   * @default 内置线框插画
   */
  image?: JSX.Element | null;
  /**
   * 尺寸档。
   * @default 'medium'
   */
  size?: EmptySize;
  /**
   * 底部操作区，通常放一个主按钮（例如「新建第一条记录」）。
   * 不传则不渲染该区块，DOM 里不留空壳。
   * @default undefined
   */
  children?: JSX.Element;
  /**
   * 根节点样式；与 `class` 一样合并而非覆盖。
   */
  style?: string;
}
