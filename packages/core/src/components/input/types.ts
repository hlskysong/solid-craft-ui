import type { JSX } from 'solid-js';

import type { MaybeAccessor } from '../../utils/resolve-value';

/** 尺寸口径与全局一致：只有 small / medium / large，不存在 md / sm。 */
export type InputSize = 'small' | 'medium' | 'large';

/** 校验态。与 `FieldStatus` 同值域，避免控件与表单出现两套状态词。 */
export type InputStatus = 'default' | 'error';

/**
 * 输入类控件的值变更事件。
 *
 * 第一参数是**已收窄的字符串值**，第二参数才是原生事件 —— 业务侧 90% 的场景只要值，
 * 少数要 `preventDefault` 的场景再取事件。
 */
export type InputChangeEvent<T extends HTMLElement> = InputEvent & {
  currentTarget: T;
  target: T;
};

/** 值变更回调；`event` 在程序化写值（清除）时为 `undefined`。 */
export type InputChangeHandler<T extends HTMLElement> = (
  value: string,
  event?: InputChangeEvent<T>,
) => void;

/**
 * `Textarea` 自动高度配置。
 *
 * `true` 等价于 `{ minRows: 2 }`（不限制上限，由容器滚动承担）；
 * 传对象时 `maxRows` 一旦给到，高度在此行数封顶并转为内部滚动。
 */
export interface TextareaAutoSize {
  /** 最少显示行数（决定初始高度）。@default 2 */
  minRows?: number;
  /** 最多显示行数；超出后内部滚动。@default undefined（不封顶） */
  maxRows?: number;
}

interface InputSharedProps {
  /**
   * 受控值；支持传值或 getter（`MaybeAccessor`，`T` 不得为函数类型，见 `resolveValue` 契约）。
   * 与 `defaultValue` 二选一，传了 `value` 即为受控。
   * @default undefined
   */
  value?: MaybeAccessor<string>;
  /**
   * 非受控初始值；支持传值或 getter，仅在挂载时读取一次。
   * @default undefined
   */
  defaultValue?: MaybeAccessor<string>;
  /**
   * 值变更回调；第一参数是收窄后的字符串。
   * @default undefined
   */
  onChange?: InputChangeHandler<HTMLElement>;
  /**
   * 尺寸。
   * @default 'medium'
   */
  size?: InputSize;
  /**
   * 校验态；`error` 时边框转危险色并输出 `data-scui-invalid="true"`。
   * 被 `<Form.Item>` 包裹时字段状态优先。
   * @default 'default'
   */
  status?: InputStatus;
}

/** `Input` 的入参。原生属性照常透传，仅覆盖与前者语义冲突的项。 */
export interface InputProps
  extends
    Omit<
      JSX.InputHTMLAttributes<HTMLInputElement>,
      // 原生 value / defaultValue 是 string | number | readonly string[]，这里统一收窄为字符串；
      // prefix 在原生是 RDFa 字符串属性，这里改为 JSX 插槽。
      'value' | 'defaultValue' | 'onChange' | 'children' | 'size' | 'prefix'
    >,
    InputSharedProps {
  /** 强类型：文本输入只需要这几种；`password` / `search` 会启用对应子能力。 */
  type?: 'text' | 'password' | 'search' | 'email' | 'tel' | 'url';
  /**
   * 前缀内容（图标或文本）。原生 `prefix` 是 RDFa 字符串属性，这里覆盖为 JSX。
   * @default undefined
   */
  prefix?: JSX.Element;
  /**
   * 后缀内容（图标或文本）。
   * @default undefined
   */
  suffix?: JSX.Element;
  /**
   * 展示清除按钮（有值时出现）。
   * @default false
   */
  allowClear?: boolean;
  /**
   * 清除回调；在 `onChange('')` 之前触发。
   * @default undefined
   */
  onClear?: () => void;
  /**
   * 密码可见性切换按钮；仅 `type="password"` 生效。
   * @default true
   */
  visibilityToggle?: boolean;
  /**
   * 回车搜索回调；仅 `type="search"` 生效，输入法组合态下的回车不触发。
   * @default undefined
   */
  onSearch?: (value: string) => void;
  /**
   * 搜索按钮：传 `true` 渲染默认搜索图标，传 JSX 则渲染自定义内容。仅 `type="search"` 生效。
   * （`JSX.Element` 已包含 `boolean`，不再写 `boolean | JSX.Element`，避免冗余联合。）
   * @default false
   */
  enterButton?: JSX.Element;
}

