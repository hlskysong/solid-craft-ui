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
