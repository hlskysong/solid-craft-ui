/**
 * 表单（T2-08）。
 *
 * 分层：`Form` 负责实例、布局与提交；`Form.Item` 负责 label / 必填标记 / 错误文案 /
 * 布局壳，并把字段状态交给 T2-02 的 `FieldProvider` —— 控件仍只读 `FieldContext`，
 * 因此 T2-03~T2-07 已落地的控件不需要为接 Form 改一行代码（T2-09 只补接入证据）。
 *
 * SSR：注册字段与渲染 label 都在 setup 期完成，不访问 window / document；校验只在
 * 提交事件或显式 `validateFields()` 时跑，错误滚动由 `scroll.ts` 的 `isServer` 短路。
 * `data-scui-invalid` 恒输出 `'true' | 'false'` 两态，避免 hydration 属性差。
 */
import { createMemo, createUniqueId, Show, splitProps, type JSX } from 'solid-js';

import { FieldProvider } from '../../form/field-context';
import type { FieldIds } from '../../form/types';
import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import { FormContext, useFormContext } from './form-context';
import { createFormEngine, type FormEngine } from './form-instance';
import { scrollToFirstError } from './scroll';
import type { FormItemProps, FormProps } from './types';

const FORM_PROPS = [
  'form',
  'initialValues',
  'layout',
  'labelWidth',
  'colon',
  'requiredMark',
  'disabled',
  'aria-label',
  'onFinish',
  'onFinishFailed',
  'style',
  'class',
  'children',
] as const;

const ITEM_PROPS = ['name', 'label', 'rules', 'disabled', 'class', 'children'] as const;

function FormRoot(props: FormProps): JSX.Element {
  const [local, rest] = splitProps(props, FORM_PROPS);

  // 不传 form 时内部自建；传了就用外部实例（运行时就是 createFormEngine 的产物）。
  // 条件建 hook 会让 Solid 的 owner 链路错位，所以两个分支都走同一处创建。
  const internal = createFormEngine(() => local.initialValues ?? {});
  const engine = createMemo<FormEngine>(() => {
    const external = local.form;
    if (!external) return internal;
    if (typeof (external as Partial<FormEngine>).register !== 'function') {
      throw new Error('[solid-craft] <Form form> 只接受 useForm() 返回的实例。');
    }
    return external as unknown as FormEngine;
  });

  const layout = () => local.layout ?? 'horizontal';
  const disabled = () => local.disabled === true;
  const colon = () => local.colon ?? true;
  const requiredMark = () => local.requiredMark ?? true;
  const styleText = (): string | undefined => {
    const parts = [
      local.style,
      local.labelWidth ? `--scui-form-label-width:${local.labelWidth}` : undefined,
    ].filter((part): part is string => Boolean(part));
    return parts.length > 0 ? parts.join(';') : undefined;
  };

  const onSubmit = async (event: SubmitEvent): Promise<void> => {
    event.preventDefault();
    // 原生 Event.currentTarget 在 await 之后会被清空，先接住再进异步校验。
    const formElement = event.currentTarget as HTMLFormElement | null;
    const result = await engine().validateFields();
    if (result.valid) {
      local.onFinish?.(result.values);
      return;
    }
    if (formElement) scrollToFirstError(formElement, result.firstErrorName);
    local.onFinishFailed?.(result.errors);
  };

  return (
    <form
      {...rest}
      class={classNames(`${CSS_PREFIX}form`, local.class)}
      style={styleText()}
      data-scui-role="form"
      data-scui-layout={layout()}
      data-scui-disabled={disabled() ? '' : undefined}
      // 不给默认名称：`<form>` 只有在**有可访问名称**时才暴露成 landmark，而
      // 「每个表单都叫『表单』」在同一页出现两个以上表单时会直接踩 axe 的
      // `landmark-unique`（同名 landmark 无法区分）。T2-13 扩面把 form/layout 的
      // 四个表单一起扫描时才暴露出来；需要 landmark 的调用方显式传 aria-label。
      aria-label={local['aria-label']}
      onSubmit={onSubmit}
    >
      <FormContext.Provider
        value={{
          engine: engine(),
          layout,
          disabled,
          labelWidth: () => local.labelWidth,
          colon,
          requiredMark,
        }}
      >
        {local.children}
      </FormContext.Provider>
    </form>
  );
}

function FormItem(props: FormItemProps): JSX.Element {
  const [local, rest] = splitProps(props, ITEM_PROPS);
  const context = useFormContext();

  // id 三件套必须由宿主同源产出（T2-02 §30.18 的实测教训）：label[for]、
  // aria-labelledby 与 aria-describedby 指向同一组 id，控件只从 FieldProvider 读。
  const uid = createUniqueId();
  const ids: FieldIds = {
    control: `scui-field-${uid}`,
    label: `scui-field-${uid}-label`,
    message: `scui-field-${uid}-message`,
  };

  const entry = context.engine.register(local.name, () => local.rules ?? []);
  const invalid = () => entry.error() !== undefined;
  const required = () => (local.rules ?? []).some((rule) => rule.required === true);
  const showRequired = () => required() && context.requiredMark();
  const disabled = () => local.disabled === true || context.disabled();

  return (
    <div
      {...rest}
      class={classNames(`${CSS_PREFIX}form-item`, local.class)}
      data-scui-role="form-item"
      data-scui-field={local.name}
      data-scui-layout={context.layout()}
      data-scui-invalid={invalid() ? 'true' : 'false'}
      data-scui-required={showRequired() ? '' : undefined}
      data-scui-disabled={disabled() ? '' : undefined}
    >
      <label class={`${CSS_PREFIX}form-item__label`} id={ids.label} for={ids.control}>
        {local.label}
        <Show when={context.colon()}>
          <span class={`${CSS_PREFIX}form-item__colon`} aria-hidden="true">
            ：
          </span>
        </Show>
        <Show when={showRequired()}>
          <span class={`${CSS_PREFIX}form-item__required`} aria-hidden="true">
            *
          </span>
        </Show>
      </label>
      <div class={`${CSS_PREFIX}form-item__control`}>
        <FieldProvider
          name={local.name}
          value={entry.value}
          setValue={entry.setValue}
          message={entry.error}
          disabled={disabled}
          ids={ids}
        >
          {local.children}
        </FieldProvider>
        <Show when={entry.error()}>
          {(message) => (
            <div
              class={`${CSS_PREFIX}form-item__error`}
              id={ids.message}
              data-scui-role="field-error"
              role="alert"
            >
              {message()}
            </div>
          )}
        </Show>
      </div>
    </div>
  );
}

/** `Form.Item` 作为静态属性挂载，与 docs/04 §6.3 的用法示例一致。 */
export const Form = Object.assign(FormRoot, { Item: FormItem });

export { FormItem };
