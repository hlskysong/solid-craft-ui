# Modal 对话框（`solid-craft/modal`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

受控打开与外部按钮驱动；异步确认期间防重复提交并拦截 ESC / 遮罩关闭；焦点陷阱与关闭后焦点归还触发元素，SSR 只输出静态骨架。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/modal/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/modal/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/modal/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/modal/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/modal';
```

## API

### ModalProps

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `open` | `boolean` | — | 受控打开状态；给了就完全由调用方驱动，组件内部不回写。 | 否 |
| `defaultOpen` | `boolean` | — | 非受控初始状态。 @default false | 否 |
| `onOpenChange` | `(open: boolean) => void` | — | 打开状态变化出口；任何关闭路径都会发，请求打开不会（无内置触发按钮）。 | 否 |
| `title` | `JSX.Element` | — | 标题；渲染进 `Dialog.Title`，是 `aria-labelledby` 的来源。 | 是 |
| `children` | `JSX.Element` | — | 正文。 | 否 |
| `footer` | `JSX.Element \| null` | `undefined` | 底部操作区。传 `null` 表示整块不渲染（不留空盒子）； 不传则渲染默认的「取消 / 确定」两个按钮。 | 否 |
| `okText` | `string` | — | 默认确定按钮文案。 @default '确定' | 否 |
| `cancelText` | `string` | — | 默认取消按钮文案。 @default '取消' | 否 |
| `onOk` | `() => void \| Promise<void>` | — | 确认回调。返回 Promise 时进入异步关闭状态机：期间禁用确认按钮、 拦截 ESC / 遮罩 / 关闭按钮 / 取消，resolve 后才关闭，reject 则保持打开。 | 否 |
| `onCancel` | `() => void` | — | 取消 / ESC / 遮罩 / 关闭按钮触发；异步提交期间不会触发。 | 否 |
| `confirmLoading` | `boolean` | `false` | 外部控制的确认加载态（表单提交由父组件发起时用）。 与 `onOk` 返回 Promise 触发的内部 pending 取或。 | 否 |
| `size` | `ModalSize` | — | 三档宽度。 @default 'medium' | 否 |
| `width` | `number \| string` | — | 显式宽度，覆盖 `size`；数字按 px 处理。 @default undefined | 否 |
| `closable` | `boolean` | — | 是否显示右上角关闭按钮。 @default true | 否 |
| `keyboard` | `boolean` | — | 是否允许 ESC 关闭。 @default true | 否 |
| `maskClosable` | `boolean` | — | 是否允许点击遮罩关闭。 @default true | 否 |
| `closeLabel` | `string` | — | 右上角关闭按钮的无障碍文案。 @default '关闭' | 否 |
| `class` | `string` | — | 内容容器自定义类名。 @default undefined | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/modal/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
/**
 * `Modal` 的公共类型（T3-07，§4.2 与 `docs/04 §2.4`）。
 *
 * 组件层只表达「业务语义」：受控打开、异步确认、尺寸、文案；
 * Portal / 遮罩 / 焦点陷阱 / ESC 一律交给 `primitives/overlay`，
 * 第三方无头库的类型与 props 形态不越过原语层。
 *
 * R3：函数型 prop（`onOk` / `onCancel` / `onOpenChange`）一律直接声明为函数，
 * 不用 `MaybeAccessor` 包裹 —— 包裹后调用方写一个 getter 会变成「状态读取」
 * 而不是「回调」，语义会反过来。
 */
import type { JSX } from 'solid-js';

/** 三档宽度档位，与 Button / Pagination 的 `Size` 口径一致。 */
export type ModalSize = 'small' | 'medium' | 'large';

/** 关闭来源，`onCancel` 只覆盖用户主动取消；`ok` 由 `onOk` 成功后触发。 */
export type ModalCloseReason = 'ok' | 'cancel';

export interface ModalProps {
  /** 受控打开状态；给了就完全由调用方驱动，组件内部不回写。 */
  open?: boolean;
  /** 非受控初始状态。 @default false */
  defaultOpen?: boolean;
  /** 打开状态变化出口；任何关闭路径都会发，请求打开不会（无内置触发按钮）。 */
  onOpenChange?: (open: boolean) => void;
  /** 标题；渲染进 `Dialog.Title`，是 `aria-labelledby` 的来源。 */
  title: JSX.Element;
  /** 正文。 */
  children?: JSX.Element;
  /**
   * 底部操作区。传 `null` 表示整块不渲染（不留空盒子）；
   * 不传则渲染默认的「取消 / 确定」两个按钮。
   * @default undefined
   */
  footer?: JSX.Element | null;
  /** 默认确定按钮文案。 @default '确定' */
  okText?: string;
  /** 默认取消按钮文案。 @default '取消' */
  cancelText?: string;
  /**
   * 确认回调。返回 Promise 时进入异步关闭状态机：期间禁用确认按钮、
   * 拦截 ESC / 遮罩 / 关闭按钮 / 取消，resolve 后才关闭，reject 则保持打开。
   */
  onOk?: () => void | Promise<void>;
  /** 取消 / ESC / 遮罩 / 关闭按钮触发；异步提交期间不会触发。 */
  onCancel?: () => void;
  /**
   * 外部控制的确认加载态（表单提交由父组件发起时用）。
   * 与 `onOk` 返回 Promise 触发的内部 pending 取或。
   * @default false
   */
  confirmLoading?: boolean;
  /** 三档宽度。 @default 'medium' */
  size?: ModalSize;
  /** 显式宽度，覆盖 `size`；数字按 px 处理。 @default undefined */
  width?: number | string;
  /** 是否显示右上角关闭按钮。 @default true */
  closable?: boolean;
  /** 是否允许 ESC 关闭。 @default true */
  keyboard?: boolean;
  /** 是否允许点击遮罩关闭。 @default true */
  maskClosable?: boolean;
  /** 右上角关闭按钮的无障碍文案。 @default '关闭' */
  closeLabel?: string;
  /** 内容容器自定义类名。 @default undefined */
  class?: string;
}
```

## 相关 Demo（完整源码见链接页）

- [异步关闭](../demos/modal-async-close.md)：onOk 返回 Promise 时进入等待态：确认按钮转圈、取消与右上关闭禁用、ESC 与遮罩点击被拦截，重复点击不会再发一次请求。（源文件 `packages/core/src/components/modal/demos/async-close.tsx`）
- [基础用法](../demos/modal-basic.md)：外部按钮受控打开；默认底部是「取消 / 确定」。三档尺寸共用同一套交互，显式 width 可覆盖尺寸档位。（源文件 `packages/core/src/components/modal/demos/basic.tsx`）
- [焦点陷阱与归还](../demos/modal-focus.md)：打开后焦点被限制在弹层内循环；按 ESC 关闭时焦点会回到当初的触发按钮，而不是丢在 body 上。（源文件 `packages/core/src/components/modal/demos/focus.tsx`）
- [打开态与尺寸](../demos/modal-open-state.md)：首屏即打开，用于视觉基线与弹层态 axe 扫描；点底部按钮切换三档尺寸，关闭后可用背景按钮重新打开。（源文件 `packages/core/src/components/modal/demos/open-state.tsx`）

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
