/**
 * 表格（T3-01 基座 + T3-02 排序 / 筛选 + T3-03 行选择 + T3-06 分页 / 空 / 加载态）。
 *
 * 分层：`useTableEngine` 把 props 归一成单一状态快照，本文件只负责把它翻译成
 * 原生 `<table>` 语义与交互控件；排序 / 筛选 / 行选择 / 面板开合 / 分页状态全在引擎里，
 * **视图不建 signal、不散读 props 状态字段**。
 *
 * T3-06 的三层 DOM：`.scui-table-root` 是最外层布局容器，`.scui-table-scroll`
 * 仍是 `overflow-x: auto` 的横向滚动容器，分页 footer 放在滚动容器**外面** ——
 * 放进滚动区会跟着表格一起横向移动，宽度也被定宽列撑开。既有 `rest` / `class` /
 * `style` 与全部 `data-scui-*` 仍归属 scroll 容器，因此 T3-01~T3-03 的 SSR
 * counts、单测与视觉基线都不变。
 *
 * 分页 / 空态 / 加载态分别**直接组合** `Pagination` / `Empty` / `Spin`，不在 Table
 * 里复制一套控件。三者样式由 `table.scss` 用 Sass `@use` 聚合进 `table.css`：
 * 构建脚本按组件目录逐个出 CSS、没有依赖聚合，不这么做会让「只引 table.css」
 * 的使用方拿到一堆裸按钮与裸转圈。
 *
 * SSR（R4 裁决 + `Table.md §6`）：服务端输出**完整静态表格骨架**
 * —— colgroup / thead / tbody、排序与筛选触发器、选择列与全部 `data-scui-*`
 * 都在 setup 期产出；筛选面板初态关闭（不渲染），因此首帧属性与客户端一致。
 * 不访问 `window` / `document` / 当前时间，窗口化与 DOM 测量属 client-only
 * 增强层。`data-scui-loading` / `aria-busy` / 存在即真的状态属性两态稳定。
 *
 * 表头与正文共用 `--scui-table-font-size`，层级只靠 `font-weight` / 背景表达，
 * **不靠缩字号**（`docs/04 §5.1` 密度与内距目标）。
 */
import { createEffect, createUniqueId, For, Show, splitProps, type JSX } from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import { Empty } from '../empty';
import { Pagination } from '../pagination';
import { Spin } from '../spin';
import { useTableEngine } from './table-engine';
import type { TableProps, TableSelectionType, TableSortState } from './types';

const TABLE_PROPS = [
  'columns',
  'data',
  'rowKey',
  'loading',
  'bordered',
  'size',
  'density',
  'sorter',
  'defaultSorter',
  'filters',
  'defaultFilters',
  'rowSelection',
  'pagination',
  'onChange',
  'server',
  'multipleSorters',
  'aria-label',
  'style',
  'class',
] as const;

interface SelectControlProps {
  /** 控件类型：多选 checkbox / 单选 radio。 */
  type: TableSelectionType;
  /** radio 分组名；checkbox 不传。 */
  name?: string;
  /** 可访问名称。 */
  label: string;
  checked: boolean;
  disabled: boolean;
  /** 半选态；只对 checkbox 有意义。 */
  indeterminate?: boolean;
  /** 落成 `data-scui-role`（属性锚点），不是 ARIA role —— 名字刻意避开 `role`。 */
  scuiRole: string;
  onToggle: () => void;
}

/**
 * 行选择控件（原生 `input`）。
 *
 * 刻意**不复用** `Checkbox` / `Radio`：`build-css.mjs` 按组件目录逐个编译
 * `components/<name>.css`，没有依赖聚合 —— `table.css` 里没有 `.scui-checkbox`
 * 的样式，复用会让「只引 table.css」的使用方拿到裸 `<input>`。这里自建 16px
 * 方框，语义与 Checkbox 同口径（三态都输出 `aria-checked`）。
 *
 * `indeterminate` 是 DOM **property** 而非 attribute：SSR 不序列化它，靠客户端
 * effect 写入；`aria-checked="mixed"` 是 attribute，SSR 首帧就与客户端一致，
 * 不会造成 hydration 属性差。
 */
