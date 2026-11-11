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
