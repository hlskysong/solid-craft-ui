import type { Accessor } from 'solid-js';

/**
 * 既可传值也可传 getter 的响应式入参类型。
 *
 * Solid 不做组件重渲染，getter 能保留细粒度追踪；静态场景直接传值即可。
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
