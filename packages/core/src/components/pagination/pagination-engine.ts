/**
 * `usePaginationEngine`（T3-04）：`Pagination` 的**单一状态真源**。
 *
 * 三件容易出错的活都在这一层收口：
 *
 * 1. **页码收敛**。「总页数变化时当前页不越界」是 T3-04 的验收首条。做法是双层：
 *    - 渲染期 `clampPage(...)` 保证任何时刻输出的页码都在 `[1, pageCount]` 内
 *      （SSR 也走这条路径，所以服务端首帧就不会吐越界页码）；
 *    - 非受控时再用一个 `createEffect` 把内部信号真正写回合法值，避免「数据恢复后
 *      页码又跳回原来的越界值」。两步缺一：只有 effect 会让 SSR / 首帧短暂越界，
 *      只有 clamp 会让内部状态一直脏着。
 *    受控时不回写 —— 受控值归调用方所有，擅自改写会制造「谁说了算」的歧义。
 *
 * 2. **受控优先级**（与 Select / Table 同口径）：`current` > `defaultCurrent` > 内部信号，
 *    `pageSize` 同理。受控时点击只发 `onChange`，内部信号一动不动。
 *
 * 3. **省略号窗口**。页码最多 7 个槽位（首页 + 末页 + 3 个数字页 + 最多 2 个省略号），
 *    贴边时向内补齐而不是把窗口压扁，避免「第 1 页时只显示 1 2 …」这种忽长忽短的抖动。
 *
 * 纯计算、零 DOM 依赖：模块顶层不访问 `window` / `document` / 当前时间，
 * `renderToString` 两次输出逐字一致。
 */
import { createEffect, createMemo, createSignal, type Accessor } from 'solid-js';

import { resolveValue } from '../../utils/resolve-value';
import type {
  PaginationChange,
  PaginationItem,
  PaginationPageSizeOptions,
  PaginationProps,
  PaginationSize,
} from './types';

/** 页码列表最多占几个槽位（含首页、末页与省略号）。 */
export const PAGE_ITEM_SLOTS = 7;

/** 每页条数默认候选值。 */
export const DEFAULT_PAGE_SIZE_OPTIONS: PaginationPageSizeOptions = [10, 20, 50, 100];

/** 引擎需要的入参子集；`<Pagination>` 用 `splitProps` 后直接传入。 */
export type PaginationEngineOptions = Pick<
  PaginationProps,
  | 'total'
  | 'current'
  | 'defaultCurrent'
  | 'pageSize'
  | 'defaultPageSize'
  | 'pageSizeOptions'
  | 'showSizeChanger'
  | 'showQuickJumper'
  | 'disabled'
  | 'size'
  | 'onChange'
>;

/** 引擎算出的状态快照；视图只读它，不自己算页码。 */
export interface PaginationState {
  /** 总条数（已归一为非负数）。 */
  total: number;
  /** 收敛后的当前页，恒在 `[1, pageCount]`。 */
  current: number;
  /** 每页条数，恒为正整数。 */
  pageSize: number;
  /** 总页数，至少 1（`total = 0` 时仍有一页可显示）。 */
  pageCount: number;
  /** 页码列表（含省略号占位）。 */
  items: readonly PaginationItem[];
  /** 当前页覆盖的条目区间；`total = 0` 时为 `[0, 0]`。 */
  range: readonly [number, number];
  /** 是否整体禁用。 */
  disabled: boolean;
  /** 尺寸档。 */
  size: PaginationSize;
  /** 每页条数候选值（已去重排序，且保证含当前值）。 */
  sizeOptions: readonly number[];
  /** 是否显示每页条数切换器。 */
  showSizeChanger: boolean;
  /** 是否显示快速跳转。 */
  showQuickJumper: boolean;
}

