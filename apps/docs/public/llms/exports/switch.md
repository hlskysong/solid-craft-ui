# Switch 开关（`solid-craft/switch`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

带开关语义的二态控件，支持三档尺寸、受控值与原生键盘切换。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/switch/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/switch/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/switch/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/switch/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/switch';
```

## API

### SwitchProps

继承：`Omit<   JSX.InputHTMLAttributes<HTMLInputElement>,   \| 'value'   \| 'checked'   \| 'defaultChecked'   \| 'onChange'   \| 'children'   \| 'size'   \| 'type'   \| 'role'   \| 'indeterminate' >`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `checked` | `MaybeAccessor<boolean>` | `undefined（非受控）` | 受控选中态；支持传值或 getter（`MaybeAccessor`）。 | 否 |
| `defaultChecked` | `MaybeAccessor<boolean>` | `false` | 非受控初始选中态；仅在挂载时读取一次。 | 否 |
| `onChange` | `SwitchChangeHandler` | `undefined` | 选中态变更回调；第一参数是切换后的布尔值。 | 否 |
| `size` | `SwitchSize` | `'medium'` | 尺寸。 | 否 |
| `status` | `SwitchStatus` | `'default'` | 校验态；`error` 时输出 `data-scui-invalid="true"`。被 `<Form.Item>` 包裹时字段状态优先。 | 否 |
| `children` | `JSX.Element` | `undefined` | 文案；由 `<label>` 包裹输入控件，点击文字即可切换。无文案时须自行提供 `aria-label`。 | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/switch/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
import type { JSX } from 'solid-js';

import type { MaybeAccessor } from '../../utils/resolve-value';
import type {
  SelectionChangeEvent,
  SelectionChangeHandler,
  SelectionSize,
  SelectionStatus,
} from '../selection/selection-types';

/** 尺寸口径与全局一致：只有 small / medium / large，不存在 md / sm。 */
export type SwitchSize = SelectionSize;

/** 校验态。与 `FieldStatus` 同值域，避免控件与表单出现两套状态词。 */
export type SwitchStatus = SelectionStatus;

/** `Switch` 的变更事件。 */
export type SwitchChangeEvent = SelectionChangeEvent<HTMLInputElement>;

/** `Switch` 的值变更回调；第一参数是切换后的布尔值。 */
export type SwitchChangeHandler = SelectionChangeHandler<HTMLInputElement, boolean>;

/**
 * `Switch` 的入参。原生属性照常透传，仅覆盖与前者语义冲突的项。
 *
 * 语义是 `role="switch"` 的原生 checkbox：读屏读作「开关」而不是「复选框」，
 * `aria-checked` 恒输出两态；键盘 Space 由浏览器原生承担。
 */
export interface SwitchProps extends Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  | 'value'
  | 'checked'
  | 'defaultChecked'
  | 'onChange'
  | 'children'
  | 'size'
  | 'type'
  | 'role'
  | 'indeterminate'
> {
  /**
   * 受控选中态；支持传值或 getter（`MaybeAccessor`）。
   * @default undefined（非受控）
   */
  checked?: MaybeAccessor<boolean>;
  /**
   * 非受控初始选中态；仅在挂载时读取一次。
   * @default false
   */
  defaultChecked?: MaybeAccessor<boolean>;
  /**
   * 选中态变更回调；第一参数是切换后的布尔值。
   * @default undefined
   */
  onChange?: SwitchChangeHandler;
  /**
   * 尺寸。
   * @default 'medium'
   */
  size?: SwitchSize;
  /**
   * 校验态；`error` 时输出 `data-scui-invalid="true"`。被 `<Form.Item>` 包裹时字段状态优先。
   * @default 'default'
   */
  status?: SwitchStatus;
  /**
   * 文案；由 `<label>` 包裹输入控件，点击文字即可切换。无文案时须自行提供 `aria-label`。
   * @default undefined
   */
  children?: JSX.Element;
}
```

## 相关 Demo（完整源码见链接页）

- [基础用法](../demos/switch-basic.md)：开与关两种状态，可带文案；无文案时必须提供 aria-label。（源文件 `packages/core/src/components/switch/demos/basic.tsx`）
- [尺寸与禁用](../demos/switch-size.md)：small / medium / large 三档尺寸，以及禁用态下的开与关。（源文件 `packages/core/src/components/switch/demos/size.tsx`）
- [受控状态](../demos/switch-state.md)：用 createSignal 控制开关状态，onChange 回显，并演示校验态。（源文件 `packages/core/src/components/switch/demos/state.tsx`）

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
