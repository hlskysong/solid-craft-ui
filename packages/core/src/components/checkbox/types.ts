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
export type CheckboxSize = SelectionSize;

/** 校验态。与 `FieldStatus` 同值域，避免控件与表单出现两套状态词。 */
export type CheckboxStatus = SelectionStatus;

/** `CheckboxGroup` 的排列方向。 */
export type CheckboxOrientation = SelectionOrientation;

/** `CheckboxGroup.options` 的选项。 */
export type CheckboxOption = SelectionOption;

/** `Checkbox` 的变更事件。 */
export type CheckboxChangeEvent = SelectionChangeEvent<HTMLInputElement>;

/** `Checkbox` 的值变更回调；第一参数是切换后的布尔值。 */
export type CheckboxChangeHandler = SelectionChangeHandler<HTMLInputElement, boolean>;

/** `CheckboxGroup` 的值变更回调；第一参数是去重后的整组值。 */
export type CheckboxGroupChangeHandler = SelectionChangeHandler<HTMLInputElement, string[]>;

/**
 * `Checkbox` 的入参。原生属性照常透传，仅覆盖与前者语义冲突的项。
 *
 * 受控优先级：`<Form.Item>` 字段 > `checked` > `defaultChecked` / 内部状态；
 * 在 `CheckboxGroup` 内时由 Group 接管 `checked`，自己的 `checked` 不生效。
 */
export interface CheckboxProps extends Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  | 'value'
  | 'checked'
  | 'defaultChecked'
  | 'onChange'
  | 'children'
  | 'size'
  | 'type'
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
   * 半选态。只影响展示与 `aria-checked="mixed"`，不改变 `checked` 的值；
   * 原生 `indeterminate` 是 DOM property，由客户端 effect 写入，SSR 不输出属性。
   * @default false
   */
  indeterminate?: MaybeAccessor<boolean>;
  /**
   * 在 `CheckboxGroup` 内的选项值；独立使用时只作为原生 `value` 透传。
   * @default undefined
   */
  value?: string;
  /**
   * 选中态变更回调；第一参数是切换后的布尔值。
   * @default undefined
   */
  onChange?: CheckboxChangeHandler;
  /**
   * 尺寸；在 Group 内未显式给出时继承 Group 的尺寸。
   * @default 'medium'
   */
  size?: CheckboxSize;
  /**
   * 校验态；`error` 时输出 `data-scui-invalid="true"`。被 `<Form.Item>` 包裹时字段状态优先。
   * @default 'default'
   */
  status?: CheckboxStatus;
  /**
   * 文案；由 `<label>` 包裹输入控件，点击文字即可切换。无文案时须自行提供 `aria-label`。
   * @default undefined
   */
  children?: JSX.Element;
}

/** `CheckboxGroup` 的入参。`options` 与 `children` 二选一，`options` 优先。 */
export interface CheckboxGroupProps extends Omit<
  JSX.FieldsetHTMLAttributes<HTMLFieldSetElement>,
  'onChange' | 'children' | 'defaultValue'
> {
  /**
   * 受控值（已选中的 `value` 数组）；支持传值或 getter。
   * @default undefined（非受控）
   */
  value?: MaybeAccessor<string[]>;
  /**
   * 非受控初始值；仅在挂载时读取一次。
   * @default []
   */
  defaultValue?: MaybeAccessor<string[]>;
  /**
   * 整组值变更回调；第一参数是去重后的数组。
   * @default undefined
   */
  onChange?: CheckboxGroupChangeHandler;
  /**
   * 选项写法；给出后忽略 `children`。
   * @default undefined
   */
  options?: CheckboxOption[];
  /**
   * 整组禁用。
   * @default false
   */
  disabled?: boolean;
  /**
   * 尺寸；子项未显式传 `size` 时继承本值。
   * @default 'medium'
   */
  size?: CheckboxSize;
  /**
   * 排列方向，落成 `data-scui-orientation`。
   * @default 'horizontal'
   */
  orientation?: CheckboxOrientation;
  /**
   * 原生 name；同组同源，缺省由 `createUniqueId()` 生成（SSR 稳定）。
   * @default 自动生成
   */
  name?: string;
  /**
   * 手写子项写法：直接放 `<Checkbox value="...">...</Checkbox>`。
   * @default undefined
   */
  children?: JSX.Element;
}
