# Drawer 抽屉（`solid-craft/drawer`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

与 Modal 共用同一份浮层原语；left / right / top / bottom 四方向贴边，三档尺寸与显式宽高按方向归一，焦点陷阱与键盘行为不重复实现，SSR 只输出静态骨架。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/drawer/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/drawer/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/drawer/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/drawer/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/drawer';
```

## API

### DrawerProps

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `open` | `boolean` | — | 受控打开状态；给了就完全由调用方驱动，组件内部不回写。 | 否 |
| `defaultOpen` | `boolean` | — | 非受控初始状态。 @default false | 否 |
| `onOpenChange` | `(open: boolean) => void` | — | 打开状态变化出口；ESC / 遮罩 / 关闭按钮都走这一条，请求打开不会（无内置触发按钮）。 | 否 |
| `title` | `JSX.Element` | — | 标题；渲染进 `Dialog.Title`，是 `aria-labelledby` 的来源。 | 是 |
| `children` | `JSX.Element` | — | 正文。 | 否 |
| `footer` | `JSX.Element \| null` | `undefined` | 底部操作区。不传或传 `null` 时整块不渲染（不留空盒子）； 与 Modal 不同，Drawer 没有默认确认 / 取消按钮，异步确认属于 Modal 的职责。 | 否 |
| `placement` | `DrawerPlacement` | — | 贴边方向。 @default 'right' | 否 |
| `size` | `DrawerSize` | — | 三档尺寸；左右方向控制宽度，上下方向控制高度。 @default 'medium' | 否 |
| `width` | `number \| string` | — | 显式宽度，覆盖 `size`；数字按 px 处理。**只在 left / right 生效**。 @default undefined | 否 |
| `height` | `number \| string` | — | 显式高度，覆盖 `size`；数字按 px 处理。**只在 top / bottom 生效**。 @default undefined | 否 |
| `closable` | `boolean` | — | 是否显示右上角关闭按钮。 @default true | 否 |
| `keyboard` | `boolean` | — | 是否允许 ESC 关闭。 @default true | 否 |
| `maskClosable` | `boolean` | — | 是否允许点击遮罩关闭。 @default true | 否 |
| `closeLabel` | `string` | — | 右上角关闭按钮的无障碍文案。 @default '关闭' | 否 |
| `class` | `string` | — | 内容容器自定义类名。 @default undefined | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/drawer/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
/**
 * `Drawer` 的公共类型（T3-08，§4.2 与 `docs/04 §2.4`）。
 *
 * 与 `Modal` 同口径：组件层只表达业务语义（受控打开 / 方向 / 尺寸 / 文案），
 * Portal / 遮罩 / 焦点陷阱 / ESC / 焦点归还全部交给 `primitives/overlay`，
 * 第三方无头库的类型与 props 形态不越过原语层。
 *
 * 方向刻意新增 `data-scui-side`，不复用既有属性：`data-scui-placement` 已被
 * App / Message 的「反馈容器出现位置」占用（六向值）、`data-scui-fixed` 是
 * Table 的固定列方向、`data-scui-direction` 表示书写方向 ltr/rtl、
 * `data-scui-orientation` 表示水平 / 垂直。一个属性名只表达一个语义（R1）。
 *
 * R3：函数型 prop（`onOpenChange`）直接声明为函数，不用 `MaybeAccessor` 包裹。
 */
import type { JSX } from 'solid-js';

/** 抽屉贴边方向，默认 `right`。 */
export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom';

/** 三档尺寸，与 Button / Pagination / Modal 的 `Size` 口径一致。 */
export type DrawerSize = 'small' | 'medium' | 'large';

export interface DrawerProps {
  /** 受控打开状态；给了就完全由调用方驱动，组件内部不回写。 */
  open?: boolean;
  /** 非受控初始状态。 @default false */
  defaultOpen?: boolean;
  /** 打开状态变化出口；ESC / 遮罩 / 关闭按钮都走这一条，请求打开不会（无内置触发按钮）。 */
  onOpenChange?: (open: boolean) => void;
  /** 标题；渲染进 `Dialog.Title`，是 `aria-labelledby` 的来源。 */
  title: JSX.Element;
  /** 正文。 */
  children?: JSX.Element;
  /**
   * 底部操作区。不传或传 `null` 时整块不渲染（不留空盒子）；
   * 与 Modal 不同，Drawer 没有默认确认 / 取消按钮，异步确认属于 Modal 的职责。
   * @default undefined
   */
  footer?: JSX.Element | null;
  /** 贴边方向。 @default 'right' */
  placement?: DrawerPlacement;
  /** 三档尺寸；左右方向控制宽度，上下方向控制高度。 @default 'medium' */
  size?: DrawerSize;
  /** 显式宽度，覆盖 `size`；数字按 px 处理。**只在 left / right 生效**。 @default undefined */
  width?: number | string;
  /** 显式高度，覆盖 `size`；数字按 px 处理。**只在 top / bottom 生效**。 @default undefined */
  height?: number | string;
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

- [基础用法与四方向](../demos/drawer-basic.md)：外部按钮受控打开；left / right / top / bottom 四个方向共用同一套浮层行为，切换方向只改贴边定位与尺寸轴。（源文件 `packages/core/src/components/drawer/demos/basic.tsx`）
- [焦点陷阱与归还](../demos/drawer-focus.md)：与 Modal 共用 primitives/overlay 的焦点管理：打开后焦点限制在抽屉内循环，ESC 关闭后回到触发按钮。（源文件 `packages/core/src/components/drawer/demos/focus.tsx`）
- [打开态与方向切换](../demos/drawer-open-state.md)：首屏即打开，用于视觉基线与弹层态 axe 扫描；弹层内可切换四个贴边方向，关闭后可用背景按钮重新打开。（源文件 `packages/core/src/components/drawer/demos/open-state.tsx`）
- [尺寸与显式宽高](../demos/drawer-size.md)：三档尺寸共用同一套贴边规则；左右方向用 width、上下方向用 height 显式覆盖，数字按 px 处理。（源文件 `packages/core/src/components/drawer/demos/size.tsx`）

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
