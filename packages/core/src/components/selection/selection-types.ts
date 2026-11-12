/**
 * 选择类控件（Checkbox / Radio / Switch）共用的类型与契约（T2-05）。
 *
 * 这一层刻意**不叫 `types.ts`、不放 `Selection.tsx`**：`check:slice` 以
 * 「目录里有 `types.ts` 或 `<Pascal>.tsx`」识别组件目录，并据此要求 exports 子路径、
 * demos、API 表等一整套纵向切片产物。共享层不是组件，没有公共子路径，
 * 因此只放 `-types` / hook / 内部壳文件。
 *
 * 三件套共享的不是「长得像」，而是三件事：
 *  1. `<label>` 包裹原生 input 的可访问名称链路（`selection-label.tsx`）；
 *  2. `字段上下文 > value > defaultValue > 内部信号` 的值优先级（`use-selection-value.ts`）；
 *  3. Group 与子项之间的受控协议（`group-context.ts`）。
 * 视觉指示器（勾 / 圆点 / 轨道）各组件自己给，不在这里统一成一套样式。
 */
import type { Accessor, JSX } from 'solid-js';

/** 尺寸口径与全局一致：只有 small / medium / large，不存在 md / sm。 */
export type SelectionSize = 'small' | 'medium' | 'large';

/** 校验态。与 `FieldStatus` 同值域，避免控件与表单出现两套状态词。 */
export type SelectionStatus = 'default' | 'error';

/** Group 的排列方向。与 `Divider` / `Space` 共用 `data-scui-orientation`。 */
export type SelectionOrientation = 'horizontal' | 'vertical';

/**
 * 选中态的三态字符串，恒输出（不缺省）。
 *
 * `'mixed'` 只由 `Checkbox.indeterminate` 产生；SSR 也输出 `'false'`，
 * 避免服务端与客户端首帧属性集不一致（同 `data-scui-invalid` 的口径）。
 */
export type SelectionChecked = 'true' | 'false' | 'mixed';

/** Group 的 `options` 写法：值与文案成对，值一律是 string（R2 = A）。 */
export interface SelectionOption {
  /** 选项文案。 */
  label: JSX.Element;
  /** 选项值；写入字段与 `onChange` 的都是它。 */
  value: string;
  /** 单个选项禁用（与 Group 的 `disabled` 取或）。@default false */
  disabled?: boolean;
}

/**
 * 选择类控件的变更事件：原生 change 事件，带上强类型的 `currentTarget`。
 *
 * 刻意不把 `target` 收窄成 `T`：Solid 的事件对象把 `target` 定为 `Element`
 * （事件冒泡时它确实可能是 label 的子节点），强行收窄需要一次运行时守卫或断言。
 * 业务侧需要读控件时一律用 `currentTarget`，这也与 `Input` 的约定一致。
 */
export type SelectionChangeEvent<T extends HTMLElement> = Event & { currentTarget: T };

/** 值变更回调；第一参数恒为收窄后的控件值，第二参数在程序化写值时为 `undefined`。 */
export type SelectionChangeHandler<T extends HTMLElement, V> = (
  value: V,
  event?: SelectionChangeEvent<T>,
) => void;

/** Group Context 的公共部分。子项只读，不复制状态。 */
export interface SelectionGroupBase {
  /** 禁用态（Group 的 `disabled` 与字段上下文合并后的结果）。 */
  disabled: Accessor<boolean>;
  /** 尺寸；子项显式传 `size` 时优先，否则继承 Group。 */
  size: Accessor<SelectionSize>;
  /** 原生 name，同组必须同源，否则方向键与表单提交会串组。 */
  name: Accessor<string>;
}

/** CheckboxGroup → Checkbox 的协议：多选值是 string 数组。 */
export interface CheckboxGroupControl extends SelectionGroupBase {
  values: Accessor<string[]>;
  /** 按子项的 value 与最新 checked 写回整组值。 */
  write: (next: string[], event?: SelectionChangeEvent<HTMLInputElement>) => void;
}

/** RadioGroup → Radio 的协议：单选值是 string（空串表示都未选）。 */
export interface RadioGroupControl extends SelectionGroupBase {
  value: Accessor<string>;
  /** 选中某个值；原生 radio 不会「取消选中」，因此没有反选分支。 */
  write: (next: string, event?: SelectionChangeEvent<HTMLInputElement>) => void;
}
