# Spin 加载中（`solid-craft/spin`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

独立转圈与包裹遮罩两种形态；delay 延迟显示避免短请求闪烁，遮罩用 color-mix 适配深浅主题，转圈恒带可读文案。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/spin/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/spin/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/spin/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/spin/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/spin';
```

## API

### SpinProps

继承：`Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children' \| 'style'>`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `spinning` | `boolean` | `true` | 是否加载中。 | 否 |
| `delay` | `number` | `0` | 延迟显示毫秒数。小于 0 按 0 处理（立即显示）。 | 否 |
| `size` | `SpinSize` | `'medium'` | 尺寸档。 | 否 |
| `tip` | `JSX.Element` | `undefined` | 加载文案。不传时读屏仍会读到视觉隐藏的「加载中」，避免出现无声转圈。 | 否 |
| `children` | `JSX.Element` | `undefined` | 被包裹的内容。传了它才进入包裹模式（遮罩覆盖在内容上）， 不传则渲染独立转圈。 | 否 |
| `style` | `string` | — | 根节点样式；与 `class` 一样合并而非覆盖。 | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/spin/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
/**
 * `Spin` 的公共类型（T3-05）。
 *
 * 范围按 `docs/04 §4` 的 P0 条目「包裹 / 独立、延迟显示」：
 * 独立形态是一个自带 `role="status"` 的转圈；包裹形态在内容上层盖一层遮罩，
 * 并给容器 `aria-busy`。不做全屏 loading、不做进度百分比 —— 那是 `Progress` 的事。
 *
 * `delay` 的语义（`docs/08 §4.2` T3-05 验收列要求「延迟显示可测」）：
 * **从 `spinning` 变为 true 起算**，未到时间不渲染遮罩；期间若 `spinning` 转回 false，
 * 定时器立即取消，遮罩一次都不出现 —— 避免「请求 80ms 就回来、遮罩闪一下」的抖动。
 *
 * R3：`tip` / `children` 是节点，不套 `MaybeAccessor`。
 */
import type { JSX } from 'solid-js';

/** 尺寸档：只影响转圈直径与描边粗细。 */
export type SpinSize = 'small' | 'medium' | 'large';

/** `<Spin>` 入参。原生属性照常透传到根节点。 */
export interface SpinProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children' | 'style'> {
  /**
   * 是否加载中。
   * @default true
   */
  spinning?: boolean;
  /**
   * 延迟显示毫秒数。小于 0 按 0 处理（立即显示）。
   * @default 0
   */
  delay?: number;
  /**
   * 尺寸档。
   * @default 'medium'
   */
  size?: SpinSize;
  /**
   * 加载文案。不传时读屏仍会读到视觉隐藏的「加载中」，避免出现无声转圈。
   * @default undefined
   */
  tip?: JSX.Element;
  /**
   * 被包裹的内容。传了它才进入包裹模式（遮罩覆盖在内容上），
   * 不传则渲染独立转圈。
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

- [独立使用](../demos/spin-basic.md)：不传 children 时是独立转圈；三档尺寸 + 可选文案。（源文件 `packages/core/src/components/spin/demos/basic.tsx`）
- [延迟显示](../demos/spin-delay.md)：delay=400ms：请求很快回来时一次都不闪；超过 400ms 才出遮罩，避免短请求的闪烁抖动。（源文件 `packages/core/src/components/spin/demos/delay.tsx`）
- [包裹内容](../demos/spin-wrap.md)：遮罩盖在内容上层，容器同步 aria-busy；关掉后内容原样可见，不做透明度衰减。（源文件 `packages/core/src/components/spin/demos/wrap.tsx`）

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
