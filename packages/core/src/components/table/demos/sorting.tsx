import { createSignal } from 'solid-js';
import { Table } from 'solid-craft';
import type { TableChange, TableColumn, TableSorter } from 'solid-craft';
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
  { title: '部门', dataIndex: 'department', sorter: true },
  { title: '年限', dataIndex: 'years', sorter: true },
];

const rows: Row[] = [
  { id: 'A01', name: '张伟', department: '研发', years: 6 },
  { id: 'A02', name: '李娜', department: '设计', years: 4 },
  { id: 'A03', name: '王强', department: '测试', years: 3 },
  { id: 'A04', name: '赵敏', department: '运维', years: 2 },
];

export const demo = {
  title: '排序',
  description: '单列三态循环、多列累加与受控回写；每次变更都从同一个 onChange 出口带出完整状态。',
};

export default function SortingDemo() {
  const [controlled, setControlled] = createSignal<TableSorter>([]);
  const [label, setLabel] = createSignal('不排序');

  const onChange = (change: TableChange): void => {
    setControlled(change.sorter);
    setLabel(
      change.sorter.length === 0
        ? '不排序'
        : change.sorter.map((item) => `${item.columnKey} ${item.direction}`).join('、'),
    );
  };

  return (
    <DemoSection title="排序">
      <div class="demo-stack">
        <Table columns={columns} data={rows} rowKey="id" aria-label="非受控单列排序" />
        <Table
          columns={columns}
          data={rows}
          rowKey="id"
          defaultSorter={[{ columnKey: 'department', direction: 'asc' }]}
          multipleSorters
          aria-label="非受控多列排序"
        />
        <Table
          columns={columns}
          data={rows}
          rowKey="id"
          sorter={controlled()}
          onChange={onChange}
          aria-label="受控排序"
        />
        <span>
          当前排序：<output>{label()}</output>
        </span>
      </div>
    </DemoSection>
  );
}
