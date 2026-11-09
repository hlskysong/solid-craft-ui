# Divider 分割线（`solid-craft/divider`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

水平 / 垂直分割，支持虚线与带文字。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/divider/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/divider/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/divider/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/divider/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/divider';
```

## API

### DividerProps

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | 分割线方向。 | 否 |
| `dashed` | `boolean` | `false` | 是否使用虚线。 | 否 |
| `plain` | `boolean` | `false` | 文字是否使用普通字重。 | 否 |
| `class` | `string` | `undefined` | 自定义类名。 | 否 |
| `children` | `JSX.Element` | `undefined` | 分割线文字。 | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/divider/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
import type { JSX } from 'solid-js';

export interface DividerProps {
  /**
   * 分割线方向。
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * 是否使用虚线。
   * @default false
   */
  dashed?: boolean;
  /**
   * 文字是否使用普通字重。
   * @default false
   */
  plain?: boolean;
  /**
   * 自定义类名。
   * @default undefined
   */
  class?: string;
  /**
   * 分割线文字。
   * @default undefined
   */
  children?: JSX.Element;
}
```

## 相关 Demo（完整源码见链接页）

- [基础用法](../demos/divider-basic.md)：水平 / 垂直分割线、虚线与带文字分割。（源文件 `packages/core/src/components/divider/demos/basic.tsx`）

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
