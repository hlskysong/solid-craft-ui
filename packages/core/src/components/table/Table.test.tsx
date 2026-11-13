/**
 * `Table` 组件层单测（T3-01）。
 *
 * 只验引擎基座自己负责的四件事：状态归一后的 `data-scui-*` 契约、列配置逐项生效、
 * 行键与受控更新、以及空数据边界。排序 / 筛选 / 选择 / 分页属于 T3-02 / T3-03 /
 * T3-06，本文件不提前给它们占位测试。
 *
 * SSR 双渲确定性由 `spikes/shared/ssr-smoke.mjs` 的 T3-01 入口验；
 * jsdom 下 JSX 已被编成 `document.createElement`，这里做不了真 SSR。
 */
import { cleanup, fireEvent, render, waitFor } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Table } from './Table';
import {
  applyFilters,
  applySorters,
  normalizeSorters,
  readCell,
  resolveColumns,
} from './table-engine';
import type { TableChange, TableColumn, TableSorter } from './types';

afterEach(cleanup);

interface Row {
  id: string;
  name: string;
  department: string;
  years: number;
}

const rows: Row[] = [
  { id: 'A01', name: '张伟', department: '研发', years: 6 },
  { id: 'A02', name: '李娜', department: '设计', years: 4 },
  { id: 'A03', name: '王强', department: '测试', years: 3 },
  { id: 'A04', name: '赵敏', department: '运维', years: 2 },
];

const columns: TableColumn<Row>[] = [
  { title: '工号', dataIndex: 'id', width: 96 },
  { title: '姓名', dataIndex: 'name', width: 120 },
  { title: '部门', dataIndex: 'department', align: 'center' },
  {
    title: '年限',
    dataIndex: 'years',
    align: 'right',
    render: (value) => <strong>{String(value)} 年</strong>,
  },
];

function element<T extends HTMLElement = HTMLElement>(selector: string): T {
  const node = document.querySelector(selector);
  if (!(node instanceof HTMLElement)) throw new Error(`未找到元素 ${selector}`);
  return node as T;
}

const scroll = () => element('[data-scui-role="table-scroll"]');
const table = () => element<HTMLTableElement>('[data-scui-role="table"]');
const headCells = () => document.querySelectorAll('[data-scui-role="table"] th');
const bodyCells = () => document.querySelectorAll('[data-scui-role="table"] td');
const rowNodes = () => document.querySelectorAll('[data-scui-row-key]');
const colNodes = () => document.querySelectorAll('[data-scui-role="table"] col');

