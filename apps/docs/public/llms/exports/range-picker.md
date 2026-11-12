# RangePicker 日期范围（`solid-craft/range-picker`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

双输入框日期区间：选起点后悬停预览、反向点击自动归一化、键盘两段落点与焦点移交；同日 / 跨月 / 跨年边界与 min·max 约束共用一套日期内核。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/range-picker/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/range-picker/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/range-picker/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/range-picker/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/range-picker';
```

## API

### RangePickerProps

继承：`Omit<   JSX.FieldsetHTMLAttributes<HTMLFieldSetElement>,   // `disabled` 必须显式剔除：原生 fieldset 的 `disabled` 是静态 boolean，而这里要收   // `MaybeAccessor<boolean>`（响应式契约）；不剔除会直接 TS2430。   'onChange' \| 'onInput' \| 'disabled' >`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `value` | `MaybeAccessor<RangePickerValue \| null>` | `undefined` | 受控值（`[start, end]` ISO）；支持传值或 getter。传了即为受控。 | 否 |
| `defaultValue` | `MaybeAccessor<RangePickerValue \| null>` | `undefined` | 非受控初始值；仅在挂载时读取一次。 | 否 |
| `onChange` | `RangePickerChangeHandler` | `undefined` | 选中回调；两端齐备或清除时触发，参数是 ISO 二元组。 | 否 |
| `min` | `MaybeAccessor<string>` | `undefined` | 最小可选日期（含），ISO `YYYY-MM-DD`；两端共用同一约束。 | 否 |
| `max` | `MaybeAccessor<string>` | `undefined` | 最大可选日期（含），ISO `YYYY-MM-DD`。 | 否 |
| `disabledDate` | `(date: RangePickerDateValue) => boolean` | `undefined` | 自定义禁用判定；与 `min` / `max` 叠加生效，两端共用。 | 否 |
| `format` | `string` | `'YYYY-MM-DD'` | 显示格式，token 子集 `YYYY` / `MM` / `M` / `DD` / `D`；两端共用。 | 否 |
| `weekStartsOn` | `RangePickerWeekStart` | `'mon'` | 周首日。 | 否 |
| `startPlaceholder` | `string` | `'开始日期'` | 起点输入框占位文案。 | 否 |
| `endPlaceholder` | `string` | `'结束日期'` | 终点输入框占位文案。 | 否 |
| `separator` | `string` | `'至'` | 两个输入框之间的分隔文案（视觉分隔，读屏跳过）。 | 否 |
| `startLabel` | `string` | `'开始日期'` | 起点输入框的无障碍名称。 | 否 |
| `endLabel` | `string` | `'结束日期'` | 终点输入框的无障碍名称。 | 否 |
| `size` | `RangePickerSize` | `'medium'` | 尺寸。 | 否 |
| `status` | `RangePickerStatus` | `'default'` | 校验态；被 `<Form.Item>` 包裹时默认跟随字段状态。 | 否 |
| `disabled` | `MaybeAccessor<boolean>` | `false` | 禁用；与 `<Form disabled>` 取或。 | 否 |
| `allowClear` | `boolean` | `false` | 是否显示清除按钮（有值时出现）。 | 否 |
| `clearLabel` | `string` | `'清除'` | 清除按钮的无障碍文案。 | 否 |
| `name` | `string` | `undefined` | 表单字段名（透传到两个原生 `input` 的 `name`，起点为 `name`、终点为 `name-end`）。 | 否 |
| `class` | `string` | `undefined` | 附加类名。 | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/range-picker/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
/**
 * `RangePicker` 的公共类型（T2-11）。
 *
 * **值口径**：对外值是两个 ISO `YYYY-MM-DD` 组成的二元组 `[start, end]`，空区间为
 * `['', '']`。R2 = A 的「对外值只用字符串」在这里落地为「二元组的每个元素都是字符串」——
 * 不出现日期对象、不出现第三方类型（`check:exports` 第 6 条），消费方拿到就能直接存库。
 *
 * **半截值不对外**：只点了起点时控件内部保留「待定起点」，`onChange` 只在两端齐备
 * （或清除）时触发 —— 业务侧永远收不到 `['2026-03-01', '']` 这种脏数据。
 *
 * 本轮范围按 `docs/08 §4.1` 的 T2-11 验收列：hover 预览 / 键盘 / 焦点管理，以及
 * 同日 / 跨月 / 跨年边界与 `min`·`max` 约束。快捷选项（今天 / 近 7 天 / 本月 / 上月）
 * 属 `docs/04 §5.4` 的 P1，本轮不越界实现。
 */
import type { JSX } from 'solid-js';

import type { MaybeAccessor } from '../../utils/resolve-value';
import type { DateValue, WeekStart } from '../date-picker/calendar';

/** 尺寸口径与全局一致：只有 `small` / `medium` / `large`。 */
export type RangePickerSize = 'small' | 'medium' | 'large';

/** 校验态。与 `FieldStatus` 同值域。 */
export type RangePickerStatus = 'default' | 'error';

