# Table 表格 · 边框与尺寸（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/table/demos/borders.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

bordered 开关与三档行高；表头和正文始终共用同一档字号。

## 完整源码

```tsx
import { Table } from 'solid-craft';
import type { TableColumn } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

interface Row {
  id: string;
  name: string;
  department: string;
}

const columns: TableColumn<Row>[] = [
  { title: '工号', dataIndex: 'id', width: 96 },
  { title: '姓名', dataIndex: 'name', width: 120 },
  { title: '部门', dataIndex: 'department' },
];

const rows: Row[] = [
  { id: 'A01', name: '张伟', department: '研发' },
  { id: 'A02', name: '李娜', department: '设计' },
];

export const demo = {
  title: '边框与尺寸',
  description: 'bordered 开关与三档行高；表头和正文始终共用同一档字号。',
};

export default function BordersDemo() {
  return (
    <DemoSection title="边框与尺寸">
      <div class="demo-stack">
        <Table columns={columns} data={rows} rowKey="id" size="small" aria-label="小尺寸无边框" />
        <Table columns={columns} data={rows} rowKey="id" bordered aria-label="中等尺寸带边框" />
        <Table
          columns={columns}
          data={rows}
          rowKey="id"
          size="large"
          bordered
          aria-label="大尺寸带边框"
        />
      </div>
    </DemoSection>
  );
}
```

## 相关页面

- [Table 表格 API](../exports/table.md)
- [设计 Token](../design/tokens.md)
