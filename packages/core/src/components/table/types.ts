/**
 * `Table` 的公共类型（T3-01 基座 + T3-02 排序 / 筛选 + T3-03 行选择）。
 *
 * 范围按 `docs/04 §5.1` 的 P0 基本能力与 `docs/08 §4.2` 的 T3-01~T3-03 验收列：
 * 列配置、data / rowKey / loading、尺寸、边框、三档密度、单列 / 多列排序、
 * 受控 / 非受控、内置筛选下拉与自定义 `filterDropdown`，以及 checkbox / radio
 * 行选择、全选 / 半选、禁用行、受控 `selectedRowKeys`。分页属于 T3-06，
 * 本层只在 `TableChange` 里把协议位定清。
 *
 * 响应式契约按 `docs/04 §6.4`：props 一律传值（调用方自己调用 accessor），
 * 不直接传 signal 函数；组件内部用 `useTableEngine` 把 props 收敛成单一状态
 * memo，视图只读引擎。因此这里**不使用** `MaybeAccessor<T>` —— 列配置里的
 * `render` / `sorter` / `filterDropdown` 都是函数类型，套 `MaybeAccessor`
 * 会踩 R3 的函数型禁用约束。
 *
 * 对外值只用字符串（R2 = A）：`rowKey` / `dataIndex` / 选项 `value` / 排序方向 /
 * 所有档位都是字符串键名或字符串字面量，不暴露 option 对象、不暴露函数型取值器。
 */
import type { JSX } from 'solid-js';

/** 表格尺寸档：影响行高，不改变字号档（表头与正文恒同档）。 */
export type TableSize = 'small' | 'medium' | 'large';

/**
 * 密度档，对应 `docs/04 §5.1` 的 `cellPaddingBlock` / `cellPaddingInline`：
 * `default` = 12 / 12（高密度基线）、`comfortable` = 16 / 16、`compact` = 8 / 8。
 */
export type TableDensity = 'comfortable' | 'default' | 'compact';

/** 列水平对齐。 */
export type TableAlign = 'left' | 'center' | 'right';

/** 排序方向；与 `data-scui-sort` 的取值同源。 */
export type TableSortDirection = 'asc' | 'desc';

/** 筛选模式：单选或复选。 */
export type TableFilterMode = 'single' | 'multiple';

/** 行键字段名；只接受字符串键名。 */
export type TableRowKey<T extends object> = Extract<keyof T, string>;

/** 单元格自定义渲染；`value` 是 `dataIndex` 取到的原始值。 */
export type TableCellRender<T extends object> = (
  value: unknown,
  row: T,
  index: number,
) => JSX.Element;

/** 自定义排序比较器；不给时按 `dataIndex` 的原始值做确定性码点 / 数值比较。 */
export type TableSorterFn<T extends object> = (a: T, b: T) => number;

/** 单列排序状态。`columnKey` 是 `TableColumn.key` 归一化后的字符串。 */
export interface TableSortState {
  /** 排序列标识。 */
  columnKey: string;
  /** 当前方向。 */
  direction: TableSortDirection;
}

/**
 * 有序排序状态集合：单列时 1 项、多列时多项、无排序时空数组。
 * 刻意不用 AntD 的「单列对象 / 多列数组」联合 —— Solid 下 props 一律传值，
 * 联合类型会让每个调用方在 `onChange` 里做一次无意义的类型收窄，且 SSR
 * 首帧需要确定的形状。`docs/04 §6.4` 只规定 `onChange` 单一出口，未规定形状。
 */
export type TableSorter = readonly TableSortState[];

/** 筛选状态：列 key → 选中的字符串值。空数组等价于未筛选。 */
export type TableFilters = Record<string, readonly string[]>;

/**
 * 分页协议位（`docs/04 §6.4` 的 `pagination={{ current, pageSize, total }}`）。
 * T3-02 把 `onChange` 的三参形状一次定清，但本批次恒发 `undefined`；
 * 真实分页参数由 T3-06 接入，避免业务侧各自拼协议。
 */
