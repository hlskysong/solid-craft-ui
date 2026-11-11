/**
 * S-04 可行性预研视图层：窗口化渲染 + 固定列的 data-* 契约。
 * 不进 src/，不是正式组件；只证明方案可在 SSR 与客户端同时输出稳定结构。
 */
import { createMemo, For, type JSX } from 'solid-js';

import { CSS_PREFIX } from '../../src/scope';
import { classNames } from '../../src/utils/class-names';
import { resolveValue, type MaybeAccessor } from '../../src/utils/resolve-value';

import {
  FIXED_COLUMN_PLAN,
  nextSort,
  sortRows,
  toggleAll,
  toggleRow,
  type SortKey,
  type SortState,
  type TableRow,
} from './table-engine';

export interface ScuiTableProps {
  /** 全量行（可以 1 万行）；值 / getter 均可。 */
  rows: MaybeAccessor<readonly TableRow[]>;
  /** 排序状态；值 / getter 均可。 @default undefined */
  sort?: MaybeAccessor<SortState | undefined>;
  /** 排序变化回调。 */
  onSortChange?: (sort: SortState) => void;
  /** 选中行 id 集合。 @default 空集合 */
  selected?: MaybeAccessor<ReadonlySet<number>>;
  /** 选中变化回调。 */
  onSelectionChange?: (selected: ReadonlySet<number>) => void;
  /** 可见窗口行数（固定行高虚拟化的最小形态）。 @default 20 */
  windowSize?: number;
}

const COLUMNS: readonly { key: SortKey; title: string }[] = [
  { key: 'id', title: '编号' },
  { key: 'name', title: '项目名称' },
  { key: 'dept', title: '归属部门' },
  { key: 'score', title: '分值' },
];

const fixedOf = (key: SortKey): string | undefined => {
  if ((FIXED_COLUMN_PLAN.left as readonly string[]).includes(key)) return 'left';
  if ((FIXED_COLUMN_PLAN.right as readonly string[]).includes(key)) return 'right';
  return undefined;
};

export function ScuiTable(props: ScuiTableProps): JSX.Element {
  const rows = createMemo(() => resolveValue(props.rows));
  const sort = createMemo(() => resolveValue(props.sort));
  const selected = createMemo(() => resolveValue(props.selected) ?? new Set<number>());
  const windowSize = createMemo(() => props.windowSize ?? 20);
  const ordered = createMemo(() => sortRows(rows(), sort()));
  const visible = createMemo(() => ordered().slice(0, windowSize()));
  const allVisibleSelected = createMemo(() =>
    visible().length > 0 && visible().every((row) => selected().has(row.id)),
  );

  return (
    <div
      class={classNames(`${CSS_PREFIX}table-scroll`)}
      data-scui-role="table-scroll"
      data-scui-row-count={rows().length}
    >
      <table class={classNames(`${CSS_PREFIX}table`)} data-scui-role="table">
        <thead>
          <tr>
            <th data-scui-fixed="left" data-scui-role="select-all">
              <input
                type="checkbox"
                aria-label="全选当前窗口"
                checked={allVisibleSelected()}
                onChange={() =>
                  props.onSelectionChange?.(
                    toggleAll(
                      selected(),
                      visible().map((row) => row.id),
                    ),
                  )
                }
              />
            </th>
            <For each={COLUMNS}>
              {(column) => (
                <th data-scui-fixed={fixedOf(column.key)} data-scui-sort={sort()?.key === column.key ? sort()?.direction : undefined}>
                  <button
                    type="button"
                    data-scui-role="sort-trigger"
                    data-scui-sort-key={column.key}
                    onClick={() => props.onSortChange?.(nextSort(sort(), column.key))}
                  >
                    {column.title}
                  </button>
                </th>
              )}
            </For>
          </tr>
        </thead>
        <tbody>
          <For each={visible()}>
            {(row) => (
              <tr data-scui-row={row.id} data-scui-selected={selected().has(row.id) ? '' : undefined}>
                <td data-scui-fixed="left">
                  <input
                    type="checkbox"
                    aria-label={`选择第 ${row.id} 行`}
                    checked={selected().has(row.id)}
                    onChange={() => props.onSelectionChange?.(toggleRow(selected(), row.id))}
                  />
                </td>
                <td data-scui-fixed="left">{row.id}</td>
                <td data-scui-fixed="left">{row.name}</td>
                <td>{row.dept}</td>
                <td data-scui-fixed="right">{row.score}</td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
}
