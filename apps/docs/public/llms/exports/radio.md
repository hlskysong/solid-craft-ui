# Radio 单选框（`solid-craft/radio`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

单选框组与独立单选，支持选项数组、整组尺寸、排列方向与字段值驱动。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/radio/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/radio/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/radio/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/radio/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/radio';
```

## API

### RadioProps

继承：`Omit<   JSX.InputHTMLAttributes<HTMLInputElement>,   'value' \| 'checked' \| 'defaultChecked' \| 'onChange' \| 'children' \| 'size' \| 'type' >`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `checked` | `MaybeAccessor<boolean>` | `undefined（非受控）` | 受控选中态；支持传值或 getter（`MaybeAccessor`）。 | 否 |
| `defaultChecked` | `MaybeAccessor<boolean>` | `false` | 非受控初始选中态；仅在挂载时读取一次。 | 否 |
| `value` | `string` | `undefined` | 选项值；在 Group 内必填，独立使用时只作为原生 `value` 透传。 | 否 |
| `onChange` | `RadioChangeHandler` | `undefined` | 选中态变更回调；第一参数是切换后的布尔值。 | 否 |
| `size` | `RadioSize` | `'medium'` | 尺寸；在 Group 内未显式给出时继承 Group 的尺寸。 | 否 |
| `status` | `RadioStatus` | `'default'` | 校验态；`error` 时输出 `data-scui-invalid="true"`。被 `<Form.Item>` 包裹时字段状态优先。 | 否 |
| `children` | `JSX.Element` | `undefined` | 文案；由 `<label>` 包裹输入控件，点击文字即可选中。无文案时须自行提供 `aria-label`。 | 否 |

### RadioGroupProps

继承：`Omit<   JSX.FieldsetHTMLAttributes<HTMLFieldSetElement>,   'onChange' \| 'children' \| 'defaultValue' >`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `value` | `MaybeAccessor<string>` | `undefined（非受控）` | 受控值（当前选中的 `value`）；支持传值或 getter。 | 否 |
| `defaultValue` | `MaybeAccessor<string>` | `''` | 非受控初始值；仅在挂载时读取一次。 | 否 |
| `onChange` | `RadioGroupChangeHandler` | `undefined` | 选中项变更回调；第一参数是选中项的 `value`。 | 否 |
| `options` | `RadioOption[]` | `undefined` | 选项写法；给出后忽略 `children`。 | 否 |
| `disabled` | `boolean` | `false` | 整组禁用。 | 否 |
| `size` | `RadioSize` | `'medium'` | 尺寸；子项未显式传 `size` 时继承本值。 | 否 |
| `orientation` | `RadioOrientation` | `'horizontal'` | 排列方向，落成 `data-scui-orientation`。 | 否 |
| `name` | `string` | `自动生成` | 原生 name；同组同源，缺省由 `createUniqueId()` 生成（SSR 稳定）。 | 否 |
| `children` | `JSX.Element` | `undefined` | 手写子项写法：直接放 `<Radio value="...">...</Radio>`。 | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/radio/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
import type { JSX } from 'solid-js';

import type { MaybeAccessor } from '../../utils/resolve-value';
import type {
  SelectionChangeEvent,
  SelectionChangeHandler,
  SelectionOption,
  SelectionOrientation,
  SelectionSize,
  SelectionStatus,
} from '../selection/selection-types';

/** 尺寸口径与全局一致：只有 small / medium / large，不存在 md / sm。 */
export type RadioSize = SelectionSize;

/** 校验态。与 `FieldStatus` 同值域，避免控件与表单出现两套状态词。 */
export type RadioStatus = SelectionStatus;

/** `RadioGroup` 的排列方向。 */
export type RadioOrientation = SelectionOrientation;

/** `RadioGroup.options` 的选项。 */
export type RadioOption = SelectionOption;

/** `Radio` 的变更事件。 */
export type RadioChangeEvent = SelectionChangeEvent<HTMLInputElement>;

/** `Radio` 的值变更回调；第一参数是切换后的布尔值。 */
export type RadioChangeHandler = SelectionChangeHandler<HTMLInputElement, boolean>;

/** `RadioGroup` 的值变更回调；第一参数是选中项的 `value`。 */
export type RadioGroupChangeHandler = SelectionChangeHandler<HTMLInputElement, string>;

/**
 * `Radio` 的入参。原生属性照常透传，仅覆盖与前者语义冲突的项。
 *
 * 在 `RadioGroup` 内时由 Group 接管 `checked`；独立使用时走自己的
 * `checked` / `defaultChecked`，并由 `createUniqueId()` 生成独立 name，
 * 避免同页多个独立 radio 意外互相排斥。
 */
export interface RadioProps extends Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'checked' | 'defaultChecked' | 'onChange' | 'children' | 'size' | 'type'
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
   * 选项值；在 Group 内必填，独立使用时只作为原生 `value` 透传。
   * @default undefined
   */
  value?: string;
  /**
   * 选中态变更回调；第一参数是切换后的布尔值。
   * @default undefined
   */
  onChange?: RadioChangeHandler;
  /**
   * 尺寸；在 Group 内未显式给出时继承 Group 的尺寸。
   * @default 'medium'
   */
  size?: RadioSize;
  /**
   * 校验态；`error` 时输出 `data-scui-invalid="true"`。被 `<Form.Item>` 包裹时字段状态优先。
   * @default 'default'
   */
  status?: RadioStatus;
  /**
   * 文案；由 `<label>` 包裹输入控件，点击文字即可选中。无文案时须自行提供 `aria-label`。
   * @default undefined
   */
  children?: JSX.Element;
}

/** `RadioGroup` 的入参。`options` 与 `children` 二选一，`options` 优先。 */
export interface RadioGroupProps extends Omit<
  JSX.FieldsetHTMLAttributes<HTMLFieldSetElement>,
  'onChange' | 'children' | 'defaultValue'
> {
  /**
   * 受控值（当前选中的 `value`）；支持传值或 getter。
   * @default undefined（非受控）
   */
  value?: MaybeAccessor<string>;
  /**
   * 非受控初始值；仅在挂载时读取一次。
   * @default ''
   */
  defaultValue?: MaybeAccessor<string>;
  /**
   * 选中项变更回调；第一参数是选中项的 `value`。
   * @default undefined
   */
  onChange?: RadioGroupChangeHandler;
  /**
   * 选项写法；给出后忽略 `children`。
   * @default undefined
   */
  options?: RadioOption[];
  /**
   * 整组禁用。
   * @default false
   */
  disabled?: boolean;
  /**
   * 尺寸；子项未显式传 `size` 时继承本值。
   * @default 'medium'
   */
  size?: RadioSize;
  /**
   * 排列方向，落成 `data-scui-orientation`。
   * @default 'horizontal'
   */
  orientation?: RadioOrientation;
  /**
   * 原生 name；同组同源，缺省由 `createUniqueId()` 生成（SSR 稳定）。
   * @default 自动生成
   */
  name?: string;
  /**
   * 手写子项写法：直接放 `<Radio value="...">...</Radio>`。
   * @default undefined
   */
  children?: JSX.Element;
}
```

## 相关 Demo（完整源码见链接页）

- [基础用法](../demos/radio-basic.md)：独立单选框、三档尺寸、禁用态与校验态。（源文件 `packages/core/src/components/radio/demos/basic.tsx`）
- [单选框组](../demos/radio-group.md)：选项数组与手写子项两种写法，并支持垂直排列。（源文件 `packages/core/src/components/radio/demos/group.tsx`）
- [受控状态](../demos/radio-state.md)：受控 value 配合 onChange 回显，整组禁用时保持当前选中项。（源文件 `packages/core/src/components/radio/demos/state.tsx`）

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