/** 周首日。`'mon'` 周一、`'sun'` 周日。 */
export type RangePickerWeekStart = WeekStart;

/**
 * 传给 `disabledDate` 的日期值。
 *
 * 与 `DatePickerDateValue` 同源（都是结构性的年 / 月 / 日 + ISO 字符串），
 * 这样两个日期控件写禁用规则的姿势完全一致。
 */
export type RangePickerDateValue = DateValue;

/** 区间值：`[开始, 结束]`，均为 ISO；空区间为 `['', '']`。 */
export type RangePickerValue = readonly [string, string];

/** 值变更回调；参数恒为两端齐备的区间，清除时为 `['', '']`。 */
export type RangePickerChangeHandler = (value: RangePickerValue) => void;

/**
 * `RangePicker` 的入参。原生 `fieldset` 属性照常透传，仅覆盖与控件语义冲突的项。
 *
 * 根节点是 `<fieldset>` 而不是 `div`：两个输入框属于同一个逻辑控件，`fieldset` 自带
 * `group` 语义（WAI-ARIA 的「一组相关控件」），`aria-label` 也有合法宿主 ——
 * 给 `div` 硬挂 `role="group"` 会被 Biome 的 `useSemanticElements` 判错，
 * 而不挂角色又会让 `aria-label` 落到 generic 上（ARIA 1.2 禁止）。T2-05 的
 * `CheckboxGroup` / `RadioGroup` 是同一取舍。
 */
export interface RangePickerProps extends Omit<
  JSX.FieldsetHTMLAttributes<HTMLFieldSetElement>,
  // `disabled` 必须显式剔除：原生 fieldset 的 `disabled` 是静态 boolean，而这里要收
  // `MaybeAccessor<boolean>`（响应式契约）；不剔除会直接 TS2430。
  'onChange' | 'onInput' | 'disabled'
> {
  /**
   * 受控值（`[start, end]` ISO）；支持传值或 getter。传了即为受控。
   * @default undefined
   */
  value?: MaybeAccessor<RangePickerValue | null>;
  /**
   * 非受控初始值；仅在挂载时读取一次。
   * @default undefined
   */
  defaultValue?: MaybeAccessor<RangePickerValue | null>;
  /**
   * 选中回调；两端齐备或清除时触发，参数是 ISO 二元组。
   * @default undefined
   */
  onChange?: RangePickerChangeHandler;
  /**
   * 最小可选日期（含），ISO `YYYY-MM-DD`；两端共用同一约束。
   * @default undefined
   */
  min?: MaybeAccessor<string>;
  /**
   * 最大可选日期（含），ISO `YYYY-MM-DD`。
   * @default undefined
   */
  max?: MaybeAccessor<string>;
  /**
   * 自定义禁用判定；与 `min` / `max` 叠加生效，两端共用。
   * @default undefined
   */
  disabledDate?: (date: RangePickerDateValue) => boolean;
  /**
   * 显示格式，token 子集 `YYYY` / `MM` / `M` / `DD` / `D`；两端共用。
   * @default 'YYYY-MM-DD'
   */
  format?: string;
  /**
   * 周首日。
   * @default 'mon'
   */
  weekStartsOn?: RangePickerWeekStart;
  /**
   * 起点输入框占位文案。
   * @default '开始日期'
   */
  startPlaceholder?: string;
  /**
   * 终点输入框占位文案。
   * @default '结束日期'
   */
  endPlaceholder?: string;
  /**
   * 两个输入框之间的分隔文案（视觉分隔，读屏跳过）。
   * @default '至'
   */
  separator?: string;
  /**
   * 起点输入框的无障碍名称。
   * @default '开始日期'
   */
  startLabel?: string;
  /**
   * 终点输入框的无障碍名称。
   * @default '结束日期'
   */
  endLabel?: string;
  /**
   * 尺寸。
   * @default 'medium'
   */
  size?: RangePickerSize;
  /**
   * 校验态；被 `<Form.Item>` 包裹时默认跟随字段状态。
   * @default 'default'
   */
  status?: RangePickerStatus;
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
   * 控件组无障碍名称；被 `<Form.Item>` 包裹时由字段 label 接管。
   * @default '日期范围'
   */
  'aria-label'?: string;
  /**
   * 表单字段名（透传到两个原生 `input` 的 `name`，起点为 `name`、终点为 `name-end`）。
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

- [基础用法](../demos/range-picker-basic.md)：非受控与受控两种取值方式、显示格式、三档尺寸。选完起点后悬停任意日期即可预览区间，移出日历回到单点。（源文件 `packages/core/src/components/range-picker/demos/basic.tsx`）
- [可选范围](../demos/range-picker-constraints.md)：min / max 闭区间、disabledDate 自定义禁用（两端共用同一约束）、同日选择，以及错误与禁用态。（源文件 `packages/core/src/components/range-picker/demos/constraints.tsx`）
- [格式与尺寸](../demos/range-picker-format.md)：格式与分隔文案两端共用，三档尺寸与清除按钮。（源文件 `packages/core/src/components/range-picker/demos/format.tsx`）

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
