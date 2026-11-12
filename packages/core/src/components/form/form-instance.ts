/**
 * T2-08 表单状态引擎。
 *
 * 沿用 S-06 实证的关键结论（`spikes/s06-form/validation.ts`）：**每个字段一个独立
 * createSignal，外加一个独立 error signal**。`Form.Item` 只订阅自己那两个 signal，
 * 改一个字段不会让其它字段的 effect 重跑 —— 这是 `api-draft/Form.md §3` 的响应式契约，
 * 也是 T2-08 单测里 effect 计数用例要钉住的东西。不要用单个 store 对象信号替代。
 *
 * 本文件同时承载 `useForm()`：它只用 `createSignal`（不需要 owner），因此既能在组件内
 * 调用，也能在 setup 之外的普通函数里创建实例，不会出现 computations outside root 警告。
 */
import { createSignal, type Accessor } from 'solid-js';

import type { FormInstance, FormRule, FormValidateResult, FormValues } from './types';
import { runRules } from './validate';

/** 一个已注册字段的内部句柄。值 / 错误 / 规则全部是 getter。 */
export interface FieldEntry {
  readonly name: string;
  readonly value: Accessor<unknown>;
  readonly setValue: (next: unknown) => void;
  readonly error: Accessor<string | undefined>;
  readonly setError: (next: string | undefined) => void;
  readonly rules: () => readonly FormRule[];
}

/** 引擎比公共实例多两个内部能力：字段注册与遍历。 */
export interface FormEngine extends FormInstance<FormValues> {
  register(name: string, rules: () => readonly FormRule[]): FieldEntry;
  entries(): readonly FieldEntry[];
}

/**
 * 创建表单引擎。
 *
 * @param getInitialValues 初值 getter；字段注册与 `resetFields` 时各读一次，
 *   因此 `<Form initialValues>` 即使来自 Solid 信号也能保持最新，而不需要重建实例。
 */
export function createFormEngine(getInitialValues: () => FormValues): FormEngine {
  const fields = new Map<string, FieldEntry>();
  const initialOf = (name: string): unknown => getInitialValues()[name];

  const register = (name: string, rules: () => readonly FormRule[]): FieldEntry => {
    const existing = fields.get(name);
    if (existing) return existing;

    const [value, writeValue] = createSignal<unknown>(initialOf(name));
    const [error, writeError] = createSignal<string | undefined>();
    const entry: FieldEntry = {
      name,
      value,
      // createSignal 的 setter 把函数当作 updater；字段值是任意 unknown，
      // 统一用函数形式写入，避免值本身是函数时被吞掉（T2-05 踩过的同一个坑）。
      setValue: (next) => writeValue(() => next),
      error,
      setError: (next) => writeError(() => next),
      rules,
    };
    fields.set(name, entry);
    return entry;
  };

  const entries = (): readonly FieldEntry[] => [...fields.values()];
  const selected = (names?: readonly string[]): readonly FieldEntry[] =>
    names
      ? names
          .map((name) => fields.get(name))
          .filter((entry): entry is FieldEntry => entry !== undefined)
      : entries();

  const snapshot = (): FormValues =>
    Object.fromEntries(entries().map((entry) => [entry.name, entry.value()]));

  const setFieldValue = (name: string, value: unknown): void => {
    fields.get(name)?.setValue(value);
  };

  const resetFields = (names?: readonly string[]): void => {
    for (const entry of selected(names)) {
      entry.setValue(initialOf(entry.name));
      entry.setError(undefined);
    }
  };

  const validateFields = async (
    names?: readonly string[],
  ): Promise<FormValidateResult<FormValues>> => {
    const targets = selected(names);
    const values = snapshot();
    const outcomes = await Promise.all(
      targets.map(async (entry) => ({
        entry,
        message: await runRules(entry.rules(), entry.value(), values),
      })),
    );

    const errors: Record<string, string> = {};
    for (const { entry, message } of outcomes) {
      entry.setError(message);
      if (message !== undefined) errors[entry.name] = message;
    }
    return {
      valid: Object.keys(errors).length === 0,
      values,
      errors,
      firstErrorName: targets.find((entry) => entry.error() !== undefined)?.name,
    };
  };

  return {
    register,
    entries,
    getFieldsValue: snapshot,
    getFieldValue: (name) => fields.get(name)?.value(),
    getFieldError: (name) => fields.get(name)?.error(),
    setFieldsValue: (patch) => {
      for (const [name, value] of Object.entries(patch ?? {})) setFieldValue(name, value);
    },
    setFieldValue,
    validateFields,
    resetFields,
  };
}

/**
 * 创建可在组件树外读写的表单实例（docs/04 §6.3 的 `const [form] = useForm()` 形态）。
 *
 * 返回单元素 tuple 是为了与 §6.3 的示例写法保持一致；运行时对象就是 `FormEngine`，
 * `<Form form>` 会接上字段注册能力。初值只在此处登记一次，后续由 `resetFields` 重读。
 */
export function useForm<V extends FormValues = FormValues>(
  initialValues?: Partial<V>,
): [FormInstance<V>] {
  const engine = createFormEngine(() => (initialValues ?? {}) as FormValues);
  return [engine as unknown as FormInstance<V>];
}
