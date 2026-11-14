/**
 * `useTableEngine`（T3-01 基座 + T3-02 排序 / 筛选 + T3-03 行选择 + T3-06 分页）：
 * Table 的**单一状态真源**。
 *
 * `docs/04 §5.1` 把「受控状态与内部状态混用」列为 Table 的首要风险，要求统一用
 * `useTableEngine` 管理。本层把全部入参 + 非受控内部信号收敛成**一个** `createMemo`
 * 状态快照：视图只读 `state()`、只调引擎方法，不自己建 signal、不散读 props。
 * 排序 / 筛选 / 行选择 / 筛选面板开合 / 分页全在这里。
 *
 * T3-06 的分页只复用 `Pagination` 引擎导出的 `getPageCount` / `clampPage` /
 * `normalizePositive` / `normalizeTotal` 四个纯函数，**不复制一套页码收敛逻辑**；
 * `PaginationChange` 与 `TablePaginationState` 同形，因此一次分页变更可以原样
 * 放进 `TableChange.pagination`。
 *
 * 受控优先级与 Select 一致（`value > defaultValue > 内部信号`）：
 * `sorter` / `filters` / `rowSelection.selectedRowKeys` 给了就完全受控，
 * 点击只发回调不改内部状态；未给时用 `defaultSorter` / `defaultFilters` /
 * `defaultSelectedRowKeys` 作为内部信号初值。三者互不覆盖，任意一次变更都从
 * 当前 `state()` 快照算出完整新值再发出。
 *
 * `server` 模式只发参数、不本地改数据：`rows` 保持原始顺序与行数，由调用方
 * 按 `onChange` 的参数自行请求并回写 `data`（`docs/04 §5.1` 关键风险第 3 条）。
 *
 * 纯计算、零 DOM 依赖：模块顶层不访问 `window` / `document` / 当前时间，
 * 比较器用确定性码点 / 数值比较而非 `localeCompare`（避免 SSR 与浏览器
 * ICU 差异造成 hydration 差），`renderToString` 两次输出逐字一致。
 */
import { createEffect, createMemo, createSignal, type Accessor } from 'solid-js';

import type { PaginationChange } from '../pagination';
import {
  clampPage,
  getPageCount,
  normalizePositive,
  normalizeTotal,
} from '../pagination/pagination-engine';
import type {
  TableAlign,
  TableChange,
  TableColumn,
  TableDensity,
  TableFilterDropdownContext,
  TableFilterMode,
  TableFilters,
  TablePaginationConfig,
  TablePaginationState,
  TableProps,
  TableSelectionType,
  TableSize,
  TableSortDirection,
  TableSorter,
} from './types';

/** 引擎需要的入参子集；`<Table>` 用 `splitProps` 后直接传入。 */
export type TableEngineOptions<T extends object> = Pick<
  TableProps<T>,
  | 'columns'
  | 'data'
  | 'rowKey'
  | 'loading'
  | 'bordered'
  | 'size'
  | 'density'
  | 'sorter'
  | 'defaultSorter'
  | 'filters'
  | 'defaultFilters'
  | 'rowSelection'
  | 'onChange'
  | 'server'
  | 'multipleSorters'
  | 'pagination'
>;

/** 归一化后的列：`key` / `align` / 能力标记必有值，`width` 统一成 CSS 长度文本。 */
export interface ResolvedTableColumn<T extends object> extends TableColumn<T> {
  key: string;
  align: TableAlign;
  width?: string;
  /** 声明了 `sorter` 且为 `true` 或自定义比较器。 */
  sortable: boolean;
  /** 声明了内置 `filters` 或自定义 `filterDropdown`。 */
  filterable: boolean;
  filterMode: TableFilterMode;
}

/** 分页的展示配置（非状态），归一后随快照一起给视图，避免视图散读 props。 */
export interface TablePaginationView {
  showSizeChanger: boolean;
  showQuickJumper: boolean;
  showTotal: TablePaginationConfig['showTotal'];
  pageSizeOptions: readonly number[] | undefined;
}