/**
 * 数值变更回调；`value` 为 `null` 表示「被清空」。
 *
 * 与 `InputChangeHandler` 的区别是**不给中间态**：`InputNumber` 在用户输入过程中
 * 只提交能被 `Number()` 精确表达的数值，`'1.'` / `'-'` 这类半成品留在控件内部的
 * 草稿里，不会以 `'1.'` 这种字符串形式漏给业务侧。
 */
export type NumberChangeHandler<T extends HTMLElement> = (
  value: number | null,
  event?: InputChangeEvent<T>,
) => void;

/** `InputNumber` 的入参。 */
export interface InputNumberProps
  extends
    Omit<
      JSX.InputHTMLAttributes<HTMLInputElement>,
      // 原生这几个属性的语义与本组件不同：value 是 string、onChange 是 input 事件、
      // min/max/step 只对 type="number" 生效（我们用 type="text" 接管格式化）。
      | 'value'
      | 'defaultValue'
      | 'onChange'
      | 'children'
      | 'size'
      | 'prefix'
      | 'type'
      | 'min'
      | 'max'
      | 'step'
    >,
    Pick<InputSharedProps, 'size' | 'status'> {
  /**
   * 受控数值；`null` 表示空值。支持传值或 getter（`MaybeAccessor`）。
   * @default undefined
   */
  value?: MaybeAccessor<number | null>;
  /**
   * 非受控初始值；仅挂载时读取一次。
   * @default undefined
   */
  defaultValue?: MaybeAccessor<number | null>;
  /**
   * 数值变更回调；清空时第一参数为 `null`。
   * @default undefined
   */
  onChange?: NumberChangeHandler<HTMLInputElement>;
  /**
   * 步进值，决定上下按钮与 ↑/↓ 键的单次增量。
   * `precision` 未显式给出时，由它的小数位反推精度（`step={0.1}` ⇒ 1 位小数）。
   * @default 1
   */
  step?: number;
  /**
   * 小数位数；显式给出后，输入与步进的结果都会被裁到该位数。
   * @default 由 `step` 推导
   */
  precision?: number;
  /**
   * 下界；输入过程中不夹取（否则输 `10` 打到 `1` 就被拉到 `min`），
   * 在失焦、步进、清空后归一化时生效。
   * @default undefined
   */
  min?: number;
  /**
   * 上界；夹取时机同 `min`。
   * @default undefined
   */
  max?: number;
  /**
   * 展示千分位分隔符（仅影响展示，输入时可带 `,` 也可不带）。
   * @default false
   */
  thousands?: boolean;
  /**
   * 展示上下步进按钮；关闭后仍可用 ↑/↓ 键步进。
   * @default true
   */
  controls?: boolean;
  /**
   * 前缀内容（单位或图标）。原生 `prefix` 是 RDFa 字符串属性，这里覆盖为 JSX。
   * @default undefined
   */
  prefix?: JSX.Element;
  /**
   * 后缀内容（单位或图标）。
   * @default undefined
   */
  suffix?: JSX.Element;
}

/** `Textarea` 的入参。 */
export interface TextareaProps
  extends
    Omit<
      JSX.TextareaHTMLAttributes<HTMLTextAreaElement>,
      'value' | 'defaultValue' | 'onChange' | 'children' | 'size'
    >,
    InputSharedProps {
  /**
   * 自动高度：随内容增高；`maxRows` 封顶后转内部滚动。
   * @default false
   */
  autoSize?: boolean | TextareaAutoSize;
  /**
   * 展示字数统计；配合原生 `maxLength` 显示「已输入 / 上限」。
   * @default false
   */
  showCount?: boolean;
  /**
   * 展示清除按钮（有值时出现）。
   * @default false
   */
  allowClear?: boolean;
  /**
   * 清除回调；在 `onChange('')` 之前触发。
   * @default undefined
   */
  onClear?: () => void;
}