/** 引擎句柄：状态快照 + 页码动作的唯一实现。 */
export interface PaginationEngine {
  state: Accessor<PaginationState>;
  /** 跳到指定页；越界值收敛，同页不重复发事件。 */
  goTo: (page: number) => void;
  /** 上一页；已在首页时无操作。 */
  prev: () => void;
  /** 下一页；已在末页时无操作。 */
  next: () => void;
  /** 切换每页条数；当前页按新的总页数收敛。 */
  changePageSize: (size: number) => void;
  /**
   * 快速跳转输入框的草稿值。
   *
   * 单独一个 signal 而**不塞进** `state`：草稿每敲一个字符都变，放进快照会让
   * 页码列表跟着重算、`<For>` 整列重建；它是输入态，不是分页状态。
   */
  jumpDraft: Accessor<string>;
  /** 写入草稿值。 */
  setJumpDraft: (value: string) => void;
  /** 提交草稿：解析整数、越界收敛、清空草稿；非法输入只清空不跳页。 */
  submitJump: () => void;
}

/** 总条数归一：非有限数 / 负数一律按 0 处理，并取整。 */
export function normalizeTotal(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.floor(num);
}

/** 正数归一：非法值回落到 `fallback`，并取整。 */
export function normalizePositive(value: unknown, fallback: number): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.floor(num);
}

/** 总页数；`total = 0` 时仍返回 1，保证「至少有一页」的可视结构稳定。 */
export function getPageCount(total: number, pageSize: number): number {
  const size = normalizePositive(pageSize, 1);
  const count = normalizeTotal(total);
  if (count === 0) return 1;
  return Math.max(1, Math.ceil(count / size));
}

/** 页码收敛：截断小数并夹到 `[1, pageCount]`；非有限数回落到 1。 */
export function clampPage(page: number, pageCount: number): number {
  const max = Math.max(1, Math.floor(pageCount));
  if (!Number.isFinite(page)) return 1;
  return Math.min(Math.max(Math.trunc(page), 1), max);
}

/**
 * 生成页码列表。
 *
 * `pageCount <= 7` 时全量输出；否则固定 7 槽：首页 +（省略号）+ 中间数字页
 * +（省略号）+ 末页。中间窗口贴边时向内补齐到 3 个数字页，保证项数稳定。
 */
export function buildPageItems(current: number, pageCount: number): PaginationItem[] {
  const last = Math.max(1, Math.floor(pageCount));
  const active = clampPage(current, last);

  if (last <= PAGE_ITEM_SLOTS) {
    return Array.from({ length: last }, (_, index) => {
      const page = index + 1;
      return { key: `page-${page}`, type: 'page' as const, page };
    });
  }

  let start = Math.max(2, active - 1);
  let end = Math.min(last - 1, active + 1);
  if (start === 2) end = Math.min(last - 1, start + 2);
  if (end === last - 1) start = Math.max(2, end - 2);

  const items: PaginationItem[] = [{ key: 'page-1', type: 'page', page: 1 }];
  if (start > 2) items.push({ key: 'gap-left', type: 'gap', page: 0 });
  for (let page = start; page <= end; page += 1) {
    items.push({ key: `page-${page}`, type: 'page', page });
  }
  if (end < last - 1) items.push({ key: 'gap-right', type: 'gap', page: 0 });
  items.push({ key: `page-${last}`, type: 'page', page: last });
  return items;
}

/** 当前页覆盖的条目区间；`total = 0` 时为 `[0, 0]`。 */
export function getPageRange(
  current: number,
  pageSize: number,
  total: number,
): readonly [number, number] {
  const count = normalizeTotal(total);
  if (count === 0) return [0, 0];
  const size = normalizePositive(pageSize, 1);
  const page = clampPage(current, getPageCount(count, size));
  return [(page - 1) * size + 1, Math.min(page * size, count)];
}

