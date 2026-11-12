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
