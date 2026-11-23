# Tag 标签（`solid-craft/tag`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

五档配色沿用 Button 的 data-scui-color，四形态对齐 TDesign 的 data-scui-variant（dark / light / outline / light-outline）；边框复用存在即真的 data-scui-bordered；可关闭按钮恒带无障碍文案，非受控关闭与 Alert 同口径。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/tag/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/tag/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/tag/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/tag/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/tag';
```

## API

### TagProps

继承：`Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'children' \| 'color'>`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `color` | `TagColor` | `'neutral'` | 配色，恒输出为 `data-scui-color`。 | 否 |
| `variant` | `TagVariant` | `'dark'` | 形态，恒输出为 `data-scui-variant`，默认 `dark`。 `outline` / `light-outline` 自带彩边；`dark` / `light` 无边框。 | 否 |
| `bordered` | `boolean` | `false` | 是否显示外边框；为真时输出存在即真的 `data-scui-bordered`。 边框恒占 1px（无边框时用透明色），切换不抖动。 | 否 |
| `closable` | `boolean` | `false` | 是否可关闭；为真时尾部多一个带 `aria-label` 的按钮。 | 否 |
| `closeLabel` | `string` | — | 关闭按钮的无障碍文案。 @default '关闭标签' | 否 |
| `onClose` | `() => void` | — | 点击关闭后触发；组件内部同时移除自身 DOM（与 Alert 一致的非受控口径）。 | 否 |
| `children` | `JSX.Element` | — | 标签文案。 | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/tag/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
/**
 * `Tag` 的公共类型（T3-10，§4.2 与 `docs/04 §2.3`「颜色、可关闭、边框」）。
 *
 * 颜色**复用** `data-scui-color`：Button 早已输出这个属性，取值也和
 * `demos/shared.tsx` 的 `COLORS` 完全同口径（primary / neutral / success /
 * warning / danger）。刻意不复用 `data-scui-kind`（那是「一条反馈自身的语义
 * 类型」，取值 info/success/warning/error/loading）或 `data-scui-variant`
 * （那是 Skeleton 的骨架形状）——同名不同义会违反 R1。
 *
 * 边框复用 `data-scui-bordered`（Table 已登记的「存在即真」口径）；可关闭只是
 * 结构开关，不需要新状态属性。范围严格按 §4.2 三项，不加 size / disabled 等
 * 冻结面没要求的开关。
 *
 * R3：函数型 prop（`onClose`）直接声明为函数，不用 `MaybeAccessor` 包裹。
 */
import type { JSX } from 'solid-js';

/** 标签配色，默认 `neutral`（对应 TDesign 的 `default`）；与 Button 的 `data-scui-color` 同一套取值。 */
export type TagColor = 'primary' | 'neutral' | 'success' | 'warning' | 'danger';

/**
 * 标签形态，默认 `dark`（TDesign 口径）：
 * - `dark` 实底反白字；
 * - `light` 浅底彩字；
 * - `outline` 白底彩边彩字；
 * - `light-outline` 浅底彩边彩字。
 *
 * 走 `data-scui-variant`，与 Skeleton / Tabs 的「视觉变体」同一语义（R1）。
 */
export type TagVariant = 'dark' | 'light' | 'outline' | 'light-outline';

/** `<Tag>` 入参。原生属性照常透传到根节点。 */
export interface TagProps extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'children' | 'color'> {
  /**
   * 配色，恒输出为 `data-scui-color`。
   * @default 'neutral'
   */
  color?: TagColor;
  /**
   * 形态，恒输出为 `data-scui-variant`，默认 `dark`。
   * `outline` / `light-outline` 自带彩边；`dark` / `light` 无边框。
   * @default 'dark'
   */
  variant?: TagVariant;
  /**
   * 是否显示外边框；为真时输出存在即真的 `data-scui-bordered`。
   * 边框恒占 1px（无边框时用透明色），切换不抖动。
   * @default false
   */
  bordered?: boolean;
  /**
   * 是否可关闭；为真时尾部多一个带 `aria-label` 的按钮。
   * @default false
   */
  closable?: boolean;
  /** 关闭按钮的无障碍文案。 @default '关闭标签' */
  closeLabel?: string;
  /** 点击关闭后触发；组件内部同时移除自身 DOM（与 Alert 一致的非受控口径）。 */
  onClose?: () => void;
  /** 标签文案。 */
  children?: JSX.Element;
}
```

## 相关 Demo（完整源码见链接页）

- [五种配色 × 四种形态](../demos/tag-basic.md)：配色走 data-scui-color（neutral 对应 TDesign 的 default，高饱和色只落在文字或底色）；形态走 data-scui-variant，对齐 dark / light / outline / light-outline 四档。（源文件 `packages/core/src/components/tag/demos/basic.tsx`）
- [边框开关](../demos/tag-bordered.md)：data-scui-bordered 存在即真，在深色形态上叠加彩边；outline / light-outline 形态自带彩边，无需再开。边框恒占 1px，开关前后不抖动。（源文件 `packages/core/src/components/tag/demos/bordered.tsx`）
- [可关闭](../demos/tag-closable.md)：关闭是非受控的：组件自己移除 DOM 并发一次 onClose。关闭按钮恒带 aria-label，可用 closeLabel 覆盖。（源文件 `packages/core/src/components/tag/demos/closable.tsx`）

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
