# Icon 图标（`solid-craft/icon`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

语义色与尺寸统一的图标容器，装饰性图标自动对读屏隐藏。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/icon/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/icon/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/icon/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/icon/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/icon';
```

## API

### IconProps

继承：`Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'color'>`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | 图标尺寸。 | 否 |
| `tone` | `'primary' \| 'secondary' \| 'tertiary' \| 'disabled' \| 'success' \| 'warning' \| 'danger'` | `undefined` | 语义色；不传时继承 currentColor。 | 否 |
| `spin` | `boolean` | `false` | 是否旋转。 | 否 |
| `label` | `string` | `undefined` | 无障碍标签；传入时作为 img 暴露，未传入时视为装饰图标。 | 否 |
| `class` | `string` | `undefined` | 自定义类名。 | 否 |
| `children` | `JSX.Element` | `undefined` | 图标内容。 | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/icon/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
import type { JSX } from 'solid-js';

export interface IconProps extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'color'> {
  /**
   * 图标尺寸。
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * 语义色；不传时继承 currentColor。
   * @default undefined
   */
  tone?: 'primary' | 'secondary' | 'tertiary' | 'disabled' | 'success' | 'warning' | 'danger';
  /**
   * 是否旋转。
   * @default false
   */
  spin?: boolean;
  /**
   * 无障碍标签；传入时作为 img 暴露，未传入时视为装饰图标。
   * @default undefined
   */
  label?: string;
  /**
   * 自定义类名。
   * @default undefined
   */
  class?: string;
  /**
   * 图标内容。
   * @default undefined
   */
  children?: JSX.Element;
}
```

## 相关 Demo（完整源码见链接页）

- [基础用法](../demos/icon-basic.md)：语义色图标、装饰图标与三档尺寸。（源文件 `packages/core/src/components/icon/demos/basic.tsx`）
- [自定义图标与内联](../demos/icon-custom.md)：自带 SVG 直接嵌入、尺寸由 Icon 统一控制，以及按钮内的图标对齐。（源文件 `packages/core/src/components/icon/demos/custom.tsx`）
- [语义色与旋转](../demos/icon-tones.md)：七档语义色一次对照，以及 spin 在加载态里的用法。（源文件 `packages/core/src/components/icon/demos/tones.tsx`）

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