/** 表格状态快照。后续任务的状态字段都加在这里，保持单一真源。 */
export interface TableState<T extends object> {
  columns: readonly ResolvedTableColumn<T>[];
  /** 实际渲染的行（客户端模式已应用筛选 + 排序 + **当前页切片**；服务端模式等于原始数据）。 */
  rows: readonly T[];
  /** 全量行数；筛选 / 分页都不改变它（沿用属性契约登记表的既有语义）。 */
  totalRowCount: number;
  /** 筛选 + 排序后、分页前的行数；客户端模式下它就是分页的 `total`。 */
  viewRowCount: number;
  rowKey: string | undefined;
  loading: boolean;
  bordered: boolean;
  size: TableSize;
  density: TableDensity;
  sorters: TableSorter;
  filters: TableFilters;
  server: boolean;
  multipleSorters: boolean;
  openFilterKey: string | undefined;
  /** 完整分页快照；未启用分页时为 `undefined`，也是 `TableChange.pagination` 的值。 */
  pagination: TablePaginationState | undefined;
  /** 分页展示配置；与 `pagination` 同生同灭。 */
  paginationView: TablePaginationView | undefined;
  /** 视图是否为空（无行且非加载态），供空态占位判断。 */
  empty: boolean;
  /** 行选择模式；`undefined` 表示未启用（不渲染选择列）。 */
  selectionType: TableSelectionType | undefined;
  /** 当前选中行键（归一后）；radio 模式恒 ≤ 1 项。 */
  selectedKeys: readonly string[];
  /** 选中键集合，供视图 O(1) 判定行选中态。 */
  selectedKeySet: ReadonlySet<string>;
  /** 当前视图内可选中行的键（已排除禁用行）；全选 / 半选的分母。 */
  selectableKeys: readonly string[];
  /** 可选行是否全部选中；没有任何可选行时为 `false`。 */
  allSelected: boolean;
  /** 半选：有可选行已选中但未全选（对应 `aria-checked="mixed"`）。 */
  someSelected: boolean;
}

/** 引擎句柄：状态快照 + 行键 / 单元格取值 / 排序筛选 / 行选择的唯一实现。 */
export interface TableEngine<T extends object> {
  state: Accessor<TableState<T>>;
  rowKeyOf: (row: T, index: number) => string;
  cellValue: (row: T, column: ResolvedTableColumn<T>) => unknown;
  cellText: (row: T, column: ResolvedTableColumn<T>) => string;
  toggleSort: (columnKey: string) => void;
  setFilterValues: (columnKey: string, values: readonly string[]) => void;
  setOpenFilterKey: (key: string | undefined) => void;
  filterDropdownContext: (columnKey: string) => TableFilterDropdownContext;
  isRowSelected: (row: T, index: number) => boolean;
  isRowDisabled: (row: T, index: number) => boolean;
  toggleRow: (row: T, index: number) => void;
  toggleAll: () => void;
  /** `Pagination` 的唯一回流口：把同形的 `PaginationChange` 合流成三参快照。 */
  changePagination: (change: PaginationChange) => void;
}

const widthText = (width: number | string | undefined): string | undefined => {
  if (width === undefined) return undefined;
  return typeof width === 'number' ? `${width}px` : width;
};

/** 把列配置补全成视图可直接消费的形态；不修改调用方传入的数组。 */
export function resolveColumns<T extends object>(
  columns: readonly TableColumn<T>[],
): readonly ResolvedTableColumn<T>[] {
  return columns.map((column, index) => ({
    ...column,
    key: column.key ?? column.dataIndex ?? `col-${index}`,
    align: column.align ?? 'left',
    width: widthText(column.width),
    sortable: column.sorter === true || typeof column.sorter === 'function',
    filterable: (column.filters?.length ?? 0) > 0 || column.filterDropdown !== undefined,
    filterMode: column.filterMode ?? 'multiple',
  }));
}

/** 从行对象按 `dataIndex` 取值；用 Reflect.get 免掉一次泛型→Record 的类型断言。 */
export function readCell<T extends object>(row: T, dataIndex: string | undefined): unknown {
  if (dataIndex === undefined) return undefined;
  return Reflect.get(row, dataIndex);
}

/**
 * 默认文本化只认原始值；对象 / 数组交给列配置的 `render`，不猜它们的显示格式。
 * 直接对 `unknown` 调 `String()` 会踩 oxlint `no-base-to-string`（产出 `[object Object]`）。
 */
const toText = (value: unknown): string => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return '';
};

