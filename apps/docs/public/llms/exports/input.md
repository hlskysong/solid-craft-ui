# Input 输入框（`solid-craft/input`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

单行 / 多行 / 数字输入，前后缀、清除、密码显隐、回车搜索、自动高度、字数统计与步进精度。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/input/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/input/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/input/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/input/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/input';
```

## API

### TextareaAutoSize

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `minRows` | `number` | — | 最少显示行数（决定初始高度）。@default 2 | 否 |
| `maxRows` | `number` | — | 最多显示行数；超出后内部滚动。@default undefined（不封顶） | 否 |

### InputSharedProps

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `value` | `MaybeAccessor<string>` | `undefined` | 受控值；支持传值或 getter（`MaybeAccessor`，`T` 不得为函数类型，见 `resolveValue` 契约）。 与 `defaultValue` 二选一，传了 `value` 即为受控。 | 否 |
| `defaultValue` | `MaybeAccessor<string>` | `undefined` | 非受控初始值；支持传值或 getter，仅在挂载时读取一次。 | 否 |
| `onChange` | `InputChangeHandler<HTMLElement>` | `undefined` | 值变更回调；第一参数是收窄后的字符串。 | 否 |
| `size` | `InputSize` | `'medium'` | 尺寸。 | 否 |
| `status` | `InputStatus` | `'default'` | 校验态；`error` 时边框转危险色并输出 `data-scui-invalid="true"`。 被 `<Form.Item>` 包裹时字段状态优先。 | 否 |

### InputProps

继承：`Omit<       JSX.InputHTMLAttributes<HTMLInputElement>,       // 原生 value / defaultValue 是 string \| number \| readonly string[]，这里统一收窄为字符串；       // prefix 在原生是 RDFa 字符串属性，这里改为 JSX 插槽。       'value' \| 'defaultValue' \| 'onChange' \| 'children' \| 'size' \| 'prefix'     >`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `type` | `'text' \| 'password' \| 'search' \| 'email' \| 'tel' \| 'url'` | — | 强类型：文本输入只需要这几种；`password` / `search` 会启用对应子能力。 | 否 |
| `prefix` | `JSX.Element` | `undefined` | 前缀内容（图标或文本）。原生 `prefix` 是 RDFa 字符串属性，这里覆盖为 JSX。 | 否 |
| `suffix` | `JSX.Element` | `undefined` | 后缀内容（图标或文本）。 | 否 |
| `allowClear` | `boolean` | `false` | 展示清除按钮（有值时出现）。 | 否 |
| `onClear` | `() => void` | `undefined` | 清除回调；在 `onChange('')` 之前触发。 | 否 |
| `visibilityToggle` | `boolean` | `true` | 密码可见性切换按钮；仅 `type="password"` 生效。 | 否 |
| `onSearch` | `(value: string) => void` | `undefined` | 回车搜索回调；仅 `type="search"` 生效，输入法组合态下的回车不触发。 | 否 |
| `enterButton` | `JSX.Element` | `false` | 搜索按钮：传 `true` 渲染默认搜索图标，传 JSX 则渲染自定义内容。仅 `type="search"` 生效。 （`JSX.Element` 已包含 `boolean`，不再写 `boolean \| JSX.Element`，避免冗余联合。） | 否 |

### InputNumberProps

继承：`Omit<       JSX.InputHTMLAttributes<HTMLInputElement>,       // 原生这几个属性的语义与本组件不同：value 是 string、onChange 是 input 事件、       // min/max/step 只对 type="number" 生效（我们用 type="text" 接管格式化）。       \| 'value'       \| 'defaultValue'       \| 'onChange'       \| 'children'       \| 'size'       \| 'prefix'       \| 'type'       \| 'min'       \| 'max'       \| 'step'     >`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `value` | `MaybeAccessor<number \| null>` | `undefined` | 受控数值；`null` 表示空值。支持传值或 getter（`MaybeAccessor`）。 | 否 |
| `defaultValue` | `MaybeAccessor<number \| null>` | `undefined` | 非受控初始值；仅挂载时读取一次。 | 否 |
| `onChange` | `NumberChangeHandler<HTMLInputElement>` | `undefined` | 数值变更回调；清空时第一参数为 `null`。 | 否 |
| `step` | `number` | `1` | 步进值，决定上下按钮与 ↑/↓ 键的单次增量。 `precision` 未显式给出时，由它的小数位反推精度（`step={0.1}` ⇒ 1 位小数）。 | 否 |
| `precision` | `number` | `由 `step` 推导` | 小数位数；显式给出后，输入与步进的结果都会被裁到该位数。 | 否 |
| `min` | `number` | `undefined` | 下界；输入过程中不夹取（否则输 `10` 打到 `1` 就被拉到 `min`）， 在失焦、步进、清空后归一化时生效。 | 否 |
| `max` | `number` | `undefined` | 上界；夹取时机同 `min`。 | 否 |
| `thousands` | `boolean` | `false` | 展示千分位分隔符（仅影响展示，输入时可带 `,` 也可不带）。 | 否 |
| `controls` | `boolean` | `true` | 展示上下步进按钮；关闭后仍可用 ↑/↓ 键步进。 | 否 |
| `prefix` | `JSX.Element` | `undefined` | 前缀内容（单位或图标）。原生 `prefix` 是 RDFa 字符串属性，这里覆盖为 JSX。 | 否 |
| `suffix` | `JSX.Element` | `undefined` | 后缀内容（单位或图标）。 | 否 |

### TextareaProps

继承：`Omit<       JSX.TextareaHTMLAttributes<HTMLTextAreaElement>,       'value' \| 'defaultValue' \| 'onChange' \| 'children' \| 'size'     >`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `autoSize` | `boolean \| TextareaAutoSize` | `false` | 自动高度：随内容增高；`maxRows` 封顶后转内部滚动。 | 否 |
| `showCount` | `boolean` | `false` | 展示字数统计；配合原生 `maxLength` 显示「已输入 / 上限」。 | 否 |
| `allowClear` | `boolean` | `false` | 展示清除按钮（有值时出现）。 | 否 |
| `onClear` | `() => void` | `undefined` | 清除回调；在 `onChange('')` 之前触发。 | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/input/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
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
```

## 相关 Demo（完整源码见链接页）

- [前缀与后缀](../demos/input-affix.md)：用前缀拼协议、用后缀挂单位与字数提示，并演示 createSignal 驱动的受控写法。（源文件 `packages/core/src/components/input/demos/affix.tsx`）
- [单行输入](../demos/input-basic.md)：三档尺寸、禁用态、前后缀图标、允许清除、密码显隐与回车搜索。（源文件 `packages/core/src/components/input/demos/basic.tsx`）
- [精度与格式化](../demos/input-number-format.md)：precision 控制小数位、thousands 展示千分位，以及受控值在失焦时被夹到 max。（源文件 `packages/core/src/components/input/demos/number-format.tsx`）
- [步进与范围](../demos/input-number-step.md)：小数步进 0.1、十位步进 10、min / max 到界后按钮置灰，以及 createSignal 驱动的受控写法。（源文件 `packages/core/src/components/input/demos/number-step.tsx`）
- [数字输入框](../demos/input-number.md)：默认 1 步进、三档尺寸、禁用态、单位前后缀与关闭步进按钮。（源文件 `packages/core/src/components/input/demos/number.tsx`）
- [多行输入](../demos/input-textarea.md)：自动高度（true 与 minRows / maxRows 两种口径）、字数统计、清除按钮与禁用态。（源文件 `packages/core/src/components/input/demos/textarea.tsx`）

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