export interface TablePaginationState {
  current: number;
  pageSize: number;
  total: number;
}

/** `onChange` 的统一出参；排序 / 筛选 / 分页三者互不覆盖。 */
export interface TableChange {
  /** 当前生效的筛选状态。 */
  filters: TableFilters;
  /** 当前生效的有序排序状态。 */
  sorter: TableSorter;
  /** 分页参数；T3-02 恒为 `undefined`，T3-06 接入后才有值。 */
  pagination: TablePaginationState | undefined;
}

/** 内置筛选下拉的一个选项。 */
export interface TableFilterOption {
  /** 展示文案。 */
  text: string;
  /** 参与匹配的字符串值（与 `dataIndex` 取值的文本化结果比较）。 */
  value: string;
}

/** 自定义筛选面板的上下文；面板通过它读写引擎状态，不另建一份状态。 */
export interface TableFilterDropdownContext {
  /** 当前列 key。 */
  columnKey: string;
  /** 当前列已选中的值。 */
  selectedValues: readonly string[];
  /** 写入选中值；会触发 `onChange`。 */
  setSelectedValues: (values: readonly string[]) => void;
  /** 关闭面板。 */
  confirm: () => void;
  /** 清空当前列筛选。 */
  reset: () => void;
}

/** 自定义筛选面板渲染函数。 */
export type TableFilterDropdown<T extends object> = (
  context: TableFilterDropdownContext,
) => JSX.Element;

/** 行选择模式：复选框多选 / 单选框单选。 */
export type TableSelectionType = 'checkbox' | 'radio';

/**
 * 行选择配置。整体挂在 `rowSelection` 一个 prop 上（对齐 AntD 使用习惯），
 * 而不是散成 `selectedRowKeys` / `onSelectChange` 多个字段 —— 关掉行选择只需
 * 不传这一个 prop，不必逐个清空。
 *
 * 受控优先级与其他状态一致：`selectedRowKeys > defaultSelectedRowKeys > 内部信号`。
 * `radio` 模式不接受多选，选中集合恒收敛为 1 个 key（否则同一 `name` 下会出现
 * 多个 checked 的 radio，DOM 本身非法）。
 */
export interface TableRowSelection<T extends object> {
  /**
   * 选择模式。
   * @default 'checkbox'
   */
  type?: TableSelectionType;
  /**
   * 受控选中行键；给了就不在组件内部保存选择，点击只发 `onChange`。
   * @default undefined
   */
  selectedRowKeys?: readonly string[];
  /**
   * 非受控选中初值；只在 setup 期读一次。
   * @default []
   */
  defaultSelectedRowKeys?: readonly string[];
  /**
   * 选中变化出口。`keys` 是归一后的完整选中集合；`rows` 是按当前 `data`
   * 能解析到的行对象（受控值含视图外 key 时会短于 `keys`）。
   * @default undefined
   */
  onChange?: (keys: readonly string[], rows: readonly T[]) => void;
  /**
   * 行选择禁用判定：返回 `true` 的行不渲染可交互控件、不进全选集合。
   * 只影响选择列，不改行内容与文字颜色（禁用不靠降对比度表达，避免 axe `color-contrast`）。
   * @default undefined
   */
  isRowDisabled?: (row: T, index: number) => boolean;
}

