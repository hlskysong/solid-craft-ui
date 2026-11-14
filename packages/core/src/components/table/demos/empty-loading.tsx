import { createSignal } from 'solid-js';
import { Button, Table } from 'solid-craft';
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
  { id: 'A03', name: '王强', department: '测试' },
];

type ViewState = 'empty' | 'loading' | 'ready';

export const demo = {
  title: '空态与加载态',
  description:
    '空数据复用 Empty 占位，加载中复用 Spin 遮罩且分页禁用；两者互斥，切换时表头与列宽不变，不产生布局抖动。',
};

export default function EmptyLoadingDemo() {
  const [view, setView] = createSignal<ViewState>('empty');

  return (
    <DemoSection title="空态与加载态">
      <div class="demo-stack">
        <div class="demo-row">
          <Button data-testid="state-empty" onClick={() => setView('empty')}>
            空数据
          </Button>
          <Button data-testid="state-loading" onClick={() => setView('loading')}>
            加载中
          </Button>
          <Button data-testid="state-ready" onClick={() => setView('ready')}>
            有数据
          </Button>
        </div>
        <Table
          columns={columns}
          data={view() === 'ready' ? rows : []}
          rowKey="id"
          loading={view() === 'loading'}
          pagination={{ pageSize: 5 }}
          aria-label="空态与加载态表格"
        />
      </div>
    </DemoSection>
  );
}
