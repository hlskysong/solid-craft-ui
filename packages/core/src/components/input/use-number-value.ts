/**
 * `InputNumber` 的值桥（T2-04）。
 *
 * 文本输入与数值输入的根本差别：文本的「当前内容」就是值本身，而数值在输入过程中
 * 会穿过 `'-'` / `'1.'` / `''` 这类**没有数值对应物**的中间态。所以这里维护两份状态：
 *
 *  - `value()`：规范化后的数值（字段上下文 > `value` > 内部信号），是给业务侧看的真值；
 *  - `draft()`：用户正在编辑的原文，`null` 表示「没有草稿，显示格式化后的值」。
 *
 * 三条不变式：
 *  1. **输入中不夹取范围**。输 `10` 时打到 `1` 就被 `min=5` 拉到 `5` 会打断输入，
 *     范围只在失焦 / 步进 / 清空后归一化时生效。
 *  2. **非法输入不提交、也不清空**。`'abc'` 只留在草稿里，失焦时静默回退到上一个合法值；
 *     `''` 才是「用户要清空」，提交 `null`。把两者混为一谈会让打错一个字就丢数据。
 *  3. **值未变化不发 `onChange`**。失焦归一化常常只是把 `'007'` 重排成 `'7'`，
 *     数值没变就不该触发一次业务回调（否则受控场景会多提交一轮）。
 *
 * 精度 / 范围 / 千分位全部以 getter 形式传入，读一次订阅一次，不在建桥时求值。
 */
import { createSignal } from 'solid-js';

import { toFieldText } from '../../form/field-value';
import type { FieldControl } from '../../form/types';
import { useFormFieldOptional } from '../../form/use-form-field';
import { resolveValue, type MaybeAccessor } from '../../utils/resolve-value';
import { clamp, formatNumber, parseNumber, roundTo, stepValue } from './number-math';
import type { InputChangeEvent, NumberChangeHandler } from './types';

/** 建桥入参：全部是 getter。 */
export interface UseNumberValueOptions {
  /** 当前 `props.value`。 */
  value: () => MaybeAccessor<number | null> | undefined;
  /** 当前 `props.defaultValue`。 */
  defaultValue: () => MaybeAccessor<number | null> | undefined;
  /** 当前 `props.onChange`。 */
  onChange: () => NumberChangeHandler<HTMLInputElement> | undefined;
  /** 生效精度。 */
  precision: () => number;
  /** 步进值。 */
  step: () => number;
  /** 下界。 */
  min: () => number | undefined;
  /** 上界。 */
  max: () => number | undefined;
  /** 是否展示千分位。 */
  thousands: () => boolean;
}

/** 桥接产物。 */
export interface NumberValueBridge {
  /** 所在字段；独立使用时为 `undefined`。 */
  readonly field: FieldControl | undefined;
  /** 规范化数值。 */
  readonly value: () => number | null;
  /** 展示文本：有草稿用草稿，否则用格式化后的值。 */
  readonly text: () => string;
  /** 用户输入原文（不夹范围）。 */
  readonly input: (raw: string, event?: InputChangeEvent<HTMLInputElement>) => void;
  /** 失焦：归一化草稿（夹范围 + 取整），丢弃非法输入。 */
  readonly blur: () => void;
  /** 步进一次。 */
  readonly nudge: (direction: 1 | -1) => void;
  /** 清空。 */
  readonly clear: () => void;
}

/**
 * 把任意来源的字段值收窄成数值。
 *
 * 字段值是 `unknown`：`number` 直接用，`string` 尝试解析（后端回填的表单值常常是字符串），
 * 其余（`null` / `undefined` / `boolean` / 对象）一律当空值 —— 数值控件不猜语义。
 */
function toNumber(value: unknown, precision: number): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? roundTo(value, precision) : null;

  if (typeof value === 'string') {
    const text = toFieldText(value).trim();
    if (text === '') return null;
    const parsed = Number(text);
    return Number.isFinite(parsed) ? roundTo(parsed, precision) : null;
  }

  return null;
}

/** 建立「props ↔ 字段上下文」的数值桥。 */
export function useNumberValue(options: UseNumberValueOptions): NumberValueBridge {
  const field = useFormFieldOptional();
  const [inner, setInner] = createSignal<number | null>(
    toNumber(resolveValue(options.defaultValue()), options.precision()),
  );
  const [draft, setDraft] = createSignal<string | null>(null);

  const value = (): number | null => {
    if (field) return toNumber(field.value(), options.precision());

    const controlled = options.value();
    if (controlled !== undefined) return toNumber(resolveValue(controlled), options.precision());

    return inner();
  };

  const text = (): string =>
    draft() ?? formatNumber(value(), options.precision(), options.thousands());

  /**
   * 写值 + 回调。
   *
   * `normalize` 为 `true` 时夹范围（失焦/步进路径），为 `false` 时只取整（输入路径）。
   * 返回值是否触发 `onChange` 取决于**写入前后的数值是否真的不同**。
   */
  const write = (
    next: number | null,
    event: InputChangeEvent<HTMLInputElement> | undefined,
    normalize: boolean,
  ): void => {
    const previous = value();
    const rounded = next === null ? null : roundTo(next, options.precision());
    const shaped =
      rounded === null || !normalize ? rounded : clamp(rounded, options.min(), options.max());

    if (field) field.setValue(shaped);
    else if (options.value() === undefined) setInner(shaped);

    if (Object.is(previous, shaped)) return;
    options.onChange()?.(shaped, event);
  };

  const input = (raw: string, event?: InputChangeEvent<HTMLInputElement>): void => {
    setDraft(raw);

    const parsed = parseNumber(raw, options.thousands());
    // 空输入 = 用户要清空；非法输入只留在草稿里等失焦处理。
    if (parsed === null) {
      write(null, event, false);
      return;
    }
    if (Number.isNaN(parsed)) return;

    write(parsed, event, false);
  };

  const blur = (): void => {
    const current = draft();
    if (current === null) return;

    setDraft(null);

    const parsed = parseNumber(current, options.thousands());
    // 非法：丢弃草稿、回显上一个合法值，不提交（用户可能只是打错想重来）。
    if (parsed !== null && Number.isNaN(parsed)) return;

    write(parsed, undefined, true);
  };

  const nudge = (direction: 1 | -1): void => {
    setDraft(null);
    write(stepValue(value(), options.step(), options.precision(), direction), undefined, true);
  };

  const clear = (): void => {
    setDraft(null);
    write(null, undefined, true);
  };

  return { field, value, text, input, blur, nudge, clear };
}
