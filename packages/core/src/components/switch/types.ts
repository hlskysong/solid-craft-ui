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
