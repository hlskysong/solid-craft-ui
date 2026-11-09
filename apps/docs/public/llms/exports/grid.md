# Grid 栅格（`solid-craft/grid`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

24 栅格 Row / Col、间距、偏移与响应式断点。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/grid/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/grid/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/grid/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/grid/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/grid';
```

## API

### RowProps

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `gutter` | `'small' \| 'medium' \| 'large'` | `'medium'` | 栅格间距尺寸。 | 否 |
| `align` | `'top' \| 'middle' \| 'bottom'` | `undefined` | 交叉轴对齐方式。 | 否 |
| `justify` | `'start' \| 'center' \| 'end' \| 'space-between' \| 'space-around'` | `undefined` | 主轴对齐方式。 | 否 |
| `wrap` | `boolean` | `true` | 是否换行。 | 否 |
| `class` | `string` | `undefined` | 自定义类名。 | 否 |
| `children` | `JSX.Element` | `undefined` | 栅格内容。 | 否 |

### ColProps

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `span` | `number` | `24` | 栅格占位列数（1–24）。 | 否 |
| `offset` | `number` | `0` | 左侧偏移列数。 | 否 |
| `order` | `number` | `0` | 排列顺序。 | 否 |
| `xs` | `number` | `undefined` | xs 断点下的占位列数。 | 否 |
| `sm` | `number` | `undefined` | sm 断点下的占位列数。 | 否 |
| `md` | `number` | `undefined` | md 断点下的占位列数。 | 否 |
| `lg` | `number` | `undefined` | lg 断点下的占位列数。 | 否 |
| `xl` | `number` | `undefined` | xl 断点下的占位列数。 | 否 |
| `xxl` | `number` | `undefined` | xxl 断点下的占位列数。 | 否 |
| `class` | `string` | `undefined` | 自定义类名。 | 否 |
| `children` | `JSX.Element` | `undefined` | 栅格内容。 | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/grid/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
import type { JSX } from 'solid-js';

export interface RowProps {
  /**
   * 栅格间距尺寸。
   * @default 'medium'
   */
  gutter?: 'small' | 'medium' | 'large';
  /**
   * 交叉轴对齐方式。
   * @default undefined
   */
  align?: 'top' | 'middle' | 'bottom';
  /**
   * 主轴对齐方式。
   * @default undefined
   */
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
  /**
   * 是否换行。
   * @default true
   */
  wrap?: boolean;
  /**
   * 自定义类名。
   * @default undefined
   */
  class?: string;
  /**
   * 栅格内容。
   * @default undefined
   */
  children?: JSX.Element;
}

export interface ColProps {
  /**
   * 栅格占位列数（1–24）。
   * @default 24
   */
  span?: number;
  /**
   * 左侧偏移列数。
   * @default 0
   */
  offset?: number;
  /**
   * 排列顺序。
   * @default 0
   */
  order?: number;
  /**
   * xs 断点下的占位列数。
   * @default undefined
   */
  xs?: number;
  /**
   * sm 断点下的占位列数。
   * @default undefined
   */
  sm?: number;
  /**
   * md 断点下的占位列数。
   * @default undefined
   */
  md?: number;
  /**
   * lg 断点下的占位列数。
   * @default undefined
   */
  lg?: number;
  /**
   * xl 断点下的占位列数。
   * @default undefined
   */
  xl?: number;
  /**
   * xxl 断点下的占位列数。
   * @default undefined
   */
  xxl?: number;
  /**
   * 自定义类名。
   * @default undefined
   */
  class?: string;
  /**
   * 栅格内容。
   * @default undefined
   */
  children?: JSX.Element;
}
```

## 相关 Demo（完整源码见链接页）

- [基础用法](../demos/grid-basic.md)：24 栅格、偏移与对齐换行。（源文件 `packages/core/src/components/grid/demos/basic.tsx`）

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
