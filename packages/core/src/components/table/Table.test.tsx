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
  normalizeSelectedKeys,
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

  it('空数据保留表头、渲染空态占位（T3-06），行数属性仍为 0', () => {
    render(() => <Table columns={columns} data={[]} />);
    expect(scroll()).toHaveAttribute('data-scui-row-count', '0');
    expect(headCells()).toHaveLength(4);
    // T3-06 起 tbody 里有一行跨列的空态占位，不再是「空 tbody」；
    // 数据行仍为 0，行数属性口径不变。
    expect(rowNodes()).toHaveLength(0);
    expect(bodyCells()).toHaveLength(1);
    const emptyCell = document.querySelector('[data-scui-role="table-empty-row"] td');
    expect(emptyCell?.getAttribute('colspan')).toBe('4');
    expect(document.querySelector('[data-scui-role="empty"]')).not.toBeNull();
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

describe('Table：T3-03 行选择', () => {
  const selectAll = (): HTMLInputElement | null =>
    document.querySelector<HTMLInputElement>('[data-scui-role="select-all"]');
  const selectRows = (): NodeListOf<HTMLInputElement> =>
    document.querySelectorAll<HTMLInputElement>('[data-scui-role="select-row"]');

  const selectNode = (index: number): HTMLInputElement => {
    const node = selectRows()[index];
    if (node === undefined) throw new Error(`缺少第 ${index} 行选择控件`);
    return node;
  };

  const lastSelection = (spy: ReturnType<typeof vi.fn>): readonly string[] => {
    const call = spy.mock.calls.at(-1);
    if (call === undefined) throw new Error('onChange 未被调用');
    return call[0] as readonly string[];
  };

  it('不传 rowSelection 时不渲染选择列', () => {
    render(() => <Table columns={columns} data={rows} rowKey="id" />);

    expect(selectAll()).toBeNull();
    expect(selectRows()).toHaveLength(0);
    expect(headCells()).toHaveLength(4);
  });

  it('checkbox：全选 / 半选三态与 aria-checked 同步', async () => {
    const onChange = vi.fn();
    render(() => <Table columns={columns} data={rows} rowKey="id" rowSelection={{ onChange }} />);

    expect(selectAll()).not.toBeNull();
    expect(selectRows()).toHaveLength(4);
    expect(selectAll()?.getAttribute('aria-checked')).toBe('false');

    clickNode(selectNode(0), '第 1 行选择');
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(lastSelection(onChange)).toEqual(['A01']);
    expect(selectAll()?.getAttribute('aria-checked')).toBe('mixed');
    expect(selectAll()?.indeterminate).toBe(true);
    expect(rowNodes()[0]).toHaveAttribute('data-scui-selected', '');

    clickNode(selectAll(), '全选');
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(2));
    expect(lastSelection(onChange)).toEqual(['A01', 'A02', 'A03', 'A04']);
    expect(selectAll()?.getAttribute('aria-checked')).toBe('true');
    expect(selectAll()?.indeterminate).toBe(false);
  });

  it('禁用行不进全选集合，且点击无效', async () => {
    const onChange = vi.fn();
    render(() => (
      <Table
        columns={columns}
        data={rows}
        rowKey="id"
        rowSelection={{ onChange, isRowDisabled: (row) => row.id === 'A03' }}
      />
    ));

    expect(selectNode(2).disabled).toBe(true);
    expect(rowNodes()[2]).toHaveAttribute('data-scui-row-disabled', '');
    expect(rowNodes()[0]).not.toHaveAttribute('data-scui-row-disabled');

    clickNode(selectAll(), '全选');
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(lastSelection(onChange)).toEqual(['A01', 'A02', 'A04']);
    expect(selectNode(2).checked).toBe(false);

    clickNode(selectNode(2), '禁用行选择');
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(selectNode(2).checked).toBe(false);
  });

  it('受控：点击只发 onChange，不回写内部选中态', async () => {
    const onChange = vi.fn();
    render(() => (
      <Table
        columns={columns}
        data={rows}
        rowKey="id"
        rowSelection={{ selectedRowKeys: ['A02'], onChange }}
      />
    ));

    expect(selectNode(1).checked).toBe(true);

    clickNode(selectNode(0), '第 1 行选择');
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(lastSelection(onChange)).toEqual(['A02', 'A01']);
    // 受控值没变：DOM 必须回弹，不能停留在浏览器切换后的状态
    expect(selectNode(1).checked).toBe(true);
    expect(selectNode(0).checked).toBe(false);
  });

  it('非受控 defaultSelectedRowKeys 生效，并据此给出半选', () => {
    render(() => (
      <Table
        columns={columns}
        data={rows}
        rowKey="id"
        rowSelection={{ defaultSelectedRowKeys: ['A01', 'A04'] }}
      />
    ));

    expect(selectNode(0).checked).toBe(true);
    expect(selectNode(3).checked).toBe(true);
    expect(selectAll()?.indeterminate).toBe(true);
    expect(selectAll()?.getAttribute('aria-checked')).toBe('mixed');
  });

  it('radio：无全选控件，选中集合恒为 1 项，表头保留可访问文案', async () => {
    const onChange = vi.fn();
    render(() => (
      <Table
        columns={columns}
        data={rows}
        rowKey="id"
        rowSelection={{ type: 'radio', defaultSelectedRowKeys: ['A01'], onChange }}
      />
    ));

    expect(selectAll()).toBeNull();
    expect(selectRows()).toHaveLength(4);
    expect(headCells()[0]).toHaveTextContent('选择');
    expect(selectNode(0).type).toBe('radio');
    expect(selectNode(0).checked).toBe(true);
    // 同组同 name，否则点击时浏览器不会互斥
    expect(selectNode(1).name).toBe(selectNode(0).name);
    expect(selectNode(0).name).not.toBe('');

    clickNode(selectNode(2), '第 3 行选择');
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(lastSelection(onChange)).toEqual(['A03']);
    expect(selectNode(2).checked).toBe(true);
    expect(selectNode(0).checked).toBe(false);
  });

  it('选中集合含视图外 key 时，全选只动当前视图并保留外部残留', async () => {
    const onChange = vi.fn();
    render(() => (
      <Table
        columns={columns}
        data={rows}
        rowKey="id"
        rowSelection={{ selectedRowKeys: ['Z99'], onChange }}
      />
    ));

    clickNode(selectAll(), '全选');
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(lastSelection(onChange)).toEqual(['Z99', 'A01', 'A02', 'A03', 'A04']);
  });
});

describe('Table 引擎：行选择纯函数', () => {
  it('normalizeSelectedKeys 复制一份，避免外部改动穿透', () => {
    const input = ['A01'];
    const result = normalizeSelectedKeys(input);
    expect(result).toEqual(['A01']);
    expect(result).not.toBe(input);
    expect(normalizeSelectedKeys(undefined)).toEqual([]);
  });
});

describe('Table：T3-06 分页 / 空态 / 加载态', () => {
  const manyRows: Row[] = Array.from({ length: 12 }, (_, index) => ({
    id: `A${String(index + 1).padStart(2, '0')}`,
    name: `员工${index + 1}`,
    department: index % 2 === 0 ? '研发' : '设计',
    years: index + 1,
  }));
  const pagingColumns: TableColumn<Row>[] = [
    { title: '工号', dataIndex: 'id' },
    {
      title: '部门',
      dataIndex: 'department',
      sorter: true,
      filters: [
        { text: '研发', value: '研发' },
        { text: '设计', value: '设计' },
      ],
    },
  ];
  const visibleIds = (): (string | null)[] =>
    [...document.querySelectorAll('[data-scui-row-key]')].map((node) =>
      node.getAttribute('data-scui-row-key'),
    );
  const pageButton = (page: number): HTMLButtonElement => {
    const node = document.querySelector<HTMLButtonElement>(`[data-scui-page="${page}"]`);
    if (node === null) throw new Error(`缺少第 ${page} 页按钮`);
    return node;
  };
  const footer = (): Element | null => document.querySelector('[data-scui-role="table-footer"]');
  const lastChange = (spy: ReturnType<typeof vi.fn>): TableChange => {
    const call = spy.mock.calls.at(-1);
    if (call === undefined) throw new Error('onChange 未被调用');
    return call[0] as TableChange;
  };
  const oneOf = (role: string): Element => {
    const node = document.querySelector(`[data-scui-role="${role}"]`);
    if (node === null) throw new Error(`缺少 ${role} 节点`);
    return node;
  };

  it('不启用分页时零 footer，onChange.pagination 仍为 undefined', async () => {
    const onChange = vi.fn();
    render(() => <Table columns={pagingColumns} data={manyRows} rowKey="id" onChange={onChange} />);
    expect(footer()).toBeNull();
    expect(oneOf('table-root')).not.toBeNull();
    fireEvent.click(oneOf('sort-trigger'));
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(lastChange(onChange).pagination).toBeUndefined();
  });

  it('pagination={false} 与不传等价；启用后 footer 在滚动容器之外', () => {
    const { unmount } = render(() => (
      <Table columns={pagingColumns} data={manyRows} rowKey="id" pagination={false} />
    ));
    expect(footer()).toBeNull();
    unmount();

    render(() => (
      <Table columns={pagingColumns} data={manyRows} rowKey="id" pagination={{ pageSize: 5 }} />
    ));
    const root = oneOf('table-root');
    const scrollNode = oneOf('table-scroll');
    expect(footer()).not.toBeNull();
    expect(scrollNode.contains(footer())).toBe(false);
    expect(root.contains(footer())).toBe(true);
    expect(oneOf('pagination')).not.toBeNull();
    expect(pageButton(1)).toHaveAttribute('aria-current', 'page');
    expect(visibleIds()).toEqual(['A01', 'A02', 'A03', 'A04', 'A05']);
  });

  it('客户端分页翻页：行切片变化，onChange 带出完整三参', async () => {
    const onChange = vi.fn();
    render(() => (
      <Table
        columns={pagingColumns}
        data={manyRows}
        rowKey="id"
        pagination={{ pageSize: 5 }}
        onChange={onChange}
      />
    ));
    fireEvent.click(pageButton(2));
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(visibleIds()).toEqual(['A06', 'A07', 'A08', 'A09', 'A10']);
    expect(pageButton(2)).toHaveAttribute('aria-current', 'page');
    expect(lastChange(onChange)).toEqual({
      filters: {},
      sorter: [],
      pagination: { current: 2, pageSize: 5, total: 12 },
    });
  });

  it('排序 + 筛选 + 翻页任意组合状态不丢；只有筛选把页码归一到 1', async () => {
    const onChange = vi.fn();
    render(() => (
      <Table
        columns={pagingColumns}
        data={manyRows}
        rowKey="id"
        pagination={{ pageSize: 5 }}
        onChange={onChange}
      />
    ));

    fireEvent.click(pageButton(2));
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(lastChange(onChange).pagination?.current).toBe(2);

    // 排序不改结果集，保留当前页；sorter 必须进快照。
    fireEvent.click(oneOf('sort-trigger'));
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(2));
    expect(lastChange(onChange).sorter).toEqual([{ columnKey: 'department', direction: 'asc' }]);
    expect(lastChange(onChange).pagination?.current).toBe(2);

    // 筛选把结果集从 12 条缩到 6 条：服务端模式下业务侧拿参数直接请求，
    // 若仍带 current=2 之前的旧页码会落空页，因此归一到 1。
    fireEvent.click(oneOf('filter-trigger'));
    const option = oneOf('filter-option').querySelector('input');
    if (option === null) throw new Error('缺少筛选选项');
    fireEvent.click(option);
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(3));
    expect(lastChange(onChange).filters).toEqual({ department: ['研发'] });
    expect(lastChange(onChange).sorter).toEqual([{ columnKey: 'department', direction: 'asc' }]);
    expect(lastChange(onChange).pagination).toEqual({ current: 1, pageSize: 5, total: 6 });
    expect(pageButton(1)).toHaveAttribute('aria-current', 'page');

    // 再翻页，筛选与排序都还在。
    fireEvent.click(pageButton(2));
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(4));
    expect(lastChange(onChange).filters).toEqual({ department: ['研发'] });
    expect(lastChange(onChange).sorter).toEqual([{ columnKey: 'department', direction: 'asc' }]);
    expect(lastChange(onChange).pagination?.current).toBe(2);
  });

  it('受控 current：点击只发 onChange，视图按调用方的值回弹', async () => {
    const onChange = vi.fn();
    render(() => (
      <Table
        columns={pagingColumns}
        data={manyRows}
        rowKey="id"
        pagination={{ current: 1, pageSize: 5 }}
        onChange={onChange}
      />
    ));
    fireEvent.click(pageButton(2));
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(lastChange(onChange).pagination?.current).toBe(2);
    // 受控值没回写：DOM 仍停在第 1 页，且行切片不变。
    expect(pageButton(1)).toHaveAttribute('aria-current', 'page');
    expect(visibleIds()).toEqual(['A01', 'A02', 'A03', 'A04', 'A05']);
  });

  it('server 模式不切数据、total 由调用方给，onChange 参数可直接拼请求', async () => {
    const onChange = vi.fn();
    render(() => (
      <Table
        columns={pagingColumns}
        data={manyRows.slice(0, 5)}
        rowKey="id"
        server
        pagination={{ current: 2, pageSize: 5, total: 12 }}
        onChange={onChange}
      />
    ));
    expect(visibleIds()).toHaveLength(5);
    expect(pageButton(2)).toHaveAttribute('aria-current', 'page');
    fireEvent.click(pageButton(3));
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(lastChange(onChange)).toEqual({
      filters: {},
      sorter: [],
      pagination: { current: 3, pageSize: 5, total: 12 },
    });
    // 调用方没回写 data 前，Table 一行都不动。
    expect(visibleIds()).toEqual(['A01', 'A02', 'A03', 'A04', 'A05']);
  });

  it('越界页码双层收敛：渲染期 clamp，非受控内部信号也写回', async () => {
    const [data, setData] = createSignal(manyRows);
    render(() => (
      <Table
        columns={pagingColumns}
        data={data()}
        rowKey="id"
        pagination={{ defaultCurrent: 99, pageSize: 5 }}
      />
    ));
    expect(pageButton(3)).toHaveAttribute('aria-current', 'page');

    setData(manyRows.slice(0, 6));
    await waitFor(() => expect(pageButton(2)).toHaveAttribute('aria-current', 'page'));

    // 数据恢复后页码停在 2 而不是弹回越界的 99 —— 内部信号确实被写回了。
    setData(manyRows);
    await waitFor(() => expect(pageButton(2)).toHaveAttribute('aria-current', 'page'));
  });

  it('pageSize 档位与 showTotal 透传；区间文案由 Pagination 计算', () => {
    render(() => (
      <Table
        columns={pagingColumns}
        data={manyRows}
        rowKey="id"
        pagination={{
          pageSize: 4,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => (
            <span data-scui-role="total-text">
              共 {total} 条 / {range[0]}-{range[1]}
            </span>
          ),
        }}
      />
    ));
    expect(visibleIds()).toHaveLength(4);
    expect(oneOf('pagination-total').textContent).toContain('共 12 条 / 1-4');
    expect(oneOf('pagination-size')).not.toBeNull();
    expect(oneOf('pagination-jump')).not.toBeNull();
  });

  it('空态用 Empty、加载态用 Spin，两者互斥；加载时分页禁用', async () => {
    const [loading, setLoading] = createSignal(false);
    render(() => (
      <Table
        columns={pagingColumns}
        data={[]}
        rowKey="id"
        loading={loading()}
        pagination={{ pageSize: 5 }}
      />
    ));
    expect(oneOf('table-empty-row')).not.toBeNull();
    expect(oneOf('empty')).not.toBeNull();
    expect(document.querySelector('[data-scui-role="table-loading"]')).toBeNull();

    setLoading(true);
    await waitFor(() =>
      expect(document.querySelector('[data-scui-role="table-loading"]')).not.toBeNull(),
    );
    expect(oneOf('spin')).not.toBeNull();
    expect(document.querySelector('[data-scui-role="table-empty-row"]')).toBeNull();
    expect(oneOf('pagination')).toHaveAttribute('data-scui-disabled', '');
  });

  it('分页后全选只作用于当前页，不把别页行拉进选中集合', async () => {
    const onChange = vi.fn();
    render(() => (
      <Table
        columns={pagingColumns}
        data={manyRows}
        rowKey="id"
        pagination={{ pageSize: 5 }}
        rowSelection={{ onChange }}
      />
    ));
    const selectAll = document.querySelector<HTMLInputElement>('[data-scui-role="select-all"]');
    if (selectAll === null) throw new Error('缺少全选控件');
    fireEvent.click(selectAll);
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    const call = onChange.mock.calls.at(-1);
    expect(call?.[0]).toEqual(['A01', 'A02', 'A03', 'A04', 'A05']);
  });
});
