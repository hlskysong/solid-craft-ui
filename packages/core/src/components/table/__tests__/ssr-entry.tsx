/**
 * T3-01 SSR 入口：验「服务端输出完整静态表格骨架 + 状态属性两态稳定」。
 *
 * 三张表分别覆盖：默认档（medium / default / 无边框）、全状态档
 * （small / compact / bordered / loading）与空数据档。`data-scui-row-count`
 * 必须等于真实行数，加载态只落 `data-scui-loading` + `aria-busy`、不引入
 * 任何 client-only 节点 —— 服务端与客户端首帧的属性集因此一致。
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
  { title: '部门', dataIndex: 'department', align: 'center' },
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
      <Table columns={columns} data={rows} rowKey="id" aria-label="基础表格" />
      <Table
        columns={columns}
        data={rows}
        rowKey="id"
        loading
        bordered
        density="compact"
        size="small"
        aria-label="紧凑表格"
      />
      <Table columns={columns} data={[]} rowKey="id" aria-label="空表格" />
    </div>
  ));
}
