# Skeleton 骨架屏（`solid-craft/skeleton`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

text / card / table / button / avatar 五种形状；行块高直接引用正文行高与按钮、表格的尺寸 token，骨架与真实内容同高，切换不抖动。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/skeleton/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/skeleton/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/skeleton/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/skeleton/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/skeleton';
```

## API

### SkeletonProps

继承：`Omit<   JSX.HTMLAttributes<HTMLDivElement>,   'children' \| 'style' >`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `variant` | `SkeletonVariant` | `'text'` | 形状。 | 否 |
| `rows` | `number` | `3` | 行数，只对 `text` / `table` 生效；小于 1 的值按 1 处理。 | 否 |
| `active` | `boolean` | `false` | 微光动画。开启后仍尊重 `prefers-reduced-motion: reduce`（系统要求减动效时静止）。 | 否 |
| `loading` | `boolean` | `false` | 包裹模式开关，**只有传了 `children` 才有意义**： `true` 显示骨架、`false` 显示内容；不传 `children` 时恒显示骨架。 | 否 |
| `children` | `JSX.Element` | `undefined` | 被包裹的真实内容。传了它才进入包裹模式（外层多一个 `aria-busy` 容器）。 | 否 |
| `style` | `string` | — | 根节点样式；与 `class` 一样合并而非覆盖。 | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/skeleton/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
/**
 * `Skeleton` 的公共类型（T3-05）。
 *
 * 范围按 `docs/04 §4` 的 P0 条目「文本 / 表格 / 卡片骨架」：五种形状 + 包裹模式。
 * 形状用 `variant` 一个字符串开关，而不是 `title` / `avatar` / `paragraph` 三个布尔
 * ——三个布尔能拼出不存在的组合（头像 + 表格），字符串枚举不会（R2 = A）。
 *
 * 硬性约束来自 `docs/08 §4.2` T3-05 验收列：**骨架与真实内容同尺寸、切换不抖动**。
 * 因此每一个形状的块高都直接引用被替代组件的尺寸 token（见 `skeleton.scss`），
 * 不写裸像素；文本骨架的行块高恒等于 `--scui-line-height-md`，三行骨架 = 三行文本。
 *
 * R3：`children` 是节点，不套 `MaybeAccessor`。
 */
import type { JSX } from 'solid-js';

/**
 * 骨架形状。
 * - `text`：段落，`rows` 行，末行收窄；
 * - `card`：卡片，标题条 + 正文行；
 * - `table`：表格，表头行 + `rows` 行，与 Table 默认密度的行高一致；
 * - `button`：单条，高度取按钮中年档；
 * - `avatar`：圆形，尺寸取常用头像档。
 */
export type SkeletonVariant = 'text' | 'card' | 'table' | 'button' | 'avatar';

/** `<Skeleton>` 入参。原生属性照常透传到根节点。 */
export interface SkeletonProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'children' | 'style'
> {
  /**
   * 形状。
   * @default 'text'
   */
  variant?: SkeletonVariant;
  /**
   * 行数，只对 `text` / `table` 生效；小于 1 的值按 1 处理。
   * @default 3
   */
  rows?: number;
  /**
   * 微光动画。开启后仍尊重 `prefers-reduced-motion: reduce`（系统要求减动效时静止）。
   * @default false
   */
  active?: boolean;
  /**
   * 包裹模式开关，**只有传了 `children` 才有意义**：
   * `true` 显示骨架、`false` 显示内容；不传 `children` 时恒显示骨架。
   * @default false
   */
  loading?: boolean;
  /**
   * 被包裹的真实内容。传了它才进入包裹模式（外层多一个 `aria-busy` 容器）。
   * @default undefined
   */
  children?: JSX.Element;
  /**
   * 根节点样式；与 `class` 一样合并而非覆盖。
   */
  style?: string;
}
```

## 相关 Demo（完整源码见链接页）

- [微光动画](../demos/skeleton-active.md)：active 开启微光；系统开启「减弱动效」时自动静止，不靠 JS 判断。（源文件 `packages/core/src/components/skeleton/demos/active.tsx`）
- [五种形状](../demos/skeleton-basic.md)：text / card / table / button / avatar；行数与形状都走单一 variant 开关。（源文件 `packages/core/src/components/skeleton/demos/basic.tsx`）
- [包裹与同高](../demos/skeleton-loading.md)：loading 切换骨架与内容；右侧对照区把三行骨架和三行真实文本并排放，高度必须一致。（源文件 `packages/core/src/components/skeleton/demos/loading.tsx`）

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
