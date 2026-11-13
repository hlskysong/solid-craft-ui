# Table 表格 · 筛选（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/table/demos/filtering.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

内置下拉、自定义 filterDropdown 与服务端模式；服务端只带出参数，不改动本地数据。

## 完整源码

```tsx
import { createSignal } from 'solid-js';
import { Table } from 'solid-craft';
import type { TableChange, TableColumn } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

interface Row {
  id: string;
  name: string;
  department: string;
  years: number;
}

const columns: TableColumn<Row>[] = [
  { title: '工号', dataIndex: 'id', width: 96 },
  { title: '姓名', dataIndex: 'name', width: 120 },
  {
    title: '部门',
    dataIndex: 'department',
    filters: [
      { text: '研发', value: '研发' },
      { text: '设计', value: '设计' },
      { text: '测试', value: '测试' },
    ],
  },
  { title: '年限', dataIndex: 'years', sorter: true },
];

const customColumns: TableColumn<Row>[] = [
  { title: '工号', dataIndex: 'id', width: 96 },
  { title: '姓名', dataIndex: 'name', width: 120 },
  {
    title: '年限',
    dataIndex: 'years',
    filterDropdown: (context) => (
      <div class="demo-stack">
        <button
          type="button"
          onClick={() => {
            context.setSelectedValues(['6', '4']);
            context.confirm();
          }}
        >
          四年以上
        </button>
        <button type="button" onClick={() => context.reset()}>
          清空筛选
        </button>
      </div>
    ),
  },
];

const rows: Row[] = [
  { id: 'A01', name: '张伟', department: '研发', years: 6 },
  { id: 'A02', name: '李娜', department: '设计', years: 4 },
  { id: 'A03', name: '王强', department: '测试', years: 3 },
  { id: 'A04', name: '赵敏', department: '运维', years: 2 },
];

export const demo = {
  title: '筛选',
  description: '内置下拉、自定义 filterDropdown 与服务端模式；服务端只带出参数，不改动本地数据。',
};

export default function FilteringDemo() {
  const [params, setParams] = createSignal('尚未请求');

  const onChange = (change: TableChange): void => {
    const filters = Object.entries(change.filters)
      .map(([key, values]) => `${key}=${values.join(',')}`)
      .join('；');
    const sorter = change.sorter.map((item) => `${item.columnKey} ${item.direction}`).join('、');
    setParams(`${filters || '无筛选'} / ${sorter || '无排序'}`);
  };

  return (
    <DemoSection title="筛选">
      <div class="demo-stack">
        <Table
          columns={columns}
          data={rows}
          rowKey="id"
          defaultFilters={{ department: ['研发', '测试'] }}
          aria-label="内置筛选下拉"
        />
        <Table columns={customColumns} data={rows} rowKey="id" aria-label="自定义筛选面板" />
        <Table
          columns={columns}
          data={rows}
          rowKey="id"
          server
          onChange={onChange}
          aria-label="服务端模式"
        />
        <span>
          请求参数：<output>{params()}</output>
        </span>
      </div>
    </DemoSection>
  );
}
```

## 相关页面

- [Table 表格 API](../exports/table.md)
- [设计 Token](../design/tokens.md)
