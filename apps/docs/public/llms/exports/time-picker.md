# TimePicker 时间选择（`solid-craft/time-picker`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

独立时间选择：时 / 分 / 秒列、12 / 24 小时制、min·max 与 disabledTime 禁用；值为 24 小时制 HH:mm，也可由 DatePicker showTime 复用同一面板。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/time-picker/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/time-picker/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/time-picker/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/time-picker/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/time-picker';
```

## API

### TimeValue

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `hour` | `number` | — | 小时 0–23。 | 是 |
| `minute` | `number` | — | 分钟 0–59。 | 是 |
| `second` | `number` | — | 秒 0–59（无秒模式下恒为 0）。 | 是 |

### TimeLimits

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `min` | `string` | — | 最小可选时间（含），`HH:mm`。 | 否 |
| `max` | `string` | — | 最大可选时间（含），`HH:mm`。 | 否 |
| `disabledTime` | `(time: TimeValue) => boolean` | — | 自定义禁用判定。 | 否 |

### TimePickerProps

继承：`Omit<   JSX.HTMLAttributes<HTMLDivElement>,   'onChange' \| 'onInput' >`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `value` | `MaybeAccessor<string>` | `undefined` | 受控值（24 小时制 `HH:mm` / `HH:mm:ss`）；支持传值或 getter。 与 `defaultValue` 二选一，传了即为受控。 | 否 |
| `defaultValue` | `MaybeAccessor<string>` | `undefined` | 非受控初始值；仅在挂载时读取一次。 | 否 |
| `onChange` | `TimePickerChangeHandler` | `undefined` | 选中回调；参数是 24 小时制 ISO 字符串，清空时为 `''`。 | 否 |
| `showSeconds` | `boolean` | `false` | 是否带秒（值格式 `HH:mm:ss`）。 | 否 |
| `hour12` | `MaybeAccessor<boolean>` | `false` | 是否用 12 小时制显示（多一列「上午 / 下午」），值仍是 24 小时制。 | 否 |
| `format` | `string` | `'HH:mm'` | 显示格式，token 子集 `HH` / `H` / `mm` / `m` / `ss` / `s` / `A`。 | 否 |
| `min` | `MaybeAccessor<string>` | `undefined` | 最小可选时间（含），`HH:mm`。 | 否 |
| `max` | `MaybeAccessor<string>` | `undefined` | 最大可选时间（含），`HH:mm`。 | 否 |
| `disabledTime` | `(time: TimeValue) => boolean` | `undefined` | 自定义禁用判定；与 `min` / `max` 叠加生效。 | 否 |
| `placeholder` | `string` | `'HH:mm'` | 输入框占位文案。 | 否 |
| `size` | `TimePickerSize` | `'medium'` | 尺寸。 | 否 |
| `status` | `TimePickerStatus` | `'default'` | 校验态；被 `<Form.Item>` 包裹时默认跟随字段状态。 | 否 |
| `disabled` | `MaybeAccessor<boolean>` | `false` | 禁用；与 `<Form disabled>` 取或。 | 否 |
| `allowClear` | `boolean` | `false` | 是否显示清除按钮（有值时出现）。 | 否 |
| `clearLabel` | `string` | `'清除'` | 清除按钮的无障碍文案。 | 否 |
| `okLabel` | `string` | `'确定'` | 浮层「确定」按钮文案。 | 否 |
| `name` | `string` | `undefined` | 表单字段名（原生 `input` 的 `name`）。 | 否 |
| `class` | `string` | `undefined` | 附加类名。 | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/time-picker/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
/**
 * `TimePicker` 的公共类型（T4-13）。
 *
 * 值口径固定为 24 小时制 ISO `HH:mm`；`showSeconds` 为真时是 `HH:mm:ss`。
 * 12 小时制（`hour12`）只改变面板显示与「上午 / 下午」列，不改变值。
 * 内核不依赖第三方日期库，也不产生任何「当前时间」默认值（SSR 稳定）。
 */
import type { JSX } from 'solid-js';

import type { MaybeAccessor } from '../../utils/resolve-value';

/** 尺寸口径与全局一致：只有 `small` / `medium` / `large`。 */
export type TimePickerSize = 'small' | 'medium' | 'large';

/** 校验态。与 `FieldStatus` 同值域，避免控件与表单出现两套状态词。 */
export type TimePickerStatus = 'default' | 'error';

/** 时间的结构性最小集；无 `toString`，避免要求消费方造方法。 */
export interface TimeValue {
  /** 小时 0–23。 */
  readonly hour: number;
  /** 分钟 0–59。 */
  readonly minute: number;
  /** 秒 0–59（无秒模式下恒为 0）。 */
  readonly second: number;
}

/** 时间上下界与自定义禁用规则。 */
export interface TimeLimits {
  /** 最小可选时间（含），`HH:mm`。 */
  min?: string;
  /** 最大可选时间（含），`HH:mm`。 */
  max?: string;
  /** 自定义禁用判定。 */
  disabledTime?: (time: TimeValue) => boolean;
}

/** 值变更回调；空字符串表示已清空。 */
export type TimePickerChangeHandler = (time: string) => void;

/** 面板列标识；`meridiem` 只在 12 小时制出现。 */
export type TimeColumn = 'meridiem' | 'hour' | 'minute' | 'second';

/** `TimePicker` 的入参。原生 `div` 属性照常透传，仅覆盖与控件语义冲突的项。 */
export interface TimePickerProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'onInput'
> {
  /**
   * 受控值（24 小时制 `HH:mm` / `HH:mm:ss`）；支持传值或 getter。
   * 与 `defaultValue` 二选一，传了即为受控。
   * @default undefined
   */
  value?: MaybeAccessor<string>;
  /**
   * 非受控初始值；仅在挂载时读取一次。
   * @default undefined
   */
  defaultValue?: MaybeAccessor<string>;
  /**
   * 选中回调；参数是 24 小时制 ISO 字符串，清空时为 `''`。
   * @default undefined
   */
  onChange?: TimePickerChangeHandler;
  /**
   * 是否带秒（值格式 `HH:mm:ss`）。
   * @default false
   */
  showSeconds?: boolean;
  /**
   * 是否用 12 小时制显示（多一列「上午 / 下午」），值仍是 24 小时制。
   * @default false
   */
  hour12?: MaybeAccessor<boolean>;
  /**
   * 显示格式，token 子集 `HH` / `H` / `mm` / `m` / `ss` / `s` / `A`。
   * @default 'HH:mm'
   */
  format?: string;
  /**
   * 最小可选时间（含），`HH:mm`。
   * @default undefined
   */
  min?: MaybeAccessor<string>;
  /**
   * 最大可选时间（含），`HH:mm`。
   * @default undefined
   */
  max?: MaybeAccessor<string>;
  /**
   * 自定义禁用判定；与 `min` / `max` 叠加生效。
   * @default undefined
   */
  disabledTime?: (time: TimeValue) => boolean;
  /**
   * 输入框占位文案。
   * @default 'HH:mm'
   */
  placeholder?: string;
  /**
   * 尺寸。
   * @default 'medium'
   */
  size?: TimePickerSize;
  /**
   * 校验态；被 `<Form.Item>` 包裹时默认跟随字段状态。
   * @default 'default'
   */
  status?: TimePickerStatus;
  /**
   * 禁用；与 `<Form disabled>` 取或。
   * @default false
   */
  disabled?: MaybeAccessor<boolean>;
  /**
   * 是否显示清除按钮（有值时出现）。
   * @default false
   */
  allowClear?: boolean;
  /**
   * 清除按钮的无障碍文案。
   * @default '清除'
   */
  clearLabel?: string;
  /**
   * 浮层「确定」按钮文案。
   * @default '确定'
   */
  okLabel?: string;
  /**
   * 输入框无障碍名称；被 `<Form.Item>` 包裹时由字段 label 接管。
   * @default '时间'
   */
  'aria-label'?: string;
  /**
   * 表单字段名（原生 `input` 的 `name`）。
   * @default undefined
   */
  name?: string;
  /**
   * 附加类名。
   * @default undefined
   */
  class?: string;
}
```

## 相关 Demo（完整源码见链接页）

- [基础用法](../demos/time-picker-basic.md)：非受控与受控两种取值方式、清除与三档尺寸；值为 24 小时制 HH:mm。（源文件 `packages/core/src/components/time-picker/demos/basic.tsx`）
- [可选范围](../demos/time-picker-constraints.md)：min / max 闭区间与 disabledTime 自定义禁用；手输越界同样被拒绝。（源文件 `packages/core/src/components/time-picker/demos/constraints.tsx`）
- [格式与显示](../demos/time-picker-format.md)：12 / 24 小时制、带秒、自定义显示格式；显示变化不影响 24 小时制的值。（源文件 `packages/core/src/components/time-picker/demos/format.tsx`）

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
