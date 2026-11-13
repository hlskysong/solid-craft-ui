# Table 表格 · 单选（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/table/demos/selection-radio.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

单选模式不渲染全选，选中集合恒为一行，表头保留可访问文案。

## 完整源码

```tsx
import { createSignal } from 'solid-js';
import { Table } from 'solid-craft';
import type { TableColumn } from 'solid-craft';
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
  { title: '部门', dataIndex: 'department' },
  { title: '年限', dataIndex: 'years', align: 'right' },
];

const rows: Row[] = [
  { id: 'A01', name: '张伟', department: '研发', years: 6 },
  { id: 'A02', name: '李娜', department: '设计', years: 4 },
  { id: 'A03', name: '王强', department: '测试', years: 3 },
  { id: 'A04', name: '赵敏', department: '运维', years: 2 },
];

export const demo = {
  title: '单选',
  description: '单选模式不渲染全选，选中集合恒为一行，表头保留可访问文案。',
};

export default function SelectionRadioDemo() {
  const [picked, setPicked] = createSignal<readonly string[]>(['A02']);

  return (
    <DemoSection title="单选行">
      <div class="demo-stack">
        <Table
          columns={columns}
          data={rows}
          rowKey="id"
          rowSelection={{
            type: 'radio',
            selectedRowKeys: picked(),
            onChange: (next) => {
              setPicked(next);
            },
          }}
          aria-label="单选行"
        />
        <span>
          当前选中：<output>{picked()[0] ?? '未选择'}</output>
        </span>
      </div>
    </DemoSection>
  );
}
```

## 相关页面

- [Table 表格 API](../exports/table.md)
- [设计 Token](../design/tokens.md)
