# Table 表格 · 密度档位（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/table/demos/density.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

舒适、默认、紧凑三档单元格内距；密度只改内距，不改变行高与字号。

## 完整源码

```tsx
import { For } from 'solid-js';
import { Table } from 'solid-craft';
import type { TableColumn, TableDensity } from 'solid-craft';
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

const densities: readonly TableDensity[] = ['comfortable', 'default', 'compact'];
const labels: Record<TableDensity, string> = {
  comfortable: '舒适 16 / 16',
  default: '默认 12 / 12',
  compact: '紧凑 8 / 8',
};

export const demo = {
  title: '密度档位',
  description: '舒适、默认、紧凑三档单元格内距；密度只改内距，不改变行高与字号。',
};

export default function DensityDemo() {
  return (
    <DemoSection title="密度档位">
      <div class="demo-stack">
        <For each={densities}>
          {(density) => (
            <Table
              columns={columns}
              data={rows}
              rowKey="id"
              density={density}
              aria-label={labels[density]}
            />
          )}
        </For>
      </div>
    </DemoSection>
  );
}
```

## 相关页面

- [Table 表格 API](../exports/table.md)
- [设计 Token](../design/tokens.md)
