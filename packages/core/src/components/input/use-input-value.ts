/**
 * 输入类控件（`Input` / `Textarea`）共用的值桥（T2-03）。
 *
 * 三件事只写一次：
 *  1. **值来源优先级**：`<Form.Item>` 上下文 > `value` > `defaultValue` / 内部状态。
 *     被表单包裹时控件不得再持有与字段重复的状态（`docs/02 §6.2`）。
 *  2. **写值分流**：有字段写字段，非受控写内部信号，受控且外部未更新时保持不动 ——
 *     这样外部忘记回写时表现是「输入框回弹」这一标准受控行为，而不是控件偷偷接管。
 *  3. **文本收窄**：字段值是 `unknown`，统一走 `toFieldText()`，避免各控件各写一遍
 *     `String(value ?? '')`（对象会渲染成 `[object Object]`，AGENTS §10）。
 *
 * 为什么不把 `disabled` / `status` 也在这里合并：控件的显式 props 优先级高于字段状态，
 * 只有组件自己知道「用户传了没有」，这里只负责把字段侧的值原样交出去。
 */
import { createSignal } from 'solid-js';

import type { FieldControl } from '../../form/types';
import { toFieldText } from '../../form/field-value';
import { useFormFieldOptional } from '../../form/use-form-field';
import { resolveValue, type MaybeAccessor } from '../../utils/resolve-value';
import type { InputChangeEvent, InputChangeHandler, InputStatus } from './types';

/** 桥接入参：全部是 getter，读一次订阅一次（不解构 props）。 */
export interface UseInputValueOptions<T extends HTMLElement> {
  /** 当前 `props.value`。 */
  value: () => MaybeAccessor<string> | undefined;
  /** 当前 `props.defaultValue`。 */
  defaultValue: () => MaybeAccessor<string> | undefined;
  /** 当前 `props.onChange`。 */
  onChange: () => InputChangeHandler<T> | undefined;
}

/** 桥接产物。 */
export interface InputValueBridge<T extends HTMLElement> {
  /** 所在字段；独立使用时为 `undefined`。 */
  readonly field: FieldControl | undefined;
  /** 归一化后的当前值（恒为字符串）。 */
  readonly value: () => string;
  /** 写值并触发 `onChange`；`event` 在程序化写值时为 `undefined`。 */
  readonly setValue: (next: string, event?: InputChangeEvent<T>) => void;
}

/**
 * 建立「props ↔ 字段上下文」的值桥。
 *
 * @param options 三个 getter
 * @returns 值桥
 */
export function useInputValue<T extends HTMLElement>(
  options: UseInputValueOptions<T>,
): InputValueBridge<T> {
  const field = useFormFieldOptional();
  // defaultValue 是「初始值」语义，只在挂载时求值一次；传 getter 也照样只读一次。
  const [inner, setInner] = createSignal(toFieldText(resolveValue(options.defaultValue())));

  const value = (): string => {
    if (field) return toFieldText(field.value());

    const controlled = options.value();
    if (controlled !== undefined) return toFieldText(resolveValue(controlled));

    return inner();
  };

  const setValue = (next: string, event?: InputChangeEvent<T>): void => {
    if (field) {
      field.setValue(next);
    } else if (options.value() === undefined) {
      setInner(next);
    }

    options.onChange()?.(next, event);
  };

  return { field, value, setValue };
}

/** 合并校验态：控件显式 `status` 优先，其次字段状态。 */
export function resolveStatus(
  explicit: InputStatus | undefined,
  field: FieldControl | undefined,
): InputStatus {
  return explicit ?? field?.status() ?? 'default';
}
