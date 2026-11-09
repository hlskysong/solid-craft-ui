# Button 按钮（`solid-craft/button`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

触发操作的主控件，支持变体、语义色、尺寸、形状、加载与图标。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/button/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/button/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/button/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/button/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/button';
```

## API

### ButtonProps

继承：`Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'type'>`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `variant` | `'solid' \| 'outline' \| 'dashed' \| 'text' \| 'link'` | `'solid'` | 视觉变体。 | 否 |
| `color` | `'primary' \| 'neutral' \| 'success' \| 'warning' \| 'danger'` | `'primary'` | 语义色；neutral 需显式传入。 | 否 |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸。 | 否 |
| `block` | `boolean` | `false` | 是否占满父容器宽度。 | 否 |
| `loading` | `boolean` | `false` | 加载态；加载时禁用点击。 | 否 |
| `icon` | `JSX.Element` | `undefined` | 图标内容。 | 否 |
| `iconPosition` | `'start' \| 'end'` | `'start'` | 图标位置。 | 否 |
| `shape` | `'default' \| 'round' \| 'circle'` | `'default'` | 形状。 | 否 |
| `htmlType` | `'button' \| 'submit' \| 'reset'` | `'button'` | 原生 button type，默认 button 以避免误触发表单提交。 | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/button/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
import type { JSX } from 'solid-js';

export interface ButtonProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /**
   * 视觉变体。
   * @default 'solid'
   */
  variant?: 'solid' | 'outline' | 'dashed' | 'text' | 'link';
  /**
   * 语义色；neutral 需显式传入。
   * @default 'primary'
   */
  color?: 'primary' | 'neutral' | 'success' | 'warning' | 'danger';
  /**
   * 尺寸。
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * 是否占满父容器宽度。
   * @default false
   */
  block?: boolean;
  /**
   * 加载态；加载时禁用点击。
   * @default false
   */
  loading?: boolean;
  /**
   * 图标内容。
   * @default undefined
   */
  icon?: JSX.Element;
  /**
   * 图标位置。
   * @default 'start'
   */
  iconPosition?: 'start' | 'end';
  /**
   * 形状。
   * @default 'default'
   */
  shape?: 'default' | 'round' | 'circle';
  /**
   * 原生 button type，默认 button 以避免误触发表单提交。
   * @default 'button'
   */
  htmlType?: 'button' | 'submit' | 'reset';
}
```

## 相关 Demo（完整源码见链接页）

- [基础用法](../demos/button-basic.md)：变体、语义色、尺寸形状、状态与点击 / 键盘交互的完整基线。（源文件 `packages/core/src/components/button/demos/basic.tsx`）
- [状态与图标](../demos/button-states.md)：加载 / 禁用时禁止点击；loading 同时输出 aria-busy；图标支持首尾位置。（源文件 `packages/core/src/components/button/demos/states.tsx`）
- [变体与语义色](../demos/button-variants.md)：五种视觉变体与五种语义色可自由组合；默认变体为 solid、默认色为 primary。（源文件 `packages/core/src/components/button/demos/variants.tsx`）

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