describe('Table：状态契约与列配置', () => {
  it('默认 medium / default，无边框无加载，原生表格语义齐全', () => {
    render(() => <Table columns={columns} data={rows} rowKey="id" />);

    expect(table()).toHaveAttribute('data-scui-size', 'medium');
    expect(table()).toHaveAttribute('data-scui-density', 'default');
    expect(table()).not.toHaveAttribute('data-scui-bordered');
    expect(scroll()).not.toHaveAttribute('data-scui-loading');
    expect(scroll()).not.toHaveAttribute('aria-busy');
    expect(scroll()).toHaveAttribute('data-scui-row-count', '4');
    expect(headCells()).toHaveLength(4);
    expect(bodyCells()).toHaveLength(16);
    expect(headCells()[0]).toHaveAttribute('scope', 'col');
    expect(headCells()[0]).toHaveTextContent('工号');
    expect(headCells()[0]).toHaveAttribute('data-scui-align', 'left');
  });

  it('列配置全生效：title / width / align / render / dataIndex', () => {
    render(() => <Table columns={columns} data={rows} rowKey="id" />);

    expect(colNodes()).toHaveLength(4);
    // jsdom 会把内联样式规范化成 "width: 96px;"，用 toHaveStyle 而不是逐字比属性
    expect(colNodes()[0]).toHaveStyle({ width: '96px' });
    expect(colNodes()[1]).toHaveStyle({ width: '120px' });
    expect(headCells()[2]).toHaveAttribute('data-scui-align', 'center');
    expect(bodyCells()[2]).toHaveAttribute('data-scui-align', 'center');
    expect(bodyCells()[3]).toHaveAttribute('data-scui-align', 'right');
    expect(bodyCells()[0]).toHaveTextContent('A01');
    expect(bodyCells()[1]).toHaveTextContent('张伟');
    expect(bodyCells()[3]).toHaveTextContent('6 年');
    expect(bodyCells()[3]?.querySelector('strong')).not.toBeNull();
  });

  it('边框 / 加载 / 尺寸 / 密度各自落到 data-* 与 aria-busy 上', () => {
    const { unmount } = render(() => (
      <Table columns={columns} data={rows} bordered loading size="large" density="compact" />
    ));

    expect(table()).toHaveAttribute('data-scui-bordered', '');
    expect(scroll()).toHaveAttribute('data-scui-loading', '');
    expect(scroll()).toHaveAttribute('aria-busy', 'true');
    expect(table()).toHaveAttribute('data-scui-size', 'large');
    expect(table()).toHaveAttribute('data-scui-density', 'compact');
    unmount();

    render(() => <Table columns={columns} data={rows} size="small" density="comfortable" />);
    expect(table()).toHaveAttribute('data-scui-size', 'small');
    expect(table()).toHaveAttribute('data-scui-density', 'comfortable');
    expect(table()).not.toHaveAttribute('data-scui-bordered');
  });

  it('rowKey 决定行标识；缺省按行序号兜底', () => {
    const { unmount } = render(() => <Table columns={columns} data={rows} rowKey="id" />);
    expect(rowNodes()).toHaveLength(4);
    expect(rowNodes()[0]).toHaveAttribute('data-scui-row-key', 'A01');
    expect(rowNodes()[3]).toHaveAttribute('data-scui-row-key', 'A04');
    unmount();

    render(() => <Table columns={columns} data={rows.slice(0, 2)} />);
    expect(rowNodes()[0]).toHaveAttribute('data-scui-row-key', '0');
    expect(rowNodes()[1]).toHaveAttribute('data-scui-row-key', '1');
  });

  it('调用方更新 signal 后引擎状态重算，组件内不持有副本', async () => {
    const [data, setData] = createSignal<readonly Row[]>(rows.slice(0, 2));
    const [loading, setLoading] = createSignal(false);
    render(() => <Table columns={columns} data={data()} rowKey="id" loading={loading()} />);

    expect(scroll()).toHaveAttribute('data-scui-row-count', '2');
    setData(rows);
    setLoading(true);

    await waitFor(() => {
      expect(scroll()).toHaveAttribute('data-scui-row-count', '4');
      expect(bodyCells()).toHaveLength(16);
      expect(scroll()).toHaveAttribute('data-scui-loading', '');
      expect(scroll()).toHaveAttribute('aria-busy', 'true');
    });
  });

  it('空数据只输出表头，行数为 0 且不崩', () => {
    render(() => <Table columns={columns} data={[]} />);
    expect(scroll()).toHaveAttribute('data-scui-row-count', '0');
    expect(headCells()).toHaveLength(4);
    expect(bodyCells()).toHaveLength(0);
  });
});

describe('Table 引擎纯函数', () => {
  it('resolveColumns 补齐 key / align / width，且不改调用方的数组', () => {
    const resolved = resolveColumns(columns);
    expect(resolved[0]?.key).toBe('id');
    expect(resolved[0]?.align).toBe('left');
    expect(resolved[0]?.width).toBe('96px');
    expect(resolved[2]?.align).toBe('center');
    expect(resolved[3]?.align).toBe('right');
    expect(columns[0]?.align).toBeUndefined();
    expect(columns[0]?.key).toBeUndefined();
  });

  it('resolveColumns 对无 dataIndex 的列按序号生成 key', () => {
    const resolved = resolveColumns([{ title: '操作' }]);
    expect(resolved[0]?.key).toBe('col-0');
  });

  it('readCell 按 dataIndex 取值，缺省返回 undefined', () => {
    // noUncheckedIndexedAccess 下数组索引 / 解构都带 undefined；显式收窄，
    // 既不写 `as Row`（oxlint no-unsafe-type-assertion）也不写 `!`。
    const firstRow = rows[0];
    if (firstRow === undefined) throw new Error('测试夹具缺少首行');
    expect(readCell(firstRow, 'name')).toBe('张伟');
    expect(readCell(firstRow, undefined)).toBeUndefined();
  });
});

