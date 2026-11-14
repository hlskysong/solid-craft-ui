# Popconfirm 气泡确认（`solid-craft/popconfirm`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

锚定确认气泡：onOk 返回 Promise 期间进入 pending 并拦截全部关闭入口，resolve 后关闭、reject 可重试；与 Modal 共用同一套异步协议。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/popconfirm/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/popconfirm/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/popconfirm/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/popconfirm/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/popconfirm';
```

## API

### PopconfirmProps

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `title` | `JSX.Element` | — | 确认标题，渲染进 `Popover.Title`，是 `aria-labelledby` 的来源。 | 是 |
| `description` | `JSX.Element` | — | 补充说明，渲染进 `Popover.Description`。 | 否 |
| `children` | `JSX.Element` | — | 触发按钮内容。 @default '删除' | 否 |
| `okText` | `string` | — | 确认按钮文案。 @default '确定' | 否 |
| `cancelText` | `string` | — | 取消按钮文案。 @default '取消' | 否 |
| `onOk` | `() => void \| Promise<void>` | — | 确认回调；返回 Promise 时进入 pending，resolve 才关闭，reject 保持打开。 | 否 |
| `onCancel` | `() => void` | — | 取消 / ESC / 点击外部时触发。 | 否 |
| `placement` | `PopconfirmPlacement` | — | 锚定方向，恒输出为 `data-scui-anchor`。 @default 'top' | 否 |
| `arrow` | `boolean` | — | 是否渲染箭头。 @default true | 否 |
| `disabled` | `boolean` | — | 是否禁用触发按钮。 @default false | 否 |
| `open` | `boolean` | — | 受控打开状态；给了就完全由调用方驱动。 @default undefined | 否 |
| `defaultOpen` | `boolean` | — | 非受控初始状态。 @default false | 否 |
| `onOpenChange` | `(open: boolean) => void` | — | 打开状态变化出口；点击触发 / 确认 / 取消 / ESC 都汇到这一条。 | 否 |
| `class` | `string` | — | 触发按钮自定义类名。 @default undefined | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/popconfirm/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
/**
 * `Popconfirm` 的公共类型（T3-09，§4.2「确认气泡、异步」）。
 *
 * 方向复用 `PrimitiveAnchorPlacement`，对外以 `PopconfirmPlacement` 暴露；
 * 与 Tooltip 共用同一个 `data-scui-anchor` 属性（同一语义，不多起别名）。
 *
 * 异步协议与 `Modal` **完全同形**：`onOk` 返回 Promise 期间进入
 * `data-scui-pending`，确认按钮 loading、取消按钮 disabled、ESC / 外部交互
 * 被原语闸门拦截；resolve 后关闭、reject 保持打开，`isPending()` 早退防重复提交。
 * 不引入 `confirmLoading` 受控态：气泡上下文比对话框短，调用方直接返回
 * Promise 即可，多一层受控开关只会制造两个真源。
 *
 * R3：函数型 prop（`onOk` / `onCancel` / `onOpenChange`）直接声明为函数。
 */
import type { JSX } from 'solid-js';

import type { PrimitiveAnchorPlacement } from '../../primitives';

/** 锚定方向，默认 `top`。 */
export type PopconfirmPlacement = PrimitiveAnchorPlacement;

export interface PopconfirmProps {
  /** 确认标题，渲染进 `Popover.Title`，是 `aria-labelledby` 的来源。 */
  title: JSX.Element;
  /** 补充说明，渲染进 `Popover.Description`。 */
  description?: JSX.Element;
  /** 触发按钮内容。 @default '删除' */
  children?: JSX.Element;
  /** 确认按钮文案。 @default '确定' */
  okText?: string;
  /** 取消按钮文案。 @default '取消' */
  cancelText?: string;
  /** 确认回调；返回 Promise 时进入 pending，resolve 才关闭，reject 保持打开。 */
  onOk?: () => void | Promise<void>;
  /** 取消 / ESC / 点击外部时触发。 */
  onCancel?: () => void;
  /** 锚定方向，恒输出为 `data-scui-anchor`。 @default 'top' */
  placement?: PopconfirmPlacement;
  /** 是否渲染箭头。 @default true */
  arrow?: boolean;
  /** 是否禁用触发按钮。 @default false */
  disabled?: boolean;
  /** 受控打开状态；给了就完全由调用方驱动。 @default undefined */
  open?: boolean;
  /** 非受控初始状态。 @default false */
  defaultOpen?: boolean;
  /** 打开状态变化出口；点击触发 / 确认 / 取消 / ESC 都汇到这一条。 */
  onOpenChange?: (open: boolean) => void;
  /** 触发按钮自定义类名。 @default undefined */
  class?: string;
}
```

## 相关 Demo（完整源码见链接页）

- [异步确认与全局反馈接入](../demos/popconfirm-basic.md)：onOk 返回 Promise 期间进入 pending：确认按钮 loading、取消禁用、ESC 与外部点击被拦；resolve 后关闭并调用 T2-06 的静态 message。（源文件 `packages/core/src/components/popconfirm/demos/basic.tsx`）
- [打开态视觉基线](../demos/popconfirm-open-state.md)：首屏受控打开，让确认气泡进入视觉基线与 axe 扫描；底部按钮组复用 Button 样式，随 popconfirm.css 一并聚合。（源文件 `packages/core/src/components/popconfirm/demos/open-state.tsx`）
- [定位与文案覆盖](../demos/popconfirm-placement.md)：四向 placement 由 Floating UI 负责翻转；okText / cancelText 与 arrow 开关都只影响展示，不改变异步确认协议。（源文件 `packages/core/src/components/popconfirm/demos/placement.tsx`）

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
