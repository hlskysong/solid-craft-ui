/**
 * `Pagination` 的公共类型（T3-04）。
 *
 * 范围按 `docs/04 §4` 的 P0 能力：页码、每页条数、快速跳转、受控 / 非受控。
 * `docs/04 §5.1` 另有一条约束：Table 的事件是 `onChange({ pagination, filters, sorter })`，
 * 而 **`Pagination` 组件自身仍提供 `onChange`** —— 两者互不覆盖。为此本文件的
 * `PaginationChange` 与 Table 的 `TablePaginationState` 保持**同形**
 * （`current` / `pageSize` / `total`），T3-06 把一次分页变更直接放进
 * `TableChange.pagination` 即可，无需业务侧二次翻译。
 *
 * R3 说明：`current` / `pageSize` / `total` 等都是**值型**，所以用
 * `MaybeAccessor<T>`（支持传值或 getter）；`onChange` / `showTotal` 是函数型，
 * **不加** `MaybeAccessor` —— `typeof value === 'function'` 无法区分「值」与「getter」。
 */
import type { JSX } from 'solid-js';

import type { MaybeAccessor } from '../../utils/resolve-value';

/** 尺寸口径与全局一致：只有 small / medium / large，不存在 sm / md。 */
export type PaginationSize = 'small' | 'medium' | 'large';

/** 每页条数的候选值。 */
export type PaginationPageSizeOptions = readonly number[];

/**
 * 一次分页变更的出参。
 *
 * 三个字段一次性给全，调用方不需要「猜当前 total」或「记上一次的 pageSize」；
 * 与 `TableChange.pagination` 同形，Table 集成时直接透传。
 */
export interface PaginationChange {
  /** 变更后的当前页，恒为 `1 ≤ current ≤ pageCount`。 */
  current: number;
  /** 变更后的每页条数。 */
  pageSize: number;
  /** 总条数（原样回传，便于服务端请求直接拼参数）。 */
  total: number;
}

/** 分页变更回调。 */
export type PaginationChangeHandler = (change: PaginationChange) => void;

/**
 * 页码列表里的一项。
 *
 * 省略号也是列表项：它占位但不接受点击，因此带 `type` 区分，
 * 并给出稳定 `key` 供 `<For>` 做 keyed diff（避免重渲染时整列重建）。
 */
export interface PaginationItem {
  /** 稳定标识：`page-3` / `gap-left` / `gap-right`。 */
  key: string;
  /** `page` 是可点击页码，`gap` 是省略号占位。 */
  type: 'page' | 'gap';
  /** `type === 'page'` 时的页码；`gap` 时无意义。 */
  page: number;
}

/** `Pagination` 的入参。 */
export interface PaginationProps extends Omit<
  JSX.HTMLAttributes<HTMLElement>,
  'children' | 'onChange' | 'style'
> {
  /**
   * 总条数；`0` 时页码列表只剩第 1 页且上一页 / 下一页全部禁用。
   * @default 0
   */
  total?: MaybeAccessor<number>;
  /**
   * 受控当前页；给了就完全受控，点击只发 `onChange` 不改内部状态。
   * 越界值在渲染时收敛到 `[1, pageCount]`，不会输出越界页码。
   * @default undefined（非受控）
   */
  current?: MaybeAccessor<number>;
  /**
   * 非受控初始页码；仅在挂载时读取一次。
   * @default 1
   */
  defaultCurrent?: MaybeAccessor<number>;
  /**
   * 受控每页条数。
   * @default undefined（非受控）
   */
  pageSize?: MaybeAccessor<number>;
  /**
   * 非受控初始每页条数；仅在挂载时读取一次。
   * @default 10
   */
  defaultPageSize?: MaybeAccessor<number>;
  /**
   * 每页条数候选值；`showSizeChanger` 开启时渲染成原生下拉。
   * @default [10, 20, 50, 100]
   */
  pageSizeOptions?: MaybeAccessor<PaginationPageSizeOptions>;
  /**
   * 是否显示每页条数切换器。
   * @default false
   */
  showSizeChanger?: MaybeAccessor<boolean>;
  /**
   * 是否显示快速跳转输入框（Enter 提交，越界收敛）。
   * @default false
   */
  showQuickJumper?: MaybeAccessor<boolean>;
  /**
   * 总数文案渲染函数；返回 `JSX.Element`，由调用方决定语言与排版。
   * 拿到的是区间而不是单个数字，避免调用方自己算 `(current - 1) * pageSize`。
   * @default undefined（不渲染）
   */
  showTotal?: (total: number, range: readonly [number, number]) => JSX.Element;
  /**
   * 禁用整个分页：全部控件原生 `disabled`，点击不触发 `onChange`。
   * @default false
   */
  disabled?: MaybeAccessor<boolean>;
  /**
   * 尺寸。
   * @default 'medium'
   */
  size?: PaginationSize;
  /**
   * 分页变更回调；页码与每页条数共用这一个出口。
   * @default undefined
   */
  onChange?: PaginationChangeHandler;
  /**
   * 可访问名称，落在 `<nav>` 上。
   * @default '分页'
   */
  'aria-label'?: string;
  /**
   * 根节点样式；与 `class` 一样合并而非覆盖。
   */
  style?: string;
}
