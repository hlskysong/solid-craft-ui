/**
 * `Descriptions` 的公共类型（T3-11，§4.2「详情页键值展示」与 `docs/04 §2.3`）。
 *
 * 冻结面 `docs/01~07` 与 `spikes/api-draft/` 对本组件零 API 草案、零属性登记；
 * `docs/03 §?` 只给了一条 item padding token。范围严格按「详情页键值展示」收口：
 * 标题 / 操作区、键值列表、列数、跨列、边框，不做紧凑档 / 可编辑 / 虚拟滚动。
 *
 * 语义用原生 `<dl>` + `<dt>` + `<dd>`（HTML5 允许用 `<div>` 把它们分组），
 * 不复用 `<table>`：详情页不是数据表，用表格语义会给读屏器带来虚假的行列关系。
 *
 * 属性口径：
 * - **新增** `data-scui-column`（一行几列）：AGENTS 硬约束 3 未把「列数」指派给
 *   任何名字，登记表也没有；`data-scui-layout` 已被 Form 的
 *   horizontal / vertical / inline 占用，同名不同义不能复用。
 * - **复用** `data-scui-span`（跨列）：AGENTS 硬约束 3 本就把 `-span` 指派给栅格
 *   布局，登记表此前漏登记，本轮补齐（同 T3-10 对 `-color` 的处理）。
 * - **复用** `data-scui-bordered`（存在即真）：Table / Tag 同口径。
 * - 不新增 `-type`（文本语义）/ `-active` / `-variant` 等已被占用或串味的名字。
 *
 * 本组件无函数型 prop，天然不触碰 R3 的 `MaybeAccessor` 禁令。
 */
import type { JSX } from 'solid-js';

/** 列数 / 跨列数，只允许 1 / 2 / 3，避免拼出比列数还大的 span。 */
export type DescriptionsColumn = 1 | 2 | 3;

/** 详情页的一个键值项。 */
export interface DescriptionsItem {
  /** 唯一 key，供 `<For>` 复用节点。 */
  key: string;
  /** 字段名。 */
  label: JSX.Element;
  /** 字段值；缺席时渲染空的 `<dd>`，不留塌陷。 */
  children?: JSX.Element;
  /** 该项跨几列，默认 1；窄屏由 CSS 强制回落到 1 以免溢出。 */
  span?: DescriptionsColumn;
}

/** `<Descriptions>` 入参。原生属性照常透传到根节点。 */
export interface DescriptionsProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'children' | 'title'
> {
  /** 键值项列表。 */
  items: DescriptionsItem[];
  /** 详情页标题；省略时按 `extra` 是否存在决定表头是否整块缺席。 */
  title?: JSX.Element;
  /** 表头右侧操作区。 */
  extra?: JSX.Element;
  /**
   * 一行几列，恒输出为 `data-scui-column`。
   * @default 2
   */
  column?: DescriptionsColumn;
  /** 是否给每个键值项加外边框；复用 `data-scui-bordered`。 @default false */
  bordered?: boolean;
}
