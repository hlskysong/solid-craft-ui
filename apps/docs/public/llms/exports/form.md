# Form 表单（`solid-craft/form`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

表单引擎与字段壳：受控值、六类校验规则、三种布局、错误滚动与 label 三件套，SSR 输出完整静态骨架。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/form/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/form/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/form/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/form/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/form';
```

## API

### FormRule

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `required` | `boolean` | — | 必填；空串、null、undefined 与空数组都算未填。 @default false | 否 |
| `min` | `number` | — | 数值下限，或字符串 / 数组的最小长度。 @default undefined | 否 |
| `max` | `number` | — | 数值上限，或字符串 / 数组的最大长度。 @default undefined | 否 |
| `pattern` | `RegExp` | — | 正则校验；每次新建 RegExp，避免全局标志的 lastIndex 漂移。 @default undefined | 否 |
| `type` | `FieldValueType` | — | 值类型校验。 @default undefined | 否 |
| `validator` | `FieldValidator` | — | 自定义校验，支持同步与异步。 @default undefined | 否 |
| `message` | `string` | — | 本条规则的失败文案；省略时用内置中文文案。 @default undefined | 否 |

### FormValidateResult

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `valid` | `boolean` | — | 是否全部通过。 | 是 |
| `values` | `V` | — | 校验开始时的全量值快照。 | 是 |
| `errors` | `Record<string, string>` | — | 失败字段 → 文案。 | 是 |
| `firstErrorName` | `string` | — | 第一个失败字段名，供错误滚动定位。 | 否 |

### FormInstance

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `getFieldsValue` | `() => V` | — | 全量值快照。 | 是 |
| `getFieldValue` | `(name: string) => unknown` | — | 单字段值。 | 是 |
| `getFieldError` | `(name: string) => string \| undefined` | — | 单字段当前错误文案。 | 是 |
| `setFieldsValue` | `(patch: Partial<V>) => void` | — | 批量写值，不触发校验。 | 是 |
| `setFieldValue` | `(name: string, value: unknown) => void` | — | 单字段写值，不触发校验。 | 是 |
| `validateFields` | `(names?: readonly string[]) => Promise<FormValidateResult<V>>` | — | 校验全部或指定字段；异步规则会等待完成。 | 是 |
| `resetFields` | `(names?: readonly string[]) => void` | — | 恢复初值并清空错误；不传 names 时重置全部。 | 是 |

### FormProps

继承：`Omit<   JSX.HTMLAttributes<HTMLFormElement>,   'onSubmit' \| 'children' \| 'style' >`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `form` | `FormInstance` | — | `useForm()` 返回的实例；不传时组件内部自建。 @default undefined | 否 |
| `initialValues` | `FormValues` | — | 初值；键即字段名，仅在字段注册与重置时读取。 @default {} | 否 |
| `layout` | `FormLayout` | — | 布局。 @default 'horizontal' | 否 |
| `labelWidth` | `string` | — | label 列宽，写进 CSS 自定义属性。 @default undefined | 否 |
| `colon` | `boolean` | — | label 后显示冒号。 @default true | 否 |
| `requiredMark` | `boolean` | — | 必填字段显示星号。 @default true | 否 |
| `disabled` | `boolean` | — | 整表禁用，合并进每个字段的 disabled getter。 @default false | 否 |
| `onFinish` | `(values: FormValues) => void` | — | 校验通过回调。 @default undefined | 否 |
| `onFinishFailed` | `(errors: Record<string, string>) => void` | — | 校验失败回调，参数是字段名 → 文案。 @default undefined | 否 |
| `style` | `string` | — | 内联样式（字符串形态），会与 labelWidth 的 CSS 变量合并。 @default undefined | 否 |
| `children` | `JSX.Element` | — | 字段与提交按钮。 | 否 |

### FormItemProps

继承：`Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children'>`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `name` | `string` | — | 字段名，同时是错误滚动的定位值。 | 是 |
| `label` | `string` | — | 标签文案；不要传空串，否则读屏拿不到可访问名称。 | 是 |
| `rules` | `readonly FormRule[]` | — | 校验规则，按数组顺序执行。 @default [] | 否 |
| `disabled` | `boolean` | — | 单字段禁用，与 `<Form disabled>` 取或。 @default false | 否 |
| `children` | `JSX.Element` | — | 控件；经 `FieldProvider` 拿到值、状态与 aria 三件套。 | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/form/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
/**
 * `Form` 的公共类型（T2-08）。
 *
 * 范围按 `docs/04 §5.2` 的 P0 与 `docs/08 §4.1` 的 T2-08 验收列：
 * `Form` / `Form.Item` / `useForm`、六种规则、三种布局、错误滚动、aria 三件套。
 * 不做 `Form.List` / `dependencies` / `shouldUpdate` / 嵌套路径 / resolver —— 那些会
 * 在还没有真实表单页验证之前冻结一份协议（§5.2 的 P1 与 `api-draft/Form.md §1`）。
 *
 * 值类型是 `unknown` 而不是泛型快照：字段运行期可能是 string / boolean / number，
 * 与 T2-02 的 `FieldControl.value` 同源；`toFieldText()` 是控件侧唯一收窄点。
 * `MaybeAccessor<T>` 刻意不用于本层 —— 表单配置是静态的，只有字段值需要 getter，
 * 而 getter 已经由 `FieldProvider` 提供，避免再引入一层 accessor 判定（R3 = A）。
 */