export function usePaginationEngine(options: PaginationEngineOptions): PaginationEngine {
  // 「是否受控」是静态判定：只要调用方给了 prop 就受控，哪怕当次值是 undefined。
  const controlledCurrent = () => options.current !== undefined;
  const controlledPageSize = () => options.pageSize !== undefined;

  const [internalCurrent, setInternalCurrent] = createSignal(
    normalizePositive(resolveValue(options.defaultCurrent ?? 1), 1),
  );
  const [internalPageSize, setInternalPageSize] = createSignal(
    normalizePositive(resolveValue(options.defaultPageSize ?? 10), 10),
  );
  const [jumpDraft, setJumpDraft] = createSignal('');

  const total = createMemo(() => normalizeTotal(resolveValue(options.total ?? 0)));

  const pageSize = createMemo(() =>
    controlledPageSize()
      ? normalizePositive(resolveValue(options.pageSize), 10)
      : internalPageSize(),
  );

  const pageCount = createMemo(() => getPageCount(total(), pageSize()));

  const current = createMemo(() => {
    const raw = controlledCurrent()
      ? normalizePositive(resolveValue(options.current), 1)
      : internalCurrent();
    return clampPage(raw, pageCount());
  });

  // 非受控时把越界 / 非法的内部页码真正写回合法值。
  // 只写非受控：受控值归调用方所有，这里改写会制造「谁说了算」的歧义。
  createEffect(() => {
    const max = pageCount();
    if (!controlledCurrent() && internalCurrent() !== clampPage(internalCurrent(), max)) {
      setInternalCurrent(clampPage(internalCurrent(), max));
    }
  });

  const disabled = createMemo(() => resolveValue(options.disabled ?? false));
  const showSizeChanger = createMemo(() => resolveValue(options.showSizeChanger ?? false));
  const showQuickJumper = createMemo(() => resolveValue(options.showQuickJumper ?? false));
  const size = createMemo<PaginationSize>(() => options.size ?? 'medium');

  const sizeOptions = createMemo<readonly number[]>(() => {
    const raw = resolveValue(options.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS);
    const list = raw
      .filter((item) => Number.isFinite(item) && item > 0)
      .map((item) => Math.floor(item));
    const unique = [...new Set(list)];
    // 当前 pageSize 不在候选里时必须补进来：原生 <select> 的 value 对不上任何
    // option 时会显示第一项，看上去像「切了却没生效」。
    if (!unique.includes(pageSize())) unique.push(pageSize());
    // `unique` 是本地新建数组，就地排序不会穿透到调用方的 options；
    // 这里不用 toSorted：当前 tsconfig 的 lib 还没到 es2023（Table 同款写法）。
    return unique.sort((left, right) => left - right);
  });

  const state = createMemo<PaginationState>(() => {
    const active = current();
    return {
      total: total(),
      current: active,
      pageSize: pageSize(),
      pageCount: pageCount(),
      items: buildPageItems(active, pageCount()),
      range: getPageRange(active, pageSize(), total()),
      disabled: disabled(),
      size: size(),
      sizeOptions: sizeOptions(),
      showSizeChanger: showSizeChanger(),
      showQuickJumper: showQuickJumper(),
    };
  });

  const emit = (change: PaginationChange) => {
    options.onChange?.(change);
  };

  /**
   * 统一的提交口：先把 current 按**新的** pageCount 收敛，再落内部状态、再发事件。
   * 顺序不能反 —— 先发事件会让调用方拿到越界的 current。
   */
  const commit = (nextCurrent: number, nextPageSize: number) => {
    const nextMax = getPageCount(total(), nextPageSize);
    const page = clampPage(nextCurrent, nextMax);
    if (!controlledCurrent()) setInternalCurrent(page);
    if (!controlledPageSize()) setInternalPageSize(nextPageSize);
    emit({ current: page, pageSize: nextPageSize, total: total() });
  };

  const goTo = (page: number) => {
    if (disabled()) return;
    const snapshot = state();
    if (!Number.isFinite(page)) return;
    const next = clampPage(page, snapshot.pageCount);
    if (next === snapshot.current) return;
    commit(next, snapshot.pageSize);
  };

  const prev = () => {
    goTo(state().current - 1);
  };

  const next = () => {
    goTo(state().current + 1);
  };

  const changePageSize = (value: number) => {
    if (disabled()) return;
    const snapshot = state();
    const nextSize = normalizePositive(value, snapshot.pageSize);
    if (nextSize === snapshot.pageSize) return;
    commit(snapshot.current, nextSize);
  };

  const submitJump = () => {
    const draft = jumpDraft().trim();
    setJumpDraft('');
    if (draft === '') return;
    // 只认十进制整数：`parseInt('12abc')` 会得 12，那是「猜用户想跳 12 页」，
    // 越界与非法输入一样静默丢弃，避免把「跳转失败」演成「跳到了别处」。
    if (!/^\d+$/.test(draft)) return;
    goTo(Number(draft));
  };

  return { state, goTo, prev, next, changePageSize, jumpDraft, setJumpDraft, submitJump };
}