/** 单列配置。`title` 必填，保证 `<th>` 恒有可访问名称（axe `empty-table-header`）。 */
export interface TableColumn<T extends object> {
  /**
   * 列标识；未传时取 `dataIndex`，再未传时由引擎按列序号生成。
   * @default undefined
   */
  key?: string;
  /** 表头文案；同时是 `<th scope="col">` 的可访问名称。 */
  title: string;
  /**
   * 取值字段名。不传时 `render` 收到 `undefined`，由调用方自行从 `row` 取值。
   * @default undefined
   */
  dataIndex?: TableRowKey<T>;
  /**
   * 列宽，写进 `<col>` 的 `style`。数字按 px，字符串原样落地（可用 `20%`）。
   * @default undefined
   */
  width?: number | string;
  /**
   * 水平对齐，同时落到 `<th>` / `<td>` 的 `data-scui-align`。
   * @default 'left'
   */
  align?: TableAlign;
  /**
   * 自定义单元格渲染；给了就不走 `dataIndex` 的默认文本化。
   * @default undefined
   */
  render?: TableCellRender<T>;
  /**
   * 可排序：`true` 用内置确定性比较器，函数则用自定义比较器。
   * 表头点击循环「无 → 升序 → 降序 → 无」。
   * @default undefined
   */
  sorter?: boolean | TableSorterFn<T>;
  /**
   * 内置筛选下拉的选项；与 `filterDropdown` 二选一（同时给时自定义优先）。
   * @default undefined
   */
  filters?: readonly TableFilterOption[];
  /**
   * 筛选模式：单选（radio）或复选（checkbox）。
   * @default 'multiple'
   */
  filterMode?: TableFilterMode;
  /**
   * 自定义筛选面板；通过 context 读写引擎的筛选状态。
   * @default undefined
   */
  filterDropdown?: TableFilterDropdown<T>;
}

/** `<Table>` 入参。原生 div 属性照常透传到滚动容器（`onChange` 被业务协议占用）。 */
export interface TableProps<T extends object> extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'children' | 'style' | 'onChange'
> {
  /** 列配置；顺序即渲染顺序。 */
  columns: readonly TableColumn<T>[];
  /**
   * 全量数据。
   * @default []
   */
  data?: readonly T[];
  /**
   * 行键字段名；不传时按行序号兜底。
   * @default undefined
   */
  rowKey?: TableRowKey<T>;
  /**
   * 加载态；落到 `data-scui-loading` 与 `aria-busy="true"`。
   * @default false
   */
  loading?: boolean;
  /**
   * 显示外边框与列分隔线。
   * @default false
   */
  bordered?: boolean;
  /**
   * 尺寸（行高档）。
   * @default 'medium'
   */
  size?: TableSize;
  /**
   * 密度（单元格内距档）。
   * @default 'default'
   */
  density?: TableDensity;
  /**
   * 受控排序状态；给了就不在组件内部保存排序，点击只发 `onChange`。
   * @default undefined
   */
  sorter?: TableSorter;
  /**
   * 非受控排序初值；只在 setup 期读一次。
   * @default []
   */
  defaultSorter?: TableSorter;
  /**
   * 受控筛选状态；给了就不在组件内部保存筛选，变更只发 `onChange`。
   * @default undefined
   */
  filters?: TableFilters;
  /**
   * 非受控筛选初值；只在 setup 期读一次。
   * @default {}
   */
  defaultFilters?: TableFilters;
  /**
   * 行选择配置；不传则不渲染选择列。
   * @default undefined
   */
  rowSelection?: TableRowSelection<T>;
  /**
   * 统一变更出口；排序 / 筛选任一变化都带出完整三参快照。
   * @default undefined
   */
  onChange?: (change: TableChange) => void;
  /**
   * 服务端模式：只把参数交给 `onChange`，**不本地改数据**（行数与原序都不变）。
   * @default false
   */
  server?: boolean;
  /**
   * 允许多列同时排序；默认单列（点新列替换旧列）。
   * @default false
   */
  multipleSorters?: boolean;
  /**
   * 表格无障碍名称。不传时不设 `aria-label`：同页多张表由调用方决定如何区分。
   * @default undefined
   */
  'aria-label'?: string;
  /**
   * 内联样式（字符串形态），落在滚动容器上。
   * @default undefined
   */
  style?: string;
}
