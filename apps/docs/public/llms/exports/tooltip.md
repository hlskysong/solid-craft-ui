# Tooltip 文字提示（`solid-craft/tooltip`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

锚定浮层：十二向定位与翻转、打开/关闭延迟、可选箭头；ESC 与焦点归还沿用锚定原语，不重复实现第二套契约，SSR 只输出触发按钮。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/tooltip/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/tooltip/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/tooltip/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/tooltip/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/tooltip';
```

## API

### TooltipProps

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `content` | `JSX.Element` | — | 提示内容，渲染进 `role="tooltip"` 的浮层。 | 是 |
| `children` | `JSX.Element` | — | 触发元素内容；原语负责包成按钮并接管 hover / focus 时序与键盘。 | 是 |
| `placement` | `TooltipPlacement` | — | 锚定方向，恒输出为 `data-scui-anchor`。 @default 'top' | 否 |
| `openDelay` | `number` | — | 指针进入触发元素到打开的时间（ms）。 @default 200 | 否 |
| `closeDelay` | `number` | — | 指针离开到关闭的时间（ms）。 @default 100 | 否 |
| `arrow` | `boolean` | — | 是否渲染箭头。 @default true | 否 |
| `disabled` | `boolean` | — | 是否禁用触发（禁用后不响应 hover / focus）。 @default false | 否 |
| `open` | `boolean` | — | 受控打开状态；给了就完全由调用方驱动。 @default undefined | 否 |
| `defaultOpen` | `boolean` | — | 非受控初始状态。 @default false | 否 |
| `onOpenChange` | `(open: boolean) => void` | — | 打开状态变化出口；hover / focus / ESC 都汇到这一条。 | 否 |
| `class` | `string` | — | 触发按钮自定义类名。 @default undefined | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/tooltip/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
/**
 * `Tooltip` 的公共类型（T3-09，§4.2「定位 / 延迟 / 箭头」）。
 *
 * 方向值直接复用原语层的 `PrimitiveAnchorPlacement`（12 向，与 Floating UI
 * 同形），但对外只暴露 `TooltipPlacement` 别名 —— 公共 API 不出现
 * `primitives` 命名空间，也不越出任何第三方类型。
 *
 * 刻意新增 `data-scui-anchor`，不复用 `data-scui-placement`（App / Message
 * 的反馈容器六向位置）或 `data-scui-side`（Drawer 贴视口四边）：这里的语义是
 * 「浮层挂在触发元素哪一侧」，一个属性名只表达一个语义（R1）。
 *
 * R3：函数型 prop（`onOpenChange`）直接声明为函数，不用 `MaybeAccessor` 包裹。
 */
import type { JSX } from 'solid-js';

import type { PrimitiveAnchorPlacement } from '../../primitives';

/** 锚定方向，默认 `top`。 */
export type TooltipPlacement = PrimitiveAnchorPlacement;

export interface TooltipProps {
  /** 提示内容，渲染进 `role="tooltip"` 的浮层。 */
  content: JSX.Element;
  /** 触发元素内容；原语负责包成按钮并接管 hover / focus 时序与键盘。 */
  children: JSX.Element;
  /** 锚定方向，恒输出为 `data-scui-anchor`。 @default 'top' */
  placement?: TooltipPlacement;
  /** 指针进入触发元素到打开的时间（ms）。 @default 200 */
  openDelay?: number;
  /** 指针离开到关闭的时间（ms）。 @default 100 */
  closeDelay?: number;
  /** 是否渲染箭头。 @default true */
  arrow?: boolean;
  /** 是否禁用触发（禁用后不响应 hover / focus）。 @default false */
  disabled?: boolean;
  /** 受控打开状态；给了就完全由调用方驱动。 @default undefined */
  open?: boolean;
  /** 非受控初始状态。 @default false */
  defaultOpen?: boolean;
  /** 打开状态变化出口；hover / focus / ESC 都汇到这一条。 */
  onOpenChange?: (open: boolean) => void;
  /** 触发按钮自定义类名。 @default undefined */
  class?: string;
}
```

## 相关 Demo（完整源码见链接页）

- [基础用法与定位](../demos/tooltip-basic.md)：十二向 placement 由 Floating UI 负责翻转；切换方向只改 data-scui-anchor，浮层行为与焦点契约保持同一套。（源文件 `packages/core/src/components/tooltip/demos/basic.tsx`）
- [打开与关闭延迟](../demos/tooltip-delay.md)：openDelay / closeDelay 直接透传给锚定原语，由 Kobalte 的 hover 时序统一执行；onOpenChange 是唯一状态出口。（源文件 `packages/core/src/components/tooltip/demos/delay.tsx`）
- [打开态与箭头](../demos/tooltip-open-state.md)：首屏受控打开，让浮层态进入视觉基线与 axe 扫描；箭头由锚定原语渲染，关闭箭头后整块不渲染。（源文件 `packages/core/src/components/tooltip/demos/open-state.tsx`）

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
