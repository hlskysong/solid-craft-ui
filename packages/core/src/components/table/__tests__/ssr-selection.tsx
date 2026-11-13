/**
 * T3-03 SSR 入口：验「行选择列在服务端就是完整静态骨架」。
 *
 * 三张表分别覆盖：① checkbox 非受控，选中 2 / 4 → 全选必须是半选三态；
 * ② radio 受控单选 + 禁用行；③ 不传 `rowSelection`（不渲染选择列）。
 *
 * 首帧断言的三件事：`aria-checked="mixed"` 是 **attribute**，SSR 就能输出
 * （原生 `indeterminate` 是 property，SSR 不序列化，交给客户端 effect）；
 * radio 模式零 `select-all`（没有全选语义）；未启用时选择列零输出。
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

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN">
      <Table
        columns={columns}
        data={rows}
        rowKey="id"
        rowSelection={{ defaultSelectedRowKeys: ['A01', 'A02'] }}
        aria-label="非受控多选，部分选中"
      />
      <Table
        columns={columns}
        data={rows}
        rowKey="id"
        rowSelection={{
          type: 'radio',
          selectedRowKeys: ['A03'],
          isRowDisabled: (row) => row.id === 'A04',
        }}
        aria-label="受控单选，含禁用行"
      />
      <Table columns={columns} data={rows} rowKey="id" aria-label="未启用行选择" />
    </div>
  ));
}
