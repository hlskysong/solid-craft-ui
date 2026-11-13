/**
 * `useTableEngine`（T3-01 基座 + T3-02 排序 / 筛选）：Table 的**单一状态真源**。
 *
 * `docs/04 §5.1` 把「受控状态与内部状态混用」列为 Table 的首要风险，要求统一用
 * `useTableEngine` 管理。本层把全部入参 + 非受控内部信号收敛成**一个** `createMemo`
 * 状态快照：视图只读 `state()`、只调引擎方法，不自己建 signal、不散读 props。
 * 排序 / 筛选 / 筛选面板开合都在这里，T3-03 选择与 T3-06 分页继续往 `TableState`
 * 加字段即可。
 *
 * 受控优先级与 Select 一致（`value > defaultValue > 内部信号`）：
 * `sorter` / `filters` 给了就完全受控，点击只发 `onChange` 不改内部状态；
 * 未给时用 `defaultSorter` / `defaultFilters` 作为内部信号初值。两者互不覆盖，
 * 任意一次变更都从当前 `state()` 快照算出「排序 + 筛选」的完整新值再发出。
 *
 * `server` 模式只发参数、不本地改数据：`rows` 保持原始顺序与行数，由调用方
 * 按 `onChange` 的参数自行请求并回写 `data`（`docs/04 §5.1` 关键风险第 3 条）。
 *
 * 纯计算、零 DOM 依赖：模块顶层不访问 `window` / `document` / 当前时间，
 * 比较器用确定性码点 / 数值比较而非 `localeCompare`（避免 SSR 与浏览器
 * ICU 差异造成 hydration 差），`renderToString` 两次输出逐字一致。
 */
import { createMemo, createSignal, type Accessor } from 'solid-js';

import type {
  TableAlign,
  TableChange,
  TableColumn,
  TableDensity,
  TableFilterDropdownContext,
  TableFilterMode,
  TableFilters,
  TableProps,
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
  | 'onChange'
  | 'server'
  | 'multipleSorters'
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

/** 表格状态快照。后续任务的状态字段都加在这里，保持单一真源。 */
export interface TableState<T extends object> {
  columns: readonly ResolvedTableColumn<T>[];
  /** 实际渲染的行（客户端模式已应用筛选 + 排序；服务端模式等于原始数据）。 */
  rows: readonly T[];
  /** 全量行数；筛选 / 窗口化都不改变它（沿用属性契约登记表的既有语义）。 */
  totalRowCount: number;
  /** 当前视图行数；客户端筛选后会小于 `totalRowCount`。 */
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
}

/** 引擎句柄：状态快照 + 行键 / 单元格取值 / 排序筛选动作的唯一实现。 */
export interface TableEngine<T extends object> {
  state: Accessor<TableState<T>>;
  rowKeyOf: (row: T, index: number) => string;
  cellValue: (row: T, column: ResolvedTableColumn<T>) => unknown;
  cellText: (row: T, column: ResolvedTableColumn<T>) => string;
  toggleSort: (columnKey: string) => void;
  setFilterValues: (columnKey: string, values: readonly string[]) => void;
  setOpenFilterKey: (key: string | undefined) => void;
  filterDropdownContext: (columnKey: string) => TableFilterDropdownContext;
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
  // 非受控内部状态只在 setup 期初值化一次；受控模式下这两个 signal 不参与 state()。
  const [internalSorters, setInternalSorters] = createSignal<TableSorter>(
    normalizeSorters(options.defaultSorter),
  );
  const [internalFilters, setInternalFilters] = createSignal<TableFilters>({
    ...options.defaultFilters,
  });
  // 筛选面板开合是 UI 交互态，同样收进引擎，避免视图里再长出一个 signal。
  const [openFilterKey, setOpenFilterKey] = createSignal<string | undefined>(undefined);

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
    const rows = server
      ? rawRows
      : applySorters(applyFilters(rawRows, filters, resolvedColumns), sorters, resolvedColumns);
    return {
      columns: resolvedColumns,
      rows,
      totalRowCount: rawRows.length,
      viewRowCount: rows.length,
      rowKey: options.rowKey,
      loading: options.loading === true,
      bordered: options.bordered === true,
      size: options.size ?? 'medium',
      density: options.density ?? 'default',
      sorters,
      filters,
      server,
      multipleSorters: options.multipleSorters === true,
      openFilterKey: openFilterKey(),
    };
  });

  /** 统一出口：任何一次变更都带出「排序 + 筛选」完整快照，不互相覆盖。 */
  const emit = (sorters: TableSorter, filters: TableFilters): void => {
    const change: TableChange = { filters, sorter: sorters, pagination: undefined };
    options.onChange?.(change);
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
    emit(next, current.filters);
  };

  const setFilterValues = (columnKey: string, values: readonly string[]): void => {
    const current = state();
    const next: TableFilters = { ...current.filters };
    if (values.length === 0) delete next[columnKey];
    else next[columnKey] = values;
    if (options.filters === undefined) setInternalFilters(next);
    emit(current.sorters, next);
  };

  const filterDropdownContext = (columnKey: string): TableFilterDropdownContext => ({
    columnKey,
    selectedValues: state().filters[columnKey] ?? [],
    setSelectedValues: (values) => setFilterValues(columnKey, values),
    confirm: () => setOpenFilterKey(undefined),
    reset: () => setFilterValues(columnKey, []),
  });

  const rowKeyOf = (row: T, index: number): string => {
    const key = state().rowKey;
    if (key === undefined) return String(index);
    return toText(readCell(row, key)) || String(index);
  };

  const cellValue = (row: T, column: ResolvedTableColumn<T>): unknown =>
    readCell(row, column.dataIndex);

  const cellText = (row: T, column: ResolvedTableColumn<T>): string =>
    toText(cellValue(row, column));

  return {
    state,
    rowKeyOf,
    cellValue,
    cellText,
    toggleSort,
    setFilterValues,
    setOpenFilterKey,
    filterDropdownContext,
  };
}
