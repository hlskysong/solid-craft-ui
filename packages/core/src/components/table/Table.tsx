/**
 * 表格（T3-01 基座 + T3-02 排序 / 筛选）。
 *
 * 分层：`useTableEngine` 把 props 归一成单一状态快照，本文件只负责把它翻译成
 * 原生 `<table>` 语义与交互控件；排序 / 筛选 / 面板开合状态全在引擎里，
 * **视图不建 signal、不散读 props 状态字段**。T3-03 选择 / T3-06 分页继续
 * 从同一个 `TableState` 取，不在这里复制状态。
 *
 * SSR（R4 裁决 + `Table.md §6`）：服务端输出**完整静态表格骨架**
 * —— colgroup / thead / tbody、排序与筛选触发器、全部 `data-scui-*` 都在
 * setup 期产出；筛选面板初态关闭（不渲染），因此首帧属性与客户端一致。
 * 不访问 `window` / `document` / 当前时间，窗口化与 DOM 测量属 client-only
 * 增强层。`data-scui-loading` / `aria-busy` / 存在即真的状态属性两态稳定。
 *
 * 表头与正文共用 `--scui-table-font-size`，层级只靠 `font-weight` / 背景表达，
 * **不靠缩字号**（`docs/04 §5.1` 密度与内距目标）。
 */
import { For, Show, splitProps, type JSX } from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import { useTableEngine } from './table-engine';
import type { TableProps, TableSortState } from './types';

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
  'onChange',
  'server',
  'multipleSorters',
  'aria-label',
  'style',
  'class',
] as const;

export function Table<T extends object>(props: TableProps<T>): JSX.Element {
  const [local, rest] = splitProps(props, TABLE_PROPS);
  const engine = useTableEngine<T>(local);
  const state = engine.state;

  const sorterOf = (columnKey: string): TableSortState | undefined =>
    state().sorters.find((item) => item.columnKey === columnKey);

  return (
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
          <For each={state().columns}>
            {(column) => <col style={column.width ? `width:${column.width}` : undefined} />}
          </For>
        </colgroup>
        <thead>
          <tr>
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
          <For each={state().rows}>
            {(row, index) => (
              <tr data-scui-row-key={engine.rowKeyOf(row, index())}>
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
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
}