function SelectControl(props: SelectControlProps): JSX.Element {
  let control: HTMLInputElement | undefined;

  createEffect(() => {
    if (control !== undefined) control.indeterminate = props.indeterminate === true;
  });

  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: `aria-checked="mixed"` 是 checkbox / radio 三态必需；静态检查不认 `<input type={...}>` 的隐式与动态角色（同 Icon.tsx 的口径）
    <input
      ref={(element) => {
        control = element;
      }}
      type={props.type}
      name={props.name}
      // 显式声明隐式角色：`aria-checked="mixed"` 是三态必需，而静态检查不认
      // `<input type="checkbox">` 的隐式 checkbox 角色，显式写出后语义不变。
      role={props.type}
      class={`${CSS_PREFIX}table__select-control`}
      data-scui-role={props.scuiRole}
      aria-label={props.label}
      aria-checked={props.indeterminate === true ? 'mixed' : props.checked ? 'true' : 'false'}
      checked={props.checked}
      disabled={props.disabled}
      onChange={(event) => {
        props.onToggle();
        // 浏览器已先把 DOM 切过；受控值没变时响应式绑定不会重算，不回弹就会
        // 出现「点了没选中、界面却显示已选」。非受控时 props 已是新值，等于空操作。
        const target = event.currentTarget;
        target.checked = props.checked;
        target.indeterminate = props.indeterminate === true;
      }}
    />
  );
}

