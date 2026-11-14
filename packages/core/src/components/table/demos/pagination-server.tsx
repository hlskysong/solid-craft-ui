import { createMemo, createSignal } from 'solid-js';
import { Table } from 'solid-craft';
import type { TableChange, TableColumn } from 'solid-craft';
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

const allRows: Row[] = Array.from({ length: 12 }, (_, index) => ({
  id: `A${String(index + 1).padStart(2, '0')}`,
  name: `员工${index + 1}`,
  department: index % 2 === 0 ? '研发' : '设计',
}));

export const demo = {
  title: '服务端分页',
  description:
    'server 模式表内一行都不切，业务侧拿 onChange.pagination 直接拼请求、回写当前页数据；total 由调用方给出。',
};

export default function PaginationServerDemo() {
  const [page, setPage] = createSignal(1);
  const [pageSize, setPageSize] = createSignal(5);
  const [request, setRequest] = createSignal('尚未请求');

  // 模拟一次服务端响应：真实项目里这一步换成 fetch 后回写 data 即可。
  const currentPageRows = createMemo(() =>
    allRows.slice((page() - 1) * pageSize(), page() * pageSize()),
  );

  const onChange = (change: TableChange): void => {
    const paging = change.pagination;
    if (paging === undefined) return;
    setPage(paging.current);
    setPageSize(paging.pageSize);
    setRequest(`?page=${paging.current}&pageSize=${paging.pageSize}&total=${paging.total}`);
  };

  return (
    <DemoSection title="服务端分页">
      <div class="demo-stack">
        <Table
          columns={columns}
          data={currentPageRows()}
          rowKey="id"
          server
          pagination={{
            current: page(),
            pageSize: pageSize(),
            total: allRows.length,
            pageSizeOptions: [5, 10],
            showSizeChanger: true,
            showTotal: (total) => <span>服务端共 {total} 条</span>,
          }}
          onChange={onChange}
          aria-label="服务端分页表格"
        />
        <span>
          请求参数：<output>{request()}</output>
        </span>
      </div>
    </DemoSection>
  );
}
