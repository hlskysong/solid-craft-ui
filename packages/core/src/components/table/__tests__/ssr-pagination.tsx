/**
 * T3-06 SSR 入口：验「分页 / 空态 / 加载态在服务端首帧就有完整结构」。
 *
 * 四张表分别覆盖：客户端分页、服务端分页（受控第 2 页）、空态、加载态；
 * 外加一张不启用分页的表，用来钉住「默认零 footer」——T3-01~T3-03 的
 * 既有 DOM 不能因为接了分页就多出常驻节点。
 *
 * 分页区是 `Pagination` 组件本身的输出，服务端与客户端同源，因此
 * `aria-current` / `<option selected>` / 跨列空态都在首帧可见，hydration
 * 不需要补 DOM。
 *
 * 不进 `dist`、不进 npm 包：`collect-sources` 与 `tsconfig.build.json` 排除 `__tests__`。
 */
import { renderToString } from 'solid-js/web';

import { Table } from '../Table';
import type { TableColumn } from '../types';

interface Row {
  id: string;
  name: string;
  department: string;
}

const columns: TableColumn<Row>[] = [
  { title: '工号', dataIndex: 'id' },
  { title: '姓名', dataIndex: 'name' },
  { title: '部门', dataIndex: 'department' },
];

const rows: Row[] = Array.from({ length: 12 }, (_, index) => ({
  id: `A${String(index + 1).padStart(2, '0')}`,
  name: `员工${index + 1}`,
  department: index % 2 === 0 ? '研发' : '设计',
}));

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN">
      <Table columns={columns} data={rows} rowKey="id" aria-label="不启用分页" />
      <Table
        columns={columns}
        data={rows}
        rowKey="id"
        pagination={{
          pageSize: 5,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => (
            <span>
              共 {total} 条，当前 {range[0]}–{range[1]} 条
            </span>
          ),
        }}
        aria-label="客户端分页"
      />
      <Table
        columns={columns}
        data={rows.slice(0, 5)}
        rowKey="id"
        server
        pagination={{ current: 2, pageSize: 5, total: 12 }}
        aria-label="服务端分页"
      />
      <Table
        columns={columns}
        data={[]}
        rowKey="id"
        pagination={{ pageSize: 5 }}
        aria-label="空态"
      />
      <Table
        columns={columns}
        data={rows}
        rowKey="id"
        loading
        pagination={{ pageSize: 5 }}
        aria-label="加载态"
      />
    </div>
  ));
}