export function Table<T extends object>(props: TableProps<T>): JSX.Element {
  const [local, rest] = splitProps(props, TABLE_PROPS);
  const engine = useTableEngine<T>(local);
  const state = engine.state;
  // radio 必须同组同 name：每张表一个稳定 id，避免同页多表互相排斥。
  const selectionName = `scui-table-select-${createUniqueId()}`;

  const sorterOf = (columnKey: string): TableSortState | undefined =>
    state().sorters.find((item) => item.columnKey === columnKey);

  return (
    <div class={`${CSS_PREFIX}table-root`} data-scui-role="table-root">
      <div
        {...rest}
        class={classNames(`${CSS_PREFIX}table-scroll`, local.class)}
        style={local.style}
        data-scui-role="table-scroll"
        data-scui-row-count={state().totalRowCount}
        data-scui-filtered-row-count={state().viewRowCount}
        data-scui-loading={state().loading ? '' : undefined}
        aria-busy={state().loading ? 'true' : undefined}
      >
        <table
          class={`${CSS_PREFIX}table`}
          data-scui-role="table"
          data-scui-size={state().size}
          data-scui-density={state().density}
          data-scui-bordered={state().bordered ? '' : undefined}
          data-scui-server={state().server ? '' : undefined}
          aria-label={local['aria-label']}
        >
          <colgroup>
            <Show when={state().selectionType !== undefined}>
              <col class={`${CSS_PREFIX}table__select-col`} />
            </Show>
            <For each={state().columns}>
              {(column) => <col style={column.width ? `width:${column.width}` : undefined} />}
            </For>
          </colgroup>
          <thead>
            <tr>
              <Show when={state().selectionType !== undefined}>
                <th
                  class={`${CSS_PREFIX}table__head-cell ${CSS_PREFIX}table__select-cell`}
                  scope="col"
                  data-scui-align="center"
                >
                  {/* radio 模式没有全选控件，但 `<th>` 不能为空（axe `empty-table-header`）；
                    两种模式都留一段视觉隐藏文案，checkbox 再叠一个全选控件。 */}
                  <span class={`${CSS_PREFIX}table__select-label`}>选择</span>
                  <Show when={state().selectionType === 'checkbox'}>
                    <SelectControl
                      type="checkbox"
                      scuiRole="select-all"
                      label="全选当前页"
                      checked={state().allSelected}
                      indeterminate={state().someSelected}
                      disabled={state().selectableKeys.length === 0}
                      onToggle={() => engine.toggleAll()}
                    />
                  </Show>
                </th>
              </Show>
              <For each={state().columns}>
                {(column) => {
                  const direction = () => sorterOf(column.key)?.direction;
                  const selected = () => state().filters[column.key] ?? [];
                  const isOpen = () => state().openFilterKey === column.key;
                  return (
                    <th
                      class={`${CSS_PREFIX}table__head-cell`}
                      scope="col"
                      data-scui-align={column.align}
                      data-scui-sort={direction()}
                      data-scui-sort-key={direction() === undefined ? undefined : column.key}
                      data-scui-filtered={selected().length > 0 ? '' : undefined}
                      data-scui-filter-open={isOpen() ? '' : undefined}
                    >
                      <span class={`${CSS_PREFIX}table__head-label`}>{column.title}</span>
                      <Show when={column.sortable}>
                        <button
                          type="button"
                          class={`${CSS_PREFIX}table__sort-trigger`}
                          data-scui-role="sort-trigger"
                          aria-label={`按${column.title}排序`}
                          aria-pressed={direction() === undefined ? 'false' : 'true'}
                          onClick={() => engine.toggleSort(column.key)}
                        >
                          <span aria-hidden="true">
                            {direction() === 'asc' ? '升' : direction() === 'desc' ? '降' : '序'}
                          </span>
                        </button>
                      </Show>
                      <Show when={column.filterable}>
                        <button
                          type="button"
                          class={`${CSS_PREFIX}table__filter-trigger`}
                          data-scui-role="filter-trigger"
                          aria-label={`筛选${column.title}`}
                          aria-expanded={isOpen() ? 'true' : 'false'}
                          onClick={() => engine.setOpenFilterKey(isOpen() ? undefined : column.key)}
                        >
                          <span aria-hidden="true">筛</span>
                        </button>
                      </Show>
                      <Show when={column.filterable && isOpen()}>
                        <div
                          class={`${CSS_PREFIX}table__filter-dropdown`}
                          data-scui-role="filter-dropdown"
                        >
                          {column.filterDropdown ? (
                            column.filterDropdown(engine.filterDropdownContext(column.key))
                          ) : (
                            <>
                              <For each={column.filters ?? []}>
                                {(option) => (
                                  <label
                                    class={`${CSS_PREFIX}table__filter-option`}
                                    data-scui-role="filter-option"
                                  >
                                    <input
                                      type={column.filterMode === 'single' ? 'radio' : 'checkbox'}
                                      name={`scui-filter-${column.key}`}
                                      value={option.value}
                                      checked={selected().includes(option.value)}
                                      onChange={(event) => {
                                        const current = selected();
                                        const checked = event.currentTarget.checked;
                                        const next = checked
                                          ? column.filterMode === 'single'
                                            ? [option.value]
                                            : [...current, option.value]
                                          : current.filter((item) => item !== option.value);
                                        engine.setFilterValues(column.key, next);
                                      }}
                                    />
                                    <span>{option.text}</span>
                                  </label>
                                )}
                              </For>
                              <div class={`${CSS_PREFIX}table__filter-actions`}>
                                <button
                                  type="button"
                                  onClick={() => engine.setOpenFilterKey(undefined)}
                                >
                                  确定
                                </button>
                                <button
                                  type="button"
                                  onClick={() => engine.setFilterValues(column.key, [])}
                                >
                                  重置
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </Show>
                    </th>
                  );
                }}
              </For>
            </tr>
          </thead>
          <tbody>
            <Show when={state().empty}>
              <tr class={`${CSS_PREFIX}table__empty-row`} data-scui-role="table-empty-row">
                <td
                  class={`${CSS_PREFIX}table__empty-cell`}
                  colspan={Math.max(
                    1,
                    state().columns.length + (state().selectionType === undefined ? 0 : 1),
                  )}
                  data-scui-align="center"
                >
                  <Empty description="暂无数据" />
                </td>
              </tr>
            </Show>
            <For each={state().rows}>
              {(row, index) => {
                const selected = () => engine.isRowSelected(row, index());
                const disabled = () => engine.isRowDisabled(row, index());
                return (
                  <tr
                    data-scui-row-key={engine.rowKeyOf(row, index())}
                    data-scui-selected={selected() ? '' : undefined}
                    data-scui-row-disabled={disabled() ? '' : undefined}
                  >
                    <Show when={state().selectionType !== undefined}>
                      <td
                        class={`${CSS_PREFIX}table__cell ${CSS_PREFIX}table__select-cell`}
                        data-scui-align="center"
                      >
                        <SelectControl
                          type={state().selectionType === 'radio' ? 'radio' : 'checkbox'}
                          name={state().selectionType === 'radio' ? selectionName : undefined}
                          scuiRole="select-row"
                          label={`选择第 ${index() + 1} 行`}
                          checked={selected()}
                          disabled={disabled()}
                          onToggle={() => engine.toggleRow(row, index())}
                        />
                      </td>
                    </Show>
                    <For each={state().columns}>
                      {(column) => (
                        <td class={`${CSS_PREFIX}table__cell`} data-scui-align={column.align}>
                          {column.render
                            ? column.render(engine.cellValue(row, column), row, index())
                            : engine.cellText(row, column)}
                        </td>
                      )}
                    </For>
                  </tr>
                );
              }}
            </For>
          </tbody>
        </table>
      </div>
      <Show when={state().pagination}>
        {(pagination) => (
          <div class={`${CSS_PREFIX}table__footer`} data-scui-role="table-footer">
            <Pagination
              current={pagination().current}
              pageSize={pagination().pageSize}
              total={pagination().total}
              pageSizeOptions={state().paginationView?.pageSizeOptions}
              showSizeChanger={state().paginationView?.showSizeChanger}
              showQuickJumper={state().paginationView?.showQuickJumper}
              showTotal={state().paginationView?.showTotal}
              size={state().size}
              disabled={state().loading}
              onChange={engine.changePagination}
            />
          </div>
        )}
      </Show>
      <Show when={state().loading}>
        <div class={`${CSS_PREFIX}table__loading`} data-scui-role="table-loading">
          <Spin tip="加载中" size="large" />
        </div>
      </Show>
    </div>
  );
}
