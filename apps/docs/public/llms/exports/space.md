# Space 间距（`solid-craft/space`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

水平 / 垂直排列、间距档位、分隔与换行。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/space/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/space/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/space/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/space/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/space';
```

## API

### SpaceProps

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | 排列方向，写入 DOM 属性 `data-scui-orientation`。 | 否 |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | 间距尺寸。 | 否 |
| `wrap` | `boolean` | `false` | 是否换行。 | 否 |
| `align` | `'start' \| 'center' \| 'end' \| 'baseline'` | `undefined` | 交叉轴对齐方式。 | 否 |
| `split` | `JSX.Element` | `undefined` | 子项之间的分隔内容。 | 否 |
| `class` | `string` | `undefined` | 自定义类名。 | 否 |
| `children` | `JSX.Element` | `undefined` | 子项内容。 | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/space/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
import type { JSX } from 'solid-js';

export interface SpaceProps {
  /**
   * 排列方向，写入 DOM 属性 `data-scui-orientation`。
   * @default 'horizontal'
   */
  direction?: 'horizontal' | 'vertical';
  /**
   * 间距尺寸。
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * 是否换行。
   * @default false
   */
  wrap?: boolean;
  /**
   * 交叉轴对齐方式。
   * @default undefined
   */
  align?: 'start' | 'center' | 'end' | 'baseline';
  /**
   * 子项之间的分隔内容。
   * @default undefined
   */
  split?: JSX.Element;
  /**
   * 自定义类名。
   * @default undefined
   */
  class?: string;
  /**
   * 子项内容。
   * @default undefined
   */
  children?: JSX.Element;
}
```

## 相关 Demo（完整源码见链接页）

- [基础用法](../demos/space-basic.md)：水平 / 垂直排列、分隔线与换行对齐。（源文件 `packages/core/src/components/space/demos/basic.tsx`）

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
