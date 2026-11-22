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