/** 排序入参归一：丢掉空 key / 非法方向，并复制一份，避免调用方后续改动穿透进来。 */
export function normalizeSorters(value: TableSorter | undefined): TableSorter {
  if (value === undefined) return [];
  return value
    .filter(
      (item) =>
        item.columnKey.length > 0 && (item.direction === 'asc' || item.direction === 'desc'),
    )
    .map((item) => ({ columnKey: item.columnKey, direction: item.direction }));
}

/**
 * 选中键归一：复制一份。调用方常用 `[...keys, key]` 的写法，但也会直接持有数组
 * 后 `push` / `splice` —— 复制后组件状态不会被外部悄悄改写。
 */
export function normalizeSelectedKeys(value: readonly string[] | undefined): readonly string[] {
  if (value === undefined) return [];
  return [...value];
}

/** 行键推导：`rowKey` 缺省、或取到的文本为空时按行序号兜底（与 `rowKeyOf` 同源）。 */
const keyAt = <T extends object>(row: T, index: number, rowKey: string | undefined): string =>
  rowKey === undefined ? String(index) : toText(readCell(row, rowKey)) || String(index);

/**
 * 确定性比较：数字按数值、其余按文本码点。刻意不用 `localeCompare` —— 中文排序
 * 规则依赖 ICU 版本，服务端与浏览器可能给出不同顺序，进而造成 hydration 差。
 * 需要按拼音 / 业务规则排序的列请传 `sorter: (a, b) => number`。
 */
const compareValues = (a: unknown, b: unknown): number => {
  if (a === b) return 0;
  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a < b ? -1 : a > b ? 1 : 0;
  const left = toText(a);
  const right = toText(b);
  return left < right ? -1 : left > right ? 1 : 0;
};

/** 按筛选状态过滤行；多列之间是 AND，单列内多值是 OR。 */
export function applyFilters<T extends object>(
  rows: readonly T[],
  filters: TableFilters,
  columns: readonly ResolvedTableColumn<T>[],
): readonly T[] {
  const active = columns.filter((column) => (filters[column.key]?.length ?? 0) > 0);
  if (active.length === 0) return rows;
  return rows.filter((row) =>
    active.every((column) => {
      const selected = filters[column.key] ?? [];
      return selected.includes(toText(readCell(row, column.dataIndex)));
    }),
  );
}

/** 按有序排序状态排序；多列按数组顺序逐个比较，第一个非零结果即定序。 */
export function applySorters<T extends object>(
  rows: readonly T[],
  sorters: TableSorter,
  columns: readonly ResolvedTableColumn<T>[],
): readonly T[] {
  if (sorters.length === 0) return rows;
  const specs: { column: ResolvedTableColumn<T>; direction: TableSortDirection }[] = [];
  for (const sorter of sorters) {
    const column = columns.find((item) => item.key === sorter.columnKey);
    if (column !== undefined && column.sortable) {
      specs.push({ column, direction: sorter.direction });
    }
  }
  if (specs.length === 0) return rows;
  return [...rows].sort((left, right) => {
    for (const spec of specs) {
      const cmp =
        typeof spec.column.sorter === 'function'
          ? spec.column.sorter(left, right)
          : compareValues(
              readCell(left, spec.column.dataIndex),
              readCell(right, spec.column.dataIndex),
            );
      if (cmp !== 0) return spec.direction === 'desc' ? -cmp : cmp;
    }
    return 0;
  });
}

/**
 * 创建 Table 引擎。必须在 Solid 的 owner 内调用（`createMemo` / `createSignal`
 * 需要响应式上下文）。视图只消费返回的句柄，不复制状态。
 */
