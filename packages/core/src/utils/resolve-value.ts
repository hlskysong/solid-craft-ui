import type { Accessor } from 'solid-js';

/**
 * 既可传值也可传 getter 的响应式入参类型。
 *
 * Solid 不做组件重渲染，getter 能保留细粒度追踪；静态场景直接传值即可。
 *
 * ⚠️ T0-03 / R3 评审约束（Aming 2026-11-11 裁决，见 api-draft/REVIEW.md 第 9 节）：
 * 本类型禁止用于 T 本身可能为函数类型的 prop（如 renderItem / formatter / onChange）。
 * isAccessor 用 typeof v === 'function' 判定，无法区分「函数值」与 getter，
 * 套在函数类型上会把业务回调误当 accessor 调用。这类 prop 请用静态值或显式 Accessor 包装。
 */
export type MaybeAccessor<T> = T | Accessor<T>;

/**
 * 将「值或 getter」归一为当前值。
 *
 * 在 getter 或 `createMemo` 内部调用可保留响应式追踪。
 *
 * @param value 普通值或返回值的 getter
 * @returns 当前值
 */
function isAccessor<T>(value: MaybeAccessor<T>): value is Accessor<T> {
  return typeof value === 'function';
}

export function resolveValue<T>(value: MaybeAccessor<T>): T {
  return isAccessor(value) ? value() : value;
}
