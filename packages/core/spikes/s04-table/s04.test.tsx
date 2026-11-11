/**
 * S-04 实证：1 万行数据、排序 / 选择可用、固定列 data-* 契约、窗口化渲染。
 * ⚠️ 60fps 性能验收按 docs/01 §9 在 Phase 5，本测试不冒充性能结论。
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ScuiTable } from './Table';
import {
  FIXED_COLUMN_PLAN,
  makeRows,
  nextSort,
  sortRows,
  toggleAll,
  toggleRow,
} from './table-engine';

afterEach(cleanup);

describe('S-04 1 万行数据层', () => {
  it('确定性产出 1 万行，且 SSR 稳定（无随机数）', () => {
    const rows = makeRows(10_000);
    expect(rows).toHaveLength(10_000);
    expect(rows[0]?.id).toBe(1);
    expect(rows.at(-1)?.id).toBe(10_000);
    expect(makeRows(10_000)).toEqual(rows);
  });

  it('数值 / 字符串排序正确，三态排序循环稳定', () => {
    const rows = makeRows(10_000);
    const byScoreAsc = sortRows(rows, { key: 'score', direction: 'asc' });
    const byScoreDesc = sortRows(rows, { key: 'score', direction: 'desc' });
    expect(byScoreAsc[0]?.score).toBeLessThanOrEqual(byScoreAsc[1]?.score ?? 0);
    expect(byScoreDesc[0]?.score).toBeGreaterThanOrEqual(byScoreDesc[1]?.score ?? 0);
    expect(sortRows(rows, undefined)).toHaveLength(10_000);
    expect(nextSort(undefined, 'name')).toEqual({ key: 'name', direction: 'asc' });
    expect(nextSort({ key: 'name', direction: 'asc' }, 'name')).toEqual({
      key: 'name',
      direction: 'desc',
    });
    expect(nextSort({ key: 'name', direction: 'desc' }, 'name')).toEqual({
      key: 'id',
      direction: 'asc',
    });
  });

  it('单选 / 全选 / 取消全选不共享可变状态', () => {
    const first = toggleRow(new Set(), 1);
    const second = toggleRow(first, 2);
    expect([...first]).toEqual([1]);
    expect([...second]).toEqual([1, 2]);
    expect([...toggleRow(second, 1)]).toEqual([2]);
    const all = toggleAll(new Set(), [1, 2, 3]);
    expect([...all]).toEqual([1, 2, 3]);
    expect([...toggleAll(all, [1, 2, 3])]).toEqual([]);
  });

  it('固定列方案左右分组明确，虚拟滚动边界写明留给 Phase 5', () => {
    expect(FIXED_COLUMN_PLAN.left).toEqual(['id', 'name']);
    expect(FIXED_COLUMN_PLAN.right).toEqual(['score']);
    expect(FIXED_COLUMN_PLAN.virtualization).toContain('Phase 5');
  });
});

describe('S-04 视图层窗口化与交互', () => {
  it('只渲染可见窗口，但保留全量行数与固定列标记', () => {
    render(() => <ScuiTable rows={makeRows(10_000)} windowSize={20} />);
    expect(document.querySelector('[data-scui-role="table-scroll"]')).toHaveAttribute(
      'data-scui-row-count',
      '10000',
    );
    expect(document.querySelectorAll('[data-scui-row]')).toHaveLength(20);
    expect(document.querySelector('[data-scui-role="table"]')).toBeInTheDocument();
    expect(document.querySelector('[data-scui-fixed="left"]')).toBeInTheDocument();
    expect(document.querySelector('[data-scui-fixed="right"]')).toBeInTheDocument();
  });

  it('点击表头触发排序回调、勾选触发选择回调（受控链路）', () => {
    const onSortChange = vi.fn();
    const onSelectionChange = vi.fn();
    const [selected, setSelected] = createSignal<ReadonlySet<number>>(new Set());
    render(() => (
      <ScuiTable
        rows={makeRows(100)}
        windowSize={5}
        selected={selected}
        onSortChange={onSortChange}
        onSelectionChange={(next) => {
          setSelected(next);
          onSelectionChange(next);
        }}
      />
    ));

    fireEvent.click(screen.getByRole('button', { name: '项目名称' }));
    expect(onSortChange).toHaveBeenCalledWith({ key: 'name', direction: 'asc' });

    fireEvent.click(screen.getByRole('checkbox', { name: '选择第 1 行' }));
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect([...selected()]).toEqual([1]);
  });
});
