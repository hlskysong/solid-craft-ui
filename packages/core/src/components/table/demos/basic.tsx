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
  { title: '部门', dataIndex: 'department', align: 'center' },
  {
    title: '年限',
    dataIndex: 'years',
    align: 'right',
    render: (value) => <strong>{String(value)} 年</strong>,
  },
];

const rows: Row[] = [
  { id: 'A01', name: '张伟', department: '研发', years: 6 },
  { id: 'A02', name: '李娜', department: '设计', years: 4 },
  { id: 'A03', name: '王强', department: '测试', years: 3 },
  { id: 'A04', name: '赵敏', department: '运维', years: 2 },
];

export const demo = {
  title: '基础用法',
  description: '列配置、数据、行键与自定义渲染；第二张表开启加载态，只落状态属性。',
};

export default function BasicDemo() {
  return (
    <DemoSection title="基础表格">
      <div class="demo-stack">
        <Table columns={columns} data={rows} rowKey="id" aria-label="员工基础信息" />
        <Table
          columns={columns}
          data={rows.slice(0, 2)}
          rowKey="id"
          loading
          aria-label="加载中的表格"
        />
      </div>
    </DemoSection>
  );
}
