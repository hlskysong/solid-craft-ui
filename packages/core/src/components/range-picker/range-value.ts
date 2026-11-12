/**
 * RangePicker 的值桥（T2-11）。
 *
 * 与 `input/use-input-value.ts` 同一套三条规则，只是值的形状从字符串换成 ISO 二元组：
 *  1. **值来源优先级**：`<Form.Item>` 上下文 > `value` > `defaultValue` / 内部状态；
 *     被表单包裹时控件不得再持有与字段重复的状态（`docs/02 §6.2`）。
 *  2. **写值分流**：有字段写字段，非受控写内部信号，受控且外部未更新时保持不动
 *     （外部忘记回写时表现为「回弹」这一标准受控行为）。
 *  3. **形状收窄**：字段值是 `unknown`，统一走 `toRangeValue()`。拿到的不是
 *     `[string, string]` 就当成空区间 —— 绝不 `String(value)`，否则会渲染出
 *     `[object Object]` 或 `a,b` 这种假数据（AGENTS §10）。
 */
import { createSignal } from 'solid-js';

import type { FieldControl } from '../../form/types';
import { useFormFieldOptional } from '../../form/use-form-field';
import { resolveValue, type MaybeAccessor } from '../../utils/resolve-value';
import { EMPTY_RANGE } from './calendar-range';
import type { RangePickerChangeHandler, RangePickerValue } from './types';

/** 只认「长度为 2 且两端都是字符串」的数组，其它一律视为空区间。 */
const isStringPair = (input: unknown): input is RangePickerValue => {
  if (!Array.isArray(input)) return false;
  const items: readonly unknown[] = input;
  return typeof items[0] === 'string' && typeof items[1] === 'string';
};

/** 任意输入 → 区间值（外部数据 / 字段值统一入口）。 */
export function toRangeValue(input: unknown): RangePickerValue {
  return isStringPair(input) ? [input[0], input[1]] : EMPTY_RANGE;
}

/** 桥接入参：全部是 getter，读一次订阅一次（不解构 props）。 */
export interface UseRangeValueOptions {
  /** 当前 `props.value`。 */
  value: () => MaybeAccessor<RangePickerValue | null> | undefined;
  /** 当前 `props.defaultValue`。 */
  defaultValue: () => MaybeAccessor<RangePickerValue | null> | undefined;
  /** 当前 `props.onChange`。 */
  onChange: () => RangePickerChangeHandler | undefined;
}

/** 桥接产物。 */
export interface RangeValueBridge {
  /** 所在字段；独立使用时为 `undefined`。 */
  readonly field: FieldControl | undefined;
  /** 归一化后的当前值（恒为二元组）。 */
  readonly value: () => RangePickerValue;
  /** 写值并触发 `onChange`。 */
  readonly setValue: (next: RangePickerValue) => void;
}

/**
 * 建立「props ↔ 字段上下文」的值桥。
 *
 * @param options 三个 getter
 * @returns 值桥
 */
export function useRangeValue(options: UseRangeValueOptions): RangeValueBridge {
  const field = useFormFieldOptional();
  // defaultValue 是「初始值」语义，只在挂载时求值一次（传 getter 也只读一次）。
  const [inner, setInner] = createSignal<RangePickerValue>(
    toRangeValue(resolveValue(options.defaultValue())),
  );

  const value = (): RangePickerValue => {
    if (field) return toRangeValue(field.value());

    const controlled = options.value();
    if (controlled !== undefined) return toRangeValue(resolveValue(controlled));

    return inner();
  };

  const setValue = (next: RangePickerValue): void => {
    if (field) {
      field.setValue([next[0], next[1]]);
    } else if (options.value() === undefined) {
      setInner(next);
    }

    options.onChange()?.(next);
  };

  return { field, value, setValue };
}