/** T3-02：排序 / 筛选的列夹具。部门按码点排序与原始行序不同，便于区分三态。 */
const sortColumns: TableColumn<Row>[] = [
  { title: '工号', dataIndex: 'id', width: 96 },
  { title: '姓名', dataIndex: 'name', width: 120 },
  {
    title: '部门',
    dataIndex: 'department',
    sorter: true,
    filters: [
      { text: '研发', value: '研发' },
      { text: '测试', value: '测试' },
    ],
  },
  { title: '年限', dataIndex: 'years', sorter: true },
];

const sortTriggers = () =>
  document.querySelectorAll<HTMLButtonElement>('[data-scui-role="sort-trigger"]');
const filterTriggers = () =>
  document.querySelectorAll<HTMLButtonElement>('[data-scui-role="filter-trigger"]');
const idColumn = () =>
  [...document.querySelectorAll('[data-scui-row-key]')].map(
    (node) => node.querySelector('td')?.textContent ?? '',
  );
const lastChange = (spy: ReturnType<typeof vi.fn>): TableChange => {
  const change = spy.mock.calls.at(-1)?.[0] as TableChange | undefined;
  if (change === undefined) throw new Error('onChange 未被调用');
  return change;
};

const click = (nodes: NodeListOf<HTMLButtonElement>, index: number): void => {
  const node = nodes[index];
  if (node === undefined) throw new Error(`交互控件 ${index} 不存在`);
  fireEvent.click(node);
};

const clickNode = (node: Element | null | undefined, label: string): void => {
  if (node === null || node === undefined) throw new Error(`缺少交互元素：${label}`);
  fireEvent.click(node);
};

describe('Table：T3-02 排序', () => {
  it('非受控三态循环：无 → 升 → 降 → 无，行序与 data-scui-sort 同源', async () => {
    render(() => <Table columns={sortColumns} data={rows} rowKey="id" />);

    expect(sortTriggers()).toHaveLength(2);
    expect(idColumn()).toEqual(['A01', 'A02', 'A03', 'A04']);

    click(sortTriggers(), 0);
    await waitFor(() => expect(headCells()[2]).toHaveAttribute('data-scui-sort', 'asc'));
    expect(headCells()[2]).toHaveAttribute('data-scui-sort-key', 'department');
    expect(idColumn()).toEqual(['A03', 'A01', 'A02', 'A04']);

    click(sortTriggers(), 0);
    await waitFor(() => expect(headCells()[2]).toHaveAttribute('data-scui-sort', 'desc'));
    expect(idColumn()).toEqual(['A04', 'A02', 'A01', 'A03']);

    click(sortTriggers(), 0);
    await waitFor(() => expect(headCells()[2]).not.toHaveAttribute('data-scui-sort'));
    expect(headCells()[2]).not.toHaveAttribute('data-scui-sort-key');
    expect(idColumn()).toEqual(['A01', 'A02', 'A03', 'A04']);
  });

  it('defaultSorter 作为非受控初值，SSR 首帧即有排序态', () => {
    const initial: TableSorter = [{ columnKey: 'years', direction: 'asc' }];
    render(() => <Table columns={sortColumns} data={rows} rowKey="id" defaultSorter={initial} />);

    expect(headCells()[3]).toHaveAttribute('data-scui-sort', 'asc');
    expect(idColumn()).toEqual(['A04', 'A03', 'A02', 'A01']);
  });

  it('受控 sorter：外部不回写则状态不变，但 onChange 照常带出完整三参', async () => {
    const onChange = vi.fn();
    const controlled: TableSorter = [{ columnKey: 'years', direction: 'desc' }];
    render(() => (
      <Table
        columns={sortColumns}
        data={rows}
        rowKey="id"
        sorter={controlled}
        onChange={onChange}
      />
    ));

    expect(headCells()[3]).toHaveAttribute('data-scui-sort', 'desc');
    click(sortTriggers(), 0);
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));

    // 受控：视图仍只有 years desc，部门未被内部状态偷偷改掉
    expect(headCells()[2]).not.toHaveAttribute('data-scui-sort');
    expect(headCells()[3]).toHaveAttribute('data-scui-sort', 'desc');
    const change = lastChange(onChange);
    expect(change.sorter).toEqual([{ columnKey: 'department', direction: 'asc' }]);
    expect(change.filters).toEqual({});
    expect(change.pagination).toBeUndefined();
  });

  it('multipleSorters 累加多列，单列模式点新列替换旧列', async () => {
    const onChange = vi.fn();
    const { unmount } = render(() => (
      <Table columns={sortColumns} data={rows} rowKey="id" multipleSorters onChange={onChange} />
    ));
    click(sortTriggers(), 0);
    click(sortTriggers(), 1);
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(2));
    expect(lastChange(onChange).sorter).toHaveLength(2);
    expect(headCells()[2]).toHaveAttribute('data-scui-sort', 'asc');
    expect(headCells()[3]).toHaveAttribute('data-scui-sort', 'asc');
    unmount();

    const single = vi.fn();
    render(() => <Table columns={sortColumns} data={rows} rowKey="id" onChange={single} />);
    click(sortTriggers(), 0);
    click(sortTriggers(), 1);
    await waitFor(() => expect(single).toHaveBeenCalledTimes(2));
    expect(lastChange(single).sorter).toEqual([{ columnKey: 'years', direction: 'asc' }]);
    expect(headCells()[2]).not.toHaveAttribute('data-scui-sort');
  });
});

