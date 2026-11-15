# Card 卡片（`solid-craft/card`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

标题 / 操作区 / 封面 / 正文四块结构，按内容缺席不留空盒子；加载态复用 data-scui-loading 并直接组合 Skeleton，切换前后不抖动，SSR 全量输出静态骨架。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/card/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/card/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/card/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/card/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/card';
```

## API

### CardProps

继承：`Omit<JSX.HTMLAttributes<HTMLDivElement>, 'title' \| 'children'>`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `title` | `JSX.Element` | — | 卡片标题；省略时整块表头按 `extra` 是否存在决定，二者都不传则表头整块缺席。 | 否 |
| `extra` | `JSX.Element` | — | 表头右侧操作区；不传时整块不渲染，不留空盒子。 | 否 |
| `cover` | `JSX.Element` | — | 封面，位于表头之上；常放 `<img>` 或自定义渐变块。 | 否 |
| `loading` | `boolean` | `false` | 加载态。为 `true` 时根节点输出 `data-scui-loading`，正文换成 `Skeleton`； 表头与封面照常渲染，避免加载前后整张卡片跳动。 | 否 |
| `children` | `JSX.Element` | — | 卡片正文；`loading` 为真时不被渲染。 | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/card/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
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
```

## 相关 Demo（完整源码见链接页）

- [标题与操作区](../demos/card-basic.md)：表头由 title 与 extra 两块组成，任一块不传就整块缺席；操作区可放任意节点，这里用 Button。（源文件 `packages/core/src/components/card/demos/basic.tsx`）
- [封面](../demos/card-cover.md)：cover 位于表头之上、圆角内裁剪；传 <img> 时样式自动铺满，也可以直接放自定义块。（源文件 `packages/core/src/components/card/demos/cover.tsx`）
- [加载态](../demos/card-loading.md)：loading 为真时正文换成 T3-05 的 Skeleton，表头与封面照常占位；切换前后卡片高度不抖动。（源文件 `packages/core/src/components/card/demos/loading.tsx`）

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
