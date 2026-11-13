import { createSignal } from 'solid-js';
import { Table } from 'solid-craft';
import type { TableColumn, TableRowSelection } from 'solid-craft';
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
  title: '选择',
  description: '多选行、全选与半选三态；禁用行不进全选集合，受控值由外部回写。',
};

export default function SelectionDemo() {
  const [keys, setKeys] = createSignal<readonly string[]>(['A01']);

  const controlled: TableRowSelection<Row> = {
    selectedRowKeys: keys(),
    onChange: (next) => {
      setKeys(next);
    },
  };

  const withDisabled: TableRowSelection<Row> = {
    isRowDisabled: (row) => row.id === 'A03',
  };

  return (
    <DemoSection title="行选择">
      <div class="demo-stack">
        <Table columns={columns} data={rows} rowKey="id" rowSelection={{}} aria-label="多选行" />
        <Table
          columns={columns}
          data={rows}
          rowKey="id"
          rowSelection={withDisabled}
          aria-label="含禁用行的多选"
        />
        <Table
          columns={columns}
          data={rows}
          rowKey="id"
          rowSelection={controlled}
          aria-label="受控多选"
        />
        <span>
          已选 <output>{keys().length}</output> 行：<output>{keys().join('、')}</output>
        </span>
      </div>
    </DemoSection>
  );
}
