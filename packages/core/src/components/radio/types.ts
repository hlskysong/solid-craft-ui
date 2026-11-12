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