import type { JSX } from 'solid-js';

/** 表单值快照。键即字段名，值在运行期按需收窄。 */
export type FormValues = Record<string, unknown>;

/** 三种布局；由 `<Form layout>` 下发到每个 `<Form.Item>` 的 data 属性上。 */
export type FormLayout = 'horizontal' | 'vertical' | 'inline';

/** `type` 规则支持的值类型。 */
export type FieldValueType = 'string' | 'number' | 'boolean' | 'email' | 'url';

/**
 * 自定义校验器。返回文案即失败，返回 `undefined` 即通过；返回 Promise 时按异步规则等待。
 * 第二参是校验开始时的全量值快照，便于做「两次输入一致」这类跨字段判断。
 */
export type FieldValidator = (
  value: unknown,
  values: FormValues,
) => string | undefined | Promise<string | undefined>;

/** 单条校验规则。按数组顺序执行，取第一条失败文案。 */
export interface FormRule {
  /** 必填；空串、null、undefined 与空数组都算未填。 @default false */
  required?: boolean;
  /** 数值下限，或字符串 / 数组的最小长度。 @default undefined */
  min?: number;
  /** 数值上限，或字符串 / 数组的最大长度。 @default undefined */
  max?: number;
  /** 正则校验；每次新建 RegExp，避免全局标志的 lastIndex 漂移。 @default undefined */
  pattern?: RegExp;
  /** 值类型校验。 @default undefined */
  type?: FieldValueType;
  /** 自定义校验，支持同步与异步。 @default undefined */
  validator?: FieldValidator;
  /** 本条规则的失败文案；省略时用内置中文文案。 @default undefined */
  message?: string;
}

/** 校验结果。`errors` 是字段名 → 文案，通过时为空对象。 */
export interface FormValidateResult<V extends FormValues = FormValues> {
  /** 是否全部通过。 */
  valid: boolean;
  /** 校验开始时的全量值快照。 */
  values: V;
  /** 失败字段 → 文案。 */
  errors: Record<string, string>;
  /** 第一个失败字段名，供错误滚动定位。 */
  firstErrorName?: string;
}

/** 表单实例。由 `useForm()` 创建，可传给 `<Form form>` 在组件树外读写。 */
export interface FormInstance<V extends FormValues = FormValues> {
  /** 全量值快照。 */
  getFieldsValue: () => V;
  /** 单字段值。 */
  getFieldValue: (name: string) => unknown;
  /** 单字段当前错误文案。 */
  getFieldError: (name: string) => string | undefined;
  /** 批量写值，不触发校验。 */
  setFieldsValue: (patch: Partial<V>) => void;
  /** 单字段写值，不触发校验。 */
  setFieldValue: (name: string, value: unknown) => void;
  /** 校验全部或指定字段；异步规则会等待完成。 */
  validateFields: (names?: readonly string[]) => Promise<FormValidateResult<V>>;
  /** 恢复初值并清空错误；不传 names 时重置全部。 */
  resetFields: (names?: readonly string[]) => void;
}

