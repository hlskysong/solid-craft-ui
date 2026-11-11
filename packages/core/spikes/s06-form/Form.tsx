/**
 * S-06 可行性预研：Form / Form.Item / Input / 校验 / 错误滚动。
 *
 * Form.Item 通过 Context 向子控件注入 getter（value / status / error），
 * 严格遵守 AGENTS.md §2「禁止解构 props」与 docs/04 §5.2 响应式契约。
 */
import {
  createContext,
  createUniqueId,
  type JSX,
  useContext,
} from 'solid-js';

import { CSS_PREFIX } from '../../src/scope';
import { classNames } from '../../src/utils/class-names';

import {
  createFormEngine,
  scrollToFirstError,
  type FormEngine,
  type Validator,
} from './validation';

const FormContext = createContext<FormEngine>();

export interface ScuiFormProps {
  /** 初始值；键即字段名。 */
  initialValues: Record<string, string>;
  /** 每字段校验规则。 */
  rules?: Record<string, readonly Validator[]>;
  /** 校验通过回调。 */
  onFinish?: (values: Record<string, string>) => void;
  /** 校验失败回调。 */
  onFinishFailed?: (errors: Record<string, string | undefined>) => void;
  /** 表单内容。 */
  children?: JSX.Element;
  /** 无障碍标签。 @default '表单' */
  label?: string;
}

export function ScuiForm(props: ScuiFormProps): JSX.Element {
  const engine = createFormEngine(props.initialValues, props.rules);
  const id = createUniqueId();

  const onSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    const errors = engine.validate();
    const firstError = engine.firstErrorName();
    if (firstError) {
      const form = event.currentTarget;
      if (form instanceof HTMLElement) scrollToFirstError(form, firstError);
      props.onFinishFailed?.(errors);
      return;
    }
    props.onFinish?.(engine.values());
  };

  return (
    <form
      class={classNames(`${CSS_PREFIX}form`)}
      data-scui-role="form"
      aria-label={props.label ?? '表单'}
      id={id}
      onSubmit={onSubmit}
    >
      <FormContext.Provider value={engine}>{props.children}</FormContext.Provider>
    </form>
  );
}

export interface ScuiFormItemProps {
  /** 字段名。 */
  name: string;
  /** 标签文案。 */
  label: string;
  /** 自定义控件；不传时渲染内置 Input。 */
  children?: JSX.Element;
}

export function ScuiFormItem(props: ScuiFormItemProps): JSX.Element {
  const engine = useContext(FormContext);
  if (!engine) throw new Error('ScuiFormItem 必须在 ScuiForm 内使用');
  const field = engine.field(props.name);
  const fieldId = `scui-field-${props.name}-${createUniqueId()}`;
  const errorId = `${fieldId}-error`;
  const labelId = `${fieldId}-label`;

  return (
    <div
      class={classNames(`${CSS_PREFIX}form-item`)}
      data-scui-role="form-item"
      data-scui-field={props.name}
      data-scui-invalid={field.error() === undefined ? 'false' : 'true'}
    >
      <label id={labelId} for={fieldId}>
        {props.label}
      </label>
      {props.children ?? <ScuiInput name={props.name} id={fieldId} labelledBy={labelId} />}
      <span id={errorId} data-scui-role="field-error" role="alert">
        {field.error() ?? ''}
      </span>
    </div>
  );
}

export interface ScuiInputProps {
  /** 字段名。 */
  name: string;
  /** 原生 input id（由 Form.Item 传入以关联 label）。 */
  id?: string;
  /** label 元素 id（aria-labelledby）。 */
  labelledBy?: string;
  /** 原生 input 类型。 @default 'text' */
  type?: string;
  /** 占位文案。 */
  placeholder?: string;
}

/** 控件通过 useFormField 协议只订阅自身字段，不持有重复状态。 */
export function useFormField(name: string) {
  const engine = useContext(FormContext);
  if (!engine) throw new Error('useFormField 必须在 ScuiForm 内使用');
  return engine.field(name);
}

export function ScuiInput(props: ScuiInputProps): JSX.Element {
  const field = useFormField(props.name);
  const id = props.id ?? `scui-input-${props.name}-${createUniqueId()}`;

  return (
    <input
      id={id}
      class={classNames(`${CSS_PREFIX}input`)}
      data-scui-role="input"
      data-scui-field={props.name}
      type={props.type ?? 'text'}
      placeholder={props.placeholder}
      aria-labelledby={props.labelledBy}
      aria-invalid={field.error() === undefined ? 'false' : 'true'}
      value={field.value()}
      onInput={(event) => field.set(event.currentTarget.value)}
    />
  );
}

export function ScuiFormSubmit(props: { children?: JSX.Element }): JSX.Element {
  return (
    <button type="submit" data-scui-role="form-submit">
      {props.children ?? '提交'}
    </button>
  );
}
