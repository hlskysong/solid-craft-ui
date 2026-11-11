/**
 * S-04 可行性预研：1 万行 + 固定列「方案」的数据层。
 *
 * 纯函数、零 DOM 依赖，Node / SSR / 客户端共用；60fps 性能验收按 docs/01 §9
 * 明确移到 Phase 5，本 Spike 只证明「1 万行数据 + 排序 + 选择」链路可用。
 */

export interface TableRow {
  id: number;
  name: string;
  dept: string;
  /** 整数分值，只用于排序比较，不做浮点运算与展示。 */
  score: number;
}

export type SortKey = 'id' | 'name' | 'dept' | 'score';
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  key: SortKey;
  direction: SortDirection;
}

/** 1 万行确定性数据（不用 Math.random，SSR 稳定）。 */
export function makeRows(count = 10_000): TableRow[] {
  const depts = ['研发部', '财务部', '法务部', '生产部'];
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `项目 ${String(index + 1).padStart(5, '0')}`,
    dept: depts[index % depts.length] ?? '研发部',
    score: (index * 37) % 1000,
  }));
}

/** 稳定排序：数值直接比较，字符串按码位比较（避免 locale 环境差异）。 */
export function sortRows(rows: readonly TableRow[], sort: SortState | undefined): TableRow[] {
  if (!sort) return [...rows];
  const factor = sort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const left = a[sort.key];
    const right = b[sort.key];
    const cmp =
      typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left) < String(right)
          ? -1
          : String(left) > String(right)
            ? 1
            : 0;
    // id 唯一，作为稳定 tie-breaker，保证多次排序结果逐字节一致
    return cmp === 0 ? a.id - b.id : cmp * factor;
  });
}

export function nextSort(current: SortState | undefined, key: SortKey): SortState {
  if (current?.key !== key) return { key, direction: 'asc' };
  if (current.direction === 'asc') return { key, direction: 'desc' };
  return { key: 'id', direction: 'asc' };
}

export function toggleRow(selected: ReadonlySet<number>, id: number): ReadonlySet<number> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function toggleAll(
  selected: ReadonlySet<number>,
  ids: readonly number[],
): ReadonlySet<number> {
  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
  return allSelected ? new Set() : new Set(ids);
}

/**
 * 固定列方案（本 Spike 只验「方案可行」，不验性能）：
 *  - 左固定列用 `position: sticky; left: 0`，右固定列 `right: 0`；
 *  - 表头与 body 同一 `<table>` + `border-collapse: separate`，避免 sticky 失效；
 *  - 横向滚动由外层容器承担，阴影用 `[data-scui-fixed][data-scui-scrolled]` 切换；
 *  - 虚拟滚动按固定行高窗口化（visibleRows），动态行高与 60fps 留到 Phase 5。
 */
export const FIXED_COLUMN_PLAN = {
  left: ['id', 'name'],
  right: ['score'],
  sticky: 'position: sticky; left/right: 0',
  scrollShadow: '[data-scui-fixed][data-scui-scrolled]',
  virtualization: '固定行高窗口化；动态行高 / 60fps 属 Phase 5',
} as const;