export function useTableEngine<T extends object>(options: TableEngineOptions<T>): TableEngine<T> {
  /** `pagination={false}` / 不传 = 未启用；用函数读 props，保证后续传入配置也能生效。 */
  const pag = (): TablePaginationConfig | undefined => {
    const value = options.pagination;
    return value === false || value === undefined ? undefined : value;
  };

  // 非受控内部状态只在 setup 期初值化一次；受控模式下这些 signal 不参与 state()。
  const [internalSorters, setInternalSorters] = createSignal<TableSorter>(
    normalizeSorters(options.defaultSorter),
  );
  const [internalFilters, setInternalFilters] = createSignal<TableFilters>({
    ...options.defaultFilters,
  });
  // 筛选面板开合是 UI 交互态，同样收进引擎，避免视图里再长出一个 signal。
  const [openFilterKey, setOpenFilterKey] = createSignal<string | undefined>(undefined);
  // 非受控行选择：只在 setup 期读一次 defaultSelectedRowKeys。
  const [internalSelectedKeys, setInternalSelectedKeys] = createSignal<readonly string[]>(
    normalizeSelectedKeys(options.rowSelection?.defaultSelectedRowKeys),
  );
  // 分页的两个非受控信号；与 Pagination 同口径，初值只在这里读一次。
  const initialPage = pag();
  const [internalPage, setInternalPage] = createSignal(
    normalizePositive(initialPage?.defaultCurrent ?? 1, 1),
  );
  const [internalPageSize, setInternalPageSize] = createSignal(
    normalizePositive(initialPage?.defaultPageSize ?? 10, 10),
  );

  // 列归一化单独一层 memo：`<For each={state().columns}>` 按 item 引用做 keyed diff，
  // 若把它塞进 state 的每次重算里，一次筛选点击就会重建整张表头（连筛选面板里的
  // input 一起脱管、焦点丢失）。只有调用方真的换了 columns 才允许重算。
  const columns = createMemo(() => resolveColumns(options.columns ?? []));

  const state = createMemo<TableState<T>>(() => {
    const resolvedColumns = columns();
    const rawRows = options.data ?? [];
    const sorters =
      options.sorter === undefined ? internalSorters() : normalizeSorters(options.sorter);
    const filters = options.filters === undefined ? internalFilters() : { ...options.filters };
    const server = options.server === true;
    // 判据 4e 钉住这个三元：server 模式只出参数、不本地改数据（行数与顺序都不动）。
    const rows = server
      ? rawRows
      : applySorters(applyFilters(rawRows, filters, resolvedColumns), sorters, resolvedColumns);

    // 分页状态复用 Pagination 引擎的四个纯函数收敛，不另写一套页码算法。
    const config = pag();
    const pageSize = normalizePositive(
      config === undefined ? 10 : (config.pageSize ?? internalPageSize()),
      10,
    );
    // 客户端模式数据就在手里，total 恒等于筛选 + 排序后的行数；服务端模式由调用方给。
    // 客户端允许传 total 必然产生「页码说有 50 条、表里只有 12 行」的不一致，故忽略。
    const total =
      config === undefined
        ? rows.length
        : server
          ? normalizeTotal(config.total ?? rows.length)
          : rows.length;
    const current = clampPage(
      config === undefined ? 1 : (config.current ?? internalPage()),
      getPageCount(total, pageSize),
    );
    const pagination: TablePaginationState | undefined =
      config === undefined ? undefined : { current, pageSize, total };
    const start = (current - 1) * pageSize;
    // 服务端模式**不切数据**：调用方按 onChange 的参数请求后回写 data。
    const viewRows =
      pagination === undefined || server ? rows : rows.slice(start, start + pageSize);
    const paginationView: TablePaginationView | undefined =
      config === undefined
        ? undefined
        : {
            showSizeChanger: config.showSizeChanger === true,
            showQuickJumper: config.showQuickJumper === true,
            showTotal: config.showTotal,
            pageSizeOptions: config.pageSizeOptions,
          };

    const rowSelection = options.rowSelection;
    const selectionType: TableSelectionType | undefined =
      rowSelection === undefined ? undefined : (rowSelection.type ?? 'checkbox');
    const declaredKeys =
      rowSelection?.selectedRowKeys === undefined
        ? internalSelectedKeys()
        : normalizeSelectedKeys(rowSelection.selectedRowKeys);
    // radio 同 name 下只能有一个 checked；受控值给了多个时只认首个，避免非法 DOM。
    const selectedKeys: readonly string[] =
      selectionType === 'radio' ? declaredKeys.slice(0, 1) : declaredKeys;
    const selectedKeySet = new Set(selectedKeys);
    // 全选 / 半选的分母只算「**当前页**且未禁用」的行：表头控件从 T3-03 起就叫
    // 「全选当前页」，分页后拿全量数据当分母会让半选态永远差一票。
    const selectableKeys: string[] = [];
    for (let index = 0; index < viewRows.length; index += 1) {
      const row = viewRows[index];
      if (row === undefined) continue;
      if (rowSelection?.isRowDisabled?.(row, index) === true) continue;
      selectableKeys.push(keyAt(row, index, options.rowKey));
    }
    const selectedSelectableCount = selectableKeys.filter((key) => selectedKeySet.has(key)).length;
    const allSelected =
      selectableKeys.length > 0 && selectedSelectableCount === selectableKeys.length;
    const someSelected = selectedSelectableCount > 0 && !allSelected;
    const loading = options.loading === true;
    return {
      columns: resolvedColumns,
      rows: viewRows,
      totalRowCount: rawRows.length,
      viewRowCount: rows.length,
      rowKey: options.rowKey,
      loading,
      bordered: options.bordered === true,
      size: options.size ?? 'medium',
      density: options.density ?? 'default',
      sorters,
      filters,
      server,
      multipleSorters: options.multipleSorters === true,
      openFilterKey: openFilterKey(),
      pagination,
      paginationView,
      empty: viewRows.length === 0 && !loading,
      selectionType,
      selectedKeys,
      selectedKeySet,
      selectableKeys,
      allSelected,
      someSelected,
    };
  });

  // 分页双层收敛的第二步：非受控时把越界 / 非法的内部值真正写回合法值。
  // 只有渲染期 clamp 会让内部信号一直脏着，数据恢复后页码又跳回越界值；
  // 受控值归调用方所有，这里不改写（与 Pagination 引擎同口径）。
  createEffect(() => {
    const snapshot = state().pagination;
    const config = pag();
    if (snapshot === undefined || config === undefined) return;
    if (config.current === undefined && internalPage() !== snapshot.current) {
      setInternalPage(snapshot.current);
    }
    if (config.pageSize === undefined && internalPageSize() !== snapshot.pageSize) {
      setInternalPageSize(snapshot.pageSize);
    }
  });

  /**
   * 统一出口：任何一次变更都带出「排序 + 筛选 + 分页」完整三参快照，不互相覆盖。
   * `pagination` 由调用方显式给出而不是从 `state()` 里捞：受控模式下点击第 3 页，
   * 组件内部状态仍是第 1 页，从 state 读会把旧页码发给业务侧。
   */
  const emit = (
    sorters: TableSorter,
    filters: TableFilters,
    pagination: TablePaginationState | undefined,
  ): void => {
    const change: TableChange = { filters, sorter: sorters, pagination };
    options.onChange?.(change);
  };

  /**
   * 筛选变化把页码归一到 1。
   *
   * 服务端模式下 `onChange` 是业务侧唯一的请求参数：筛选把结果从 50 条缩到 3 条时
   * 若仍带旧页码 5，请求会直接落到空页，而 Table 并不知道新的 total，越界收敛
   * 在这里帮不上忙。排序不改变结果集，因此保留当前页。
   *
   * 非受控时同步写回内部信号，否则下一次翻页会从旧基准算起；受控值归调用方，
   * 只把 1 作为「建议页码」带出去，视图仍按调用方给的值显示（与 Pagination
   * 受控语义一致）。
   */
  const resetPageAfterFilter = (
    pagination: TablePaginationState | undefined,
  ): TablePaginationState | undefined => {
    if (pagination === undefined || pagination.current === 1) return pagination;
    if (pag()?.current === undefined) setInternalPage(1);
    return { ...pagination, current: 1 };
  };

  /** `Pagination` 的回流：同形的三字段原样合流，业务侧不再二次翻译。 */
  const changePagination = (change: PaginationChange): void => {
    const current = state();
    const config = pag();
    if (config === undefined) return;
    if (config.current === undefined) setInternalPage(change.current);
    if (config.pageSize === undefined) setInternalPageSize(change.pageSize);
    emit(current.sorters, current.filters, {
      current: change.current,
      pageSize: change.pageSize,
      total: change.total,
    });
  };

  const toggleSort = (columnKey: string): void => {
    const current = state();
    const column = current.columns.find((item) => item.key === columnKey);
    if (column === undefined || !column.sortable) return;
    const existing = current.sorters.find((item) => item.columnKey === columnKey);
    const direction: TableSortDirection | undefined =
      existing === undefined ? 'asc' : existing.direction === 'asc' ? 'desc' : undefined;
    const others = current.multipleSorters
      ? current.sorters.filter((item) => item.columnKey !== columnKey)
      : [];
    const next: TableSorter =
      direction === undefined ? others : [...others, { columnKey, direction }];
    if (options.sorter === undefined) setInternalSorters(next);
    emit(next, current.filters, current.pagination);
  };

  const setFilterValues = (columnKey: string, values: readonly string[]): void => {
    const current = state();
    const next: TableFilters = { ...current.filters };
    if (values.length === 0) delete next[columnKey];
    else next[columnKey] = values;
    if (options.filters === undefined) setInternalFilters(next);
    // 必须取**筛选后**的快照：客户端模式下 total 恒等于筛选后行数，若沿用变化前的
    // current.pagination，业务侧会拿着旧 total 去请求（筛选 12 → 6 条却仍报 12）。
    // 受控 filters 时 state 不重算，total 由调用方回写后自然更新，符合受控语义。
    const after = state();
    emit(after.sorters, next, resetPageAfterFilter(after.pagination));
  };

  const filterDropdownContext = (columnKey: string): TableFilterDropdownContext => ({
    columnKey,
    selectedValues: state().filters[columnKey] ?? [],
    setSelectedValues: (values) => setFilterValues(columnKey, values),
    confirm: () => setOpenFilterKey(undefined),
    reset: () => setFilterValues(columnKey, []),
  });

  /** 行级禁用判定：只读 `rowSelection.isRowDisabled`，不参与状态快照。 */
  const rowDisabled = (row: T, index: number): boolean =>
    options.rowSelection?.isRowDisabled?.(row, index) === true;

  /**
   * 选择变更统一出口：受控时不写内部信号，只回调；`rows` 按当前 `data` 解析，
   * 受控值里含视图外 key 时长度会短于 `keys`（不伪造行对象）。
   */
  const commitSelection = (next: readonly string[]): void => {
    const config = options.rowSelection;
    if (config === undefined) return;
    if (config.selectedRowKeys === undefined) setInternalSelectedKeys(next);
    const keySet = new Set(next);
    const data = options.data ?? [];
    const matched: T[] = [];
    for (let index = 0; index < data.length; index += 1) {
      const row = data[index];
      if (row === undefined) continue;
      if (keySet.has(keyAt(row, index, options.rowKey))) matched.push(row);
    }
    config.onChange?.(next, matched);
  };

  const toggleRow = (row: T, index: number): void => {
    const current = state();
    if (current.selectionType === undefined) return;
    if (rowDisabled(row, index)) return;
    const key = keyAt(row, index, options.rowKey);
    const next: readonly string[] =
      current.selectionType === 'radio'
        ? [key]
        : current.selectedKeys.includes(key)
          ? current.selectedKeys.filter((item) => item !== key)
          : [...current.selectedKeys, key];
    commitSelection(next);
  };

  const toggleAll = (): void => {
    const current = state();
    // 全选只属于 checkbox；radio 语义上不存在「全选一行」。
    if (current.selectionType !== 'checkbox') return;
    const selectable = current.selectableKeys;
    if (selectable.length === 0) return;
    // 只动当前可选集合内的键：视图外残留键与禁用行的旧选中值原样保留，
    // 否则服务端分页下点一次全选就会把别的页选中状态清掉。
    const selectableSet = new Set(selectable);
    const outside = current.selectedKeys.filter((key) => !selectableSet.has(key));
    commitSelection(current.allSelected ? outside : [...outside, ...selectable]);
  };

  const rowKeyOf = (row: T, index: number): string => keyAt(row, index, state().rowKey);

  const cellValue = (row: T, column: ResolvedTableColumn<T>): unknown =>
    readCell(row, column.dataIndex);

  const cellText = (row: T, column: ResolvedTableColumn<T>): string =>
    toText(cellValue(row, column));

  const isRowSelected = (row: T, index: number): boolean =>
    state().selectedKeySet.has(keyAt(row, index, options.rowKey));

  return {
    state,
    rowKeyOf,
    cellValue,
    cellText,
    toggleSort,
    setFilterValues,
    setOpenFilterKey,
    filterDropdownContext,
    isRowSelected,
    isRowDisabled: rowDisabled,
    toggleRow,
    toggleAll,
    changePagination,
  };
}
