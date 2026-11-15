# Descriptions 详情列表（`solid-craft/descriptions`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

详情页键值展示用原生 dl / dt / dd 语义；data-scui-column 派生网格列数、data-scui-span 控制跨列，窄屏强制单列，表头按内容缺席。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/descriptions/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/descriptions/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/descriptions/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/descriptions/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/descriptions';
```

## API

### DescriptionsItem

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `key` | `string` | — | 唯一 key，供 `<For>` 复用节点。 | 是 |
| `label` | `JSX.Element` | — | 字段名。 | 是 |
| `children` | `JSX.Element` | — | 字段值；缺席时渲染空的 `<dd>`，不留塌陷。 | 否 |
| `span` | `DescriptionsColumn` | — | 该项跨几列，默认 1；窄屏由 CSS 强制回落到 1 以免溢出。 | 否 |

### DescriptionsProps

继承：`Omit<   JSX.HTMLAttributes<HTMLDivElement>,   'children' \| 'title' >`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `items` | `DescriptionsItem[]` | — | 键值项列表。 | 是 |
| `title` | `JSX.Element` | — | 详情页标题；省略时按 `extra` 是否存在决定表头是否整块缺席。 | 否 |
| `extra` | `JSX.Element` | — | 表头右侧操作区。 | 否 |
| `column` | `DescriptionsColumn` | `2` | 一行几列，恒输出为 `data-scui-column`。 | 否 |
| `bordered` | `boolean` | — | 是否给每个键值项加外边框；复用 `data-scui-bordered`。 @default false | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/descriptions/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
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
```

## 相关 Demo（完整源码见链接页）

- [详情页键值展示](../demos/descriptions-basic.md)：用原生 dl / dt / dd 承载字段名与值，标题与操作区按内容缺席；备注用 span=2 跨满一行。列数与跨列都恒输出 data-scui-*，SSR 与首帧一致。（源文件 `packages/core/src/components/descriptions/demos/basic.tsx`）
- [边框与表头](../demos/descriptions-bordered.md)：bordered 复用 Table / Tag 已登记的 data-scui-bordered（存在即真）；标题与操作区都为 undefined 时表头整块缺席，不留空盒子。（源文件 `packages/core/src/components/descriptions/demos/bordered.tsx`）
- [列数与跨列](../demos/descriptions-column.md)：column=1 / 2 / 3 三档由 data-scui-column 派生 grid 列数；窄屏强制单列且把 span 收回 1，避免隐式列导致横向溢出。（源文件 `packages/core/src/components/descriptions/demos/column.tsx`）

## 相关规范

> 规范摘录：`docs/02-架构设计.md` → ### 6.1 命名与 Props


```tsx
export interface ButtonProps
  extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: 'solid' | 'outline' | 'dashed' | 'text' | 'link';
  /** 语义色，默认 primary（v0.3 / Q16 已定） */
  color?: 'primary' | 'neutral' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'medium' | 'large';
  block?: boolean;
  loading?: boolean;
  icon?: JSX.Element;
  iconPosition?: 'start' | 'end';
  shape?: 'default' | 'round' | 'circle';
  htmlType?: 'button' | 'submit' | 'reset';
}
```

约定：

- 尺寸统一 `small | medium | large`（24 / 32 / 40 px），与 TDesign/AntD 习惯一致。
- 变体统一 `variant` + `color`；表单状态统一 `status: 'error' | 'warning' | 'success'`。
- 继承原生属性；`class` / `style` 合并而不是覆盖。
- `ref` 支持 `HTMLElement` 或回调；不额外发明 `forwardRef`。
- 布尔 prop 用肯定语义：`disabled`、`loading`、`block`、`clearable`、`searchable`。
- 不使用 `isXxx` 前缀；不使用 `onXxxChange` 之外的自定义事件名。
