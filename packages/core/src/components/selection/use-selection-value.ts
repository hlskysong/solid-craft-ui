/**
 * 选择类控件共用的值桥（T2-05）。
 *
 * 与 `input/use-input-value.ts` 是同一套优先级，差别只在值的形态：
 * 文本控件的值是 `string`，这里可能是 `boolean`（Checkbox / Switch）、
 * `string`（RadioGroup）或 `string[]`（CheckboxGroup）。因此收窄函数
 * `fromField` 由调用方给 —— 字段值是 `unknown`，只有控件知道自己的值域。
 *
 * 三条不变式：
 *  1. `<Form.Item>` 上下文 > `value` / `checked` > `defaultValue` / 内部信号；
 *  2. 受控且外部未回写时控件保持不动（标准「回弹」行为），不偷偷接管；
 *  3. 写值永远触发 `onChange`，无论值是否真的变化（原生 change 事件本身就是一次用户操作）。
 */
import { createSignal } from 'solid-js';

import type { FieldControl } from '../../form/types';
import { useFormFieldOptional } from '../../form/use-form-field';
import { resolveValue, type MaybeAccessor } from '../../utils/resolve-value';
import type { SelectionChangeEvent, SelectionChangeHandler } from './selection-types';

/** 桥接入参：全部是 getter，读一次订阅一次（不解构 props）。 */
export interface UseSelectionValueOptions<V> {
  /** 当前 `props.value` / `props.checked`。 */
  value: () => MaybeAccessor<V> | undefined;
  /** 当前 `props.defaultValue` / `props.defaultChecked`。 */
  defaultValue: () => MaybeAccessor<V> | undefined;
  /** 当前 `props.onChange`。 */
  onChange: () => SelectionChangeHandler<HTMLInputElement, V> | undefined;
  /** 字段值 `unknown` → 控件值 `V` 的唯一收窄点。 */
  fromField: (raw: unknown) => V;
  /** 既无字段也无初始值时的空值。 */
  fallback: () => V;
}

/** 桥接产物。 */
export interface SelectionValueBridge<V> {
  /** 所在字段；独立使用时为 `undefined`。 */
  readonly field: FieldControl | undefined;
  /** 归一化后的当前值。 */
  readonly value: () => V;
  /** 写值并触发 `onChange`；`event` 在程序化写值时为 `undefined`。 */
  readonly setValue: (next: V, event?: SelectionChangeEvent<HTMLInputElement>) => void;
}

/** 建立「props ↔ 字段上下文」的值桥。 */
export function useSelectionValue<V>(
  options: UseSelectionValueOptions<V>,
): SelectionValueBridge<V> {
  const field = useFormFieldOptional();
  // defaultValue / defaultChecked 是「初始值」语义，只在挂载时求值一次。
  const initial = (): V => {
    const provided = options.defaultValue();
    return provided === undefined ? options.fallback() : resolveValue(provided);
  };
  const [inner, setInner] = createSignal<V>(initial());

  const value = (): V => {
    if (field) return options.fromField(field.value());

    const controlled = options.value();
    if (controlled !== undefined) return resolveValue(controlled);

    return inner();
  };

  const setValue = (next: V, event?: SelectionChangeEvent<HTMLInputElement>): void => {
    if (field) {
      field.setValue(next);
    } else if (options.value() === undefined) {
      // 用更新器形式写值：泛型 V 未被约束为「非函数」，直接传值会撞上
      // Solid Setter 的 `(prev: V) => V` 重载，让 TS 把布尔值当函数。
      setInner(() => next);
    }

    options.onChange()?.(next, event);
  };

  return { field, value, setValue };
}
