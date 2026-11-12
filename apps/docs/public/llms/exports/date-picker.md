# DatePicker 日期选择（`solid-craft/date-picker`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

单选日期：min / max / disabledDate、自定义格式、中文 locale 与键盘导航；日期运算走 @internationalized/date，SSR 不取当前时间。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/date-picker/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/date-picker/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/date-picker/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/date-picker/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/date-picker';
```

## API

### DatePickerProps

继承：`Omit<   JSX.HTMLAttributes<HTMLDivElement>,   'onChange' \| 'onInput' >`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `value` | `MaybeAccessor<string>` | `undefined` | 受控值（ISO `YYYY-MM-DD`）；支持传值或 getter。 与 `defaultValue` 二选一，传了即为受控。 | 否 |
| `defaultValue` | `MaybeAccessor<string>` | `undefined` | 非受控初始值；仅在挂载时读取一次。 | 否 |
| `onChange` | `DatePickerChangeHandler` | `undefined` | 选中回调；参数是 ISO 字符串，清空时为 `''`。 | 否 |
| `min` | `MaybeAccessor<string>` | `undefined` | 最小可选日期（含），ISO `YYYY-MM-DD`；越界日期在日历里禁用，手输也会被拒。 | 否 |
| `max` | `MaybeAccessor<string>` | `undefined` | 最大可选日期（含），ISO `YYYY-MM-DD`。 | 否 |
| `disabledDate` | `(date: DatePickerDateValue) => boolean` | `undefined` | 自定义禁用判定；与 `min` / `max` 叠加生效。 | 否 |
| `format` | `string` | `'YYYY-MM-DD'` | 显示格式，token 子集 `YYYY` / `MM` / `M` / `DD` / `D`。 | 否 |
| `weekStartsOn` | `DatePickerWeekStart` | `'mon'` | 周首日。 | 否 |
| `placeholder` | `string` | `'YYYY-MM-DD'` | 输入框占位文案。 | 否 |
| `size` | `DatePickerSize` | `'medium'` | 尺寸。 | 否 |
| `status` | `DatePickerStatus` | `'default'` | 校验态；被 `<Form.Item>` 包裹时默认跟随字段状态。 | 否 |
| `disabled` | `MaybeAccessor<boolean>` | `false` | 禁用；与 `<Form disabled>` 取或。 | 否 |
| `allowClear` | `boolean` | `false` | 是否显示清除按钮（有值时出现）。 | 否 |
| `clearLabel` | `string` | `'清除'` | 清除按钮的无障碍文案。 | 否 |
| `todayLabel` | `string` | `'今天'` | 「今天」按钮文案。 | 否 |
| `name` | `string` | `undefined` | 表单字段名（原生 `input` 的 `name`）。 | 否 |
| `class` | `string` | `undefined` | 附加类名。 | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/date-picker/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
/**
 * `DatePicker` 的公共类型（T2-10）。
 *
 * 对外值一律是 ISO `YYYY-MM-DD` 字符串（与 R2 = A 的「字符串值」口径一致），
 * `disabledDate` 收到的是本地结构性类型 `DatePickerDateValue` —— 公共 `.d.ts`
 * 不出现 `@internationalized/date` 包名（`check:exports` 第 6 条），换日期库不破坏消费方。
 *
 * 本轮范围按 `docs/08 §4.1` 的 T2-10 验收列：单选 + `min` / `max` / `disabledDate` +
 * `format` + 中文 locale + 键盘 + `editing` 状态机 + SSR 不取当前时间。
 * `showTime` / 时区 / 月年快选 / 快捷选项属 `docs/04 §5.4` 的 P1，RangePicker 单独排期（T2-11）。
 */
import type { JSX } from 'solid-js';

import type { MaybeAccessor } from '../../utils/resolve-value';
import type { DateValue, WeekStart } from './calendar';

/** 尺寸口径与全局一致：只有 `small` / `medium` / `large`，不存在 `md` / `sm`。 */
export type DatePickerSize = 'small' | 'medium' | 'large';

/** 校验态。与 `FieldStatus` 同值域，避免控件与表单出现两套状态词。 */
export type DatePickerStatus = 'default' | 'error';

/** 周首日。`'mon'` 周一、`'sun'` 周日。 */
export type DatePickerWeekStart = WeekStart;

/**
 * 传给 `disabledDate` 的日期值。
 *
 * 只含年 / 月 / 日与 ISO 字符串，够写绝大多数禁用规则；需要完整日期 API 时
 * 在业务侧用 `@internationalized/date` 的 `parseDate(iso)` 自行取。
 */
export type DatePickerDateValue = DateValue;

/** 值变更回调；空字符串表示已清空。 */
export type DatePickerChangeHandler = (iso: string) => void;

/**
 * `DatePicker` 的入参。原生 `div` 属性照常透传，仅覆盖与控件语义冲突的项。
 */
export interface DatePickerProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'onInput'
> {
  /**
   * 受控值（ISO `YYYY-MM-DD`）；支持传值或 getter。
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
   * 选中回调；参数是 ISO 字符串，清空时为 `''`。
   * @default undefined
   */
  onChange?: DatePickerChangeHandler;
  /**
   * 最小可选日期（含），ISO `YYYY-MM-DD`；越界日期在日历里禁用，手输也会被拒。
   * @default undefined
   */
  min?: MaybeAccessor<string>;
  /**
   * 最大可选日期（含），ISO `YYYY-MM-DD`。
   * @default undefined
   */
  max?: MaybeAccessor<string>;
  /**
   * 自定义禁用判定；与 `min` / `max` 叠加生效。
   * @default undefined
   */
  disabledDate?: (date: DatePickerDateValue) => boolean;
  /**
   * 显示格式，token 子集 `YYYY` / `MM` / `M` / `DD` / `D`。
   * @default 'YYYY-MM-DD'
   */
  format?: string;
  /**
   * 周首日。
   * @default 'mon'
   */
  weekStartsOn?: DatePickerWeekStart;
  /**
   * 输入框占位文案。
   * @default 'YYYY-MM-DD'
   */
  placeholder?: string;
  /**
   * 尺寸。
   * @default 'medium'
   */
  size?: DatePickerSize;
  /**
   * 校验态；被 `<Form.Item>` 包裹时默认跟随字段状态。
   * @default 'default'
   */
  status?: DatePickerStatus;
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
   * 「今天」按钮文案。
   * @default '今天'
   */
  todayLabel?: string;
  /**
   * 输入框无障碍名称；被 `<Form.Item>` 包裹时由字段 label 接管。
   * @default '日期'
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

- [基础用法](../demos/date-picker-basic.md)：非受控与受控两种取值方式、显示格式、清除与三档尺寸。（源文件 `packages/core/src/components/date-picker/demos/basic.tsx`）
- [可选范围](../demos/date-picker-constraints.md)：min / max 闭区间、disabledDate 自定义禁用，以及错误与禁用态。（源文件 `packages/core/src/components/date-picker/demos/constraints.tsx`）
- [格式与尺寸](../demos/date-picker-format.md)：format 的 token 子集、三档尺寸与清除按钮。（源文件 `packages/core/src/components/date-picker/demos/format.tsx`）

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
