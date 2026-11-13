/**
 * T3-02 SSR 入口：验「排序 / 筛选控件在服务端就是完整静态骨架」。
 *
 * 三张表分别覆盖：① 非受控（defaultSorter + defaultFilters，客户端模式真的改行序
 * 与行数）；② 受控 + 服务端模式（只带参数、不改数据）；③ 空数据。
 * 筛选面板初态关闭，SSR 零输出 `filter-dropdown` —— 这是首帧与客户端一致的
 * 前提，也是 check:ci 判据 9 用 counts=0 钉住的那条。
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
  {
    title: '部门',
    dataIndex: 'department',
    sorter: true,
    filters: [
      { text: '研发', value: '研发' },
      { text: '设计', value: '设计' },
    ],
  },
  { title: '年限', dataIndex: 'years', sorter: true },
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
        defaultSorter={[{ columnKey: 'department', direction: 'asc' }]}
        defaultFilters={{ department: ['研发'] }}
        aria-label="非受控排序与筛选"
      />
      <Table
        columns={columns}
        data={rows}
        rowKey="id"
        sorter={[{ columnKey: 'years', direction: 'desc' }]}
        filters={{ department: ['设计'] }}
        server
        aria-label="受控服务端模式"
      />
      <Table columns={columns} data={[]} rowKey="id" aria-label="空数据排序与筛选" />
    </div>
  ));
}