/**
 * `<Form>` 入参。原生 form 属性照常透传，只覆盖与表单语义冲突的 `onSubmit`。
 *
 * 初值有两个来源：传 `form` 时以 `useForm(initialValues)` 的初值为准，
 * 不传 `form` 时组件内部自建实例并读 `initialValues`。
 */
export interface FormProps extends Omit<
  JSX.HTMLAttributes<HTMLFormElement>,
  'onSubmit' | 'children' | 'style'
> {
  /** `useForm()` 返回的实例；不传时组件内部自建。 @default undefined */
  form?: FormInstance;
  /** 初值；键即字段名，仅在字段注册与重置时读取。 @default {} */
  initialValues?: FormValues;
  /** 布局。 @default 'horizontal' */
  layout?: FormLayout;
  /** label 列宽，写进 CSS 自定义属性。 @default undefined */
  labelWidth?: string;
  /** label 后显示冒号。 @default true */
  colon?: boolean;
  /** 必填字段显示星号。 @default true */
  requiredMark?: boolean;
  /** 整表禁用，合并进每个字段的 disabled getter。 @default false */
  disabled?: boolean;
  /**
   * 表单无障碍名称。不传时不设 `aria-label`：`<form>` 只有带可访问名称才暴露成
   * landmark，同页多个表单若都叫「表单」会产生同名 landmark（axe `landmark-unique`）。
   * @default undefined
   */
  'aria-label'?: string;
  /** 校验通过回调。 @default undefined */
  onFinish?: (values: FormValues) => void;
  /** 校验失败回调，参数是字段名 → 文案。 @default undefined */
  onFinishFailed?: (errors: Record<string, string>) => void;
  /** 内联样式（字符串形态），会与 labelWidth 的 CSS 变量合并。 @default undefined */
  style?: string;
  /** 字段与提交按钮。 */
  children?: JSX.Element;
}

/** `<Form.Item>` 入参。label 必填，保证 label[for] 与 aria-labelledby 恒有真实目标。 */
export interface FormItemProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** 字段名，同时是错误滚动的定位值。 */
  name: string;
  /** 标签文案；不要传空串，否则读屏拿不到可访问名称。 */
  label: string;
  /** 校验规则，按数组顺序执行。 @default [] */
  rules?: readonly FormRule[];
  /** 单字段禁用，与 `<Form disabled>` 取或。 @default false */
  disabled?: boolean;
  /** 控件；经 `FieldProvider` 拿到值、状态与 aria 三件套。 */
  children?: JSX.Element;
}
```

## 相关 Demo（完整源码见链接页）

- [基础用法](../demos/form-basic.md)：useForm 创建实例，Form.Item 接管控件取值，提交后回显全量快照。（源文件 `packages/core/src/components/form/demos/basic.tsx`）
- [布局与状态](../demos/form-layout.md)：水平、垂直、行内三种布局；标签宽度、冒号、必填标记与整表禁用。（源文件 `packages/core/src/components/form/demos/layout.tsx`）
- [真实表单页（新增 / 编辑）](../demos/form-real-form.md)：八字段覆盖 Input / Textarea / InputNumber / Checkbox / Radio / Switch / Select 七类控件，共用一条 useForm 实例；可载入既有记录编辑、切回新增、提交校验并回显全量快照。（源文件 `packages/core/src/components/form/demos/real-form.tsx`）
- [校验规则](../demos/form-validation.md)：必填、长度、正则、类型与自定义规则按数组顺序执行，失败时展示错误并回显结果。（源文件 `packages/core/src/components/form/demos/validation.tsx`）

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
