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
  { title: '部门', dataIndex: 'department', sorter: true },
  { title: '年限', dataIndex: 'years', align: 'right' },
];

const rows: Row[] = [
  { id: 'A01', name: '张伟', department: '研发', years: 6 },
  { id: 'A02', name: '李娜', department: '设计', years: 4 },
  { id: 'A03', name: '王强', department: '测试', years: 3 },
  { id: 'A04', name: '赵敏', department: '运维', years: 2 },
  { id: 'A05', name: '陈静', department: '研发', years: 8 },
  { id: 'A06', name: '刘洋', department: '设计', years: 5 },
  { id: 'A07', name: '杨帆', department: '测试', years: 2 },
  { id: 'A08', name: '周敏', department: '运维', years: 7 },
  { id: 'A09', name: '吴磊', department: '研发', years: 3 },
  { id: 'A10', name: '徐丽', department: '设计', years: 6 },
  { id: 'A11', name: '孙浩', department: '测试', years: 4 },
  { id: 'A12', name: '马超', department: '运维', years: 9 },
];

export const demo = {
  title: '客户端分页',
  description:
    '数据全在前端时，Table 自己按筛选与排序后的结果切页，total 恒等于结果行数；翻页、排序、筛选共用 onChange 一个三参出口。',
};

export default function PaginationClientDemo() {
  const [lastChange, setLastChange] = createSignal('尚未变更');

  const onChange = (change: TableChange): void => {
    const paging = change.pagination;
    const sorter = change.sorter.map((item) => `${item.columnKey} ${item.direction}`).join('、');
    setLastChange(
      paging === undefined
        ? '未启用分页'
        : `第 ${paging.current} 页 / 每页 ${paging.pageSize} 条 / 共 ${paging.total} 条；排序：${sorter || '无'}`,
    );
  };

  return (
    <DemoSection title="客户端分页">
      <div class="demo-stack">
        <Table
          columns={columns}
          data={rows}
          rowKey="id"
          pagination={{
            defaultPageSize: 5,
            pageSizeOptions: [5, 10, 20],
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => (
              <span>
                共 {total} 条，当前 {range[0]}–{range[1]} 条
              </span>
            ),
          }}
          onChange={onChange}
          aria-label="客户端分页表格"
        />
        <span>
          最近一次变更：<output>{lastChange()}</output>
        </span>
      </div>
    </DemoSection>
  );
}