describe('Table：T3-02 筛选与组合', () => {
  it('内置下拉：面板开合、复选过滤、行数双口径、重置', async () => {
    const onChange = vi.fn();
    render(() => <Table columns={sortColumns} data={rows} rowKey="id" onChange={onChange} />);

    expect(filterTriggers()).toHaveLength(1);
    expect(document.querySelector('[data-scui-role="filter-dropdown"]')).toBeNull();
    click(filterTriggers(), 0);
    await waitFor(() =>
      expect(document.querySelector('[data-scui-role="filter-dropdown"]')).not.toBeNull(),
    );
    expect(filterTriggers()[0]).toHaveAttribute('aria-expanded', 'true');

    const boxes = document.querySelectorAll<HTMLInputElement>(
      '[data-scui-role="filter-option"] input',
    );
    expect(boxes).toHaveLength(2);
    clickNode(boxes[0], '研发筛选项');
    await waitFor(() => expect(scroll()).toHaveAttribute('data-scui-filtered-row-count', '1'));
    clickNode(boxes[1], '测试筛选项');
    await waitFor(() => expect(scroll()).toHaveAttribute('data-scui-filtered-row-count', '2'));
    expect(scroll()).toHaveAttribute('data-scui-row-count', '4');
    expect(idColumn()).toEqual(['A01', 'A03']);
    expect(headCells()[2]).toHaveAttribute('data-scui-filtered', '');
    expect(lastChange(onChange).filters).toEqual({ department: ['研发', '测试'] });

    const reset = [
      ...document.querySelectorAll<HTMLButtonElement>('[data-scui-role="filter-dropdown"] button'),
    ].find((node) => node.textContent === '重置');
    if (reset === undefined) throw new Error('缺少重置按钮');
    clickNode(reset, '重置按钮');
    await waitFor(() => expect(scroll()).toHaveAttribute('data-scui-filtered-row-count', '4'));
    expect(headCells()[2]).not.toHaveAttribute('data-scui-filtered');
  });

  it('自定义 filterDropdown 通过 context 写回引擎，不另建状态', async () => {
    const customColumns: TableColumn<Row>[] = [
      { title: '工号', dataIndex: 'id' },
      {
        title: '部门',
        dataIndex: 'department',
        filterDropdown: (context) => (
          <button
            type="button"
            data-testid="custom-filter"
            onClick={() => {
              context.setSelectedValues(['设计']);
              context.confirm();
            }}
          >
            只看设计
          </button>
        ),
      },
    ];
    render(() => <Table columns={customColumns} data={rows} rowKey="id" />);
    click(filterTriggers(), 0);
    await waitFor(() =>
      expect(document.querySelector('[data-testid="custom-filter"]')).not.toBeNull(),
    );
    clickNode(document.querySelector('[data-testid="custom-filter"]'), '自定义筛选按钮');
    await waitFor(() => expect(scroll()).toHaveAttribute('data-scui-filtered-row-count', '1'));
    expect(idColumn()).toEqual(['A02']);
    expect(document.querySelector('[data-scui-role="filter-dropdown"]')).toBeNull();
  });

  it('server 模式只出参数不本地改数据：筛选与排序都不动行序', async () => {
    const onChange = vi.fn();
    render(() => (
      <Table
        columns={sortColumns}
        data={rows}
        rowKey="id"
        server
        defaultFilters={{ department: ['研发'] }}
        onChange={onChange}
      />
    ));

    expect(table()).toHaveAttribute('data-scui-server', '');
    expect(headCells()[2]).toHaveAttribute('data-scui-filtered', '');
    expect(idColumn()).toEqual(['A01', 'A02', 'A03', 'A04']);
    expect(scroll()).toHaveAttribute('data-scui-filtered-row-count', '4');

    click(sortTriggers(), 0);
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(idColumn()).toEqual(['A01', 'A02', 'A03', 'A04']);
    expect(lastChange(onChange).sorter).toEqual([{ columnKey: 'department', direction: 'asc' }]);
    expect(lastChange(onChange).filters).toEqual({ department: ['研发'] });
  });

  it('筛选与排序任意顺序组合都不互相覆盖', async () => {
    const onChange = vi.fn();
    render(() => <Table columns={sortColumns} data={rows} rowKey="id" onChange={onChange} />);

    click(sortTriggers(), 0); // 先排序
    click(filterTriggers(), 0); // 再开筛选面板
    await waitFor(() =>
      expect(document.querySelector('[data-scui-role="filter-dropdown"]')).not.toBeNull(),
    );
    clickNode(
      document.querySelectorAll<HTMLInputElement>('[data-scui-role="filter-option"] input')[0],
      '组合用例筛选项',
    );
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(2));
    const change = lastChange(onChange);
    expect(change.sorter).toEqual([{ columnKey: 'department', direction: 'asc' }]);
    expect(change.filters).toEqual({ department: ['研发'] });
    expect(headCells()[2]).toHaveAttribute('data-scui-sort', 'asc');
    expect(headCells()[2]).toHaveAttribute('data-scui-filtered', '');
  });
});

describe('Table 引擎：排序 / 筛选纯函数', () => {
  const resolved = resolveColumns(sortColumns);

  it('normalizeSorters 丢掉空 key 与非法方向，并复制一份', () => {
    const input: TableSorter = [
      { columnKey: 'years', direction: 'asc' },
      { columnKey: '', direction: 'asc' },
    ];
    const result = normalizeSorters(input);
    expect(result).toEqual([{ columnKey: 'years', direction: 'asc' }]);
    expect(result[0]).not.toBe(input[0]);
  });

  it('applyFilters 多列 AND / 单列多值 OR；applySorters 按数组顺序定序', () => {
    const filtered = applyFilters(rows, { department: ['研发', '设计'] }, resolved);
    expect(filtered.map((row) => row.id)).toEqual(['A01', 'A02']);

    const byDepartment = applySorters(
      rows,
      [{ columnKey: 'department', direction: 'asc' }],
      resolved,
    );
    expect(byDepartment.map((row) => row.id)).toEqual(['A03', 'A01', 'A02', 'A04']);
    expect(rows.map((row) => row.id)).toEqual(['A01', 'A02', 'A03', 'A04']); // 不改原数组
  });
});
