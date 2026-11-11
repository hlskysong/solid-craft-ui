/**
 * S-06 可行性预研：字段级状态 + 校验链路 + 错误滚动。
 *
 * 设计要点：每个字段一个独立 signal，Form.Item 只订阅自己的字段，
 * 因此字段级更新不会触发其它字段的 effect（docs/04 §5.2 / AGENTS.md §2）。
 */
import { createSignal, type Accessor } from 'solid-js';

export type Validator = (value: string) => string | undefined;

export interface FieldHandle {
  /** getter 形式的值（响应式契约：不允许解构 props，只传 getter）。 */
  value: Accessor<string>;
  set: (value: string) => void;
  error: Accessor<string | undefined>;
  status: Accessor<'default' | 'error'>;
}

export interface FormEngine {
  field: (name: string) => FieldHandle;
  values: () => Record<string, string>;
  validate: () => Record<string, string | undefined>;
  firstErrorName: () => string | undefined;
  reset: () => void;
}

export const required =
  (message = '此项为必填项'): Validator =>
  (value) =>
    value.trim().length === 0 ? message : undefined;

export const minLength =
  (length: number, message = `至少 ${length} 个字符`): Validator =>
  (value) =>
    value.length < length ? message : undefined;

export const pattern =
  (re: RegExp, message = '格式不正确'): Validator =>
  (value) =>
    re.test(value) ? undefined : message;

/** 每个字段独立 signal + 独立 error signal，避免整表重渲染。 */
export function createFormEngine(
  initial: Record<string, string>,
  rules: Record<string, readonly Validator[]> = {},
): FormEngine {
  const names = Object.keys(initial);
  const entries = new Map<string, { value: Accessor<string>; set: (v: string) => void; error: Accessor<string | undefined>; setError: (v: string | undefined) => void; rules: readonly Validator[] }>();
  for (const name of names) {
    const [value, setValue] = createSignal(initial[name] ?? '');
    const [error, setError] = createSignal<string | undefined>();
    entries.set(name, {
      value,
      set: setValue,
      error,
      setError,
      rules: rules[name] ?? [],
    });
  }

  const validate = () => {
    const result: Record<string, string | undefined> = {};
    for (const [name, entry] of entries) {
      const message = entry.rules
        .map((validator) => validator(entry.value()))
        .find((candidate) => candidate !== undefined);
      entry.setError(message);
      result[name] = message;
    }
    return result;
  };

  const reset = () => {
    for (const [name, entry] of entries) {
      entry.set(initial[name] ?? '');
      entry.setError(undefined);
    }
  };

  return {
    field: (name) => {
      const entry = entries.get(name);
      if (!entry) throw new Error(`未知表单字段：${name}`);
      return {
        value: entry.value,
        set: entry.set,
        error: entry.error,
        status: () => (entry.error() === undefined ? 'default' : 'error'),
      };
    },
    values: () => Object.fromEntries([...entries].map(([name, entry]) => [name, entry.value()])),
    validate,
    firstErrorName: () => [...entries].find(([, entry]) => entry.error() !== undefined)?.[0],
    reset,
  };
}

/** 滚动到第一个错误字段；jsdom 下 scrollIntoView 由测试注入，不改变实现。 */
export function scrollToFirstError(root: ParentNode, name: string | undefined): boolean {
  if (!name) return false;
  const target = root.querySelector(`[data-scui-field="${name}"]`);
  if (!(target instanceof HTMLElement)) return false;
  target.scrollIntoView({ block: 'center' });
  target.focus();
  return true;
}
