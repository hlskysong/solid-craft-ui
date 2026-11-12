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
