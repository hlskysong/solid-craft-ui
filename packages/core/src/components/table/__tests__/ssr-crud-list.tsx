/**
 * T3-12 SSR 入口：CRUD 列表页组合 Demo 的静态骨架。
 *
 * 与 form/__tests__/ssr-real-form.tsx 同口径：不 import Demo 文件（Demo 含交互状态、
 * Portal 弹层与全局 message），独立手写一份服务端就能确定性输出的页面结构 ——
 * 查询表单、工具栏、带分页的 Table、新增/编辑表单四块静态骨架齐全。
 *
 * Modal 与 Popconfirm 的浮层只在客户端 onMount 后挂载（primitives/overlay / anchored），
 * 因此服务端一次都不输出：counts 锁 0，而不是写「DOM 里不许有某段文案」的 forbid 假判据。
 *
 * 不进 dist / npm 包：collect-sources 与 tsconfig.build.json 排除 `__tests__`。
 */
import { renderToString } from 'solid-js/web';

import { Button } from '../../button';
import { Form } from '../../form';
import { Input, InputNumber } from '../../input';
import { Select } from '../../select';
import { Table } from '../Table';
import type { TableColumn } from '../types';

interface Row {
  id: string;
  name: string;
  department: string;
  amount: number;
  status: string;
}

const columns: TableColumn<Row>[] = [
  { title: '计划编号', dataIndex: 'id' },
  { title: '计划名称', dataIndex: 'name' },
  { title: '申报单位', dataIndex: 'department' },
  { title: '本次采购金额（万元）', dataIndex: 'amount' },
  { title: '状态', dataIndex: 'status' },
];

const rows: Row[] = [
  {
    id: 'PLAN-01',
    name: '主井提升机变频改造',
    department: '设备部',
    amount: 86.5,
    status: '已审批',
  },
  {
    id: 'PLAN-02',
    name: '综采工作面液压支架检修',
    department: '设备部',
    amount: 124,
    status: '草稿',
  },
  {
    id: 'PLAN-03',
    name: '矿井通风在线监测系统',
    department: '研发部',
    amount: 58.2,
    status: '已审批',
  },
  {
    id: 'PLAN-04',
    name: '选煤厂皮带机驱动更换',
    department: '设备部',
    amount: 39.8,
    status: '已锁定',
  },
];

const DEPARTMENT_OPTIONS = [
  { value: '研发部', label: '研发部' },
  { value: '设备部', label: '设备部' },
  { value: '财务部', label: '财务部' },
];

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN" data-testid="crud-ssr-page">
      <Form layout="inline" initialValues={{ keyword: '' }} aria-label="计划查询">
        <Form.Item name="keyword" label="计划名称">
          <Input placeholder="按名称关键字查询" />
        </Form.Item>
        <Button htmlType="submit">查询</Button>
        <Button variant="outline" color="neutral">
          重置
        </Button>
      </Form>

      <div>
        <Button>新增计划</Button>
        <output>当前 4 条</output>
        <output>最近操作：等待操作</output>
      </div>

      <Table
        columns={columns}
        data={rows}
        rowKey="id"
        bordered
        pagination={{
          pageSize: 5,
          showSizeChanger: true,
          showTotal: (total) => <span>共 {total} 条计划</span>,
        }}
        aria-label="维简设备采购计划列表"
      />

      <Form
        layout="vertical"
        initialValues={{ name: '主井提升机变频改造', department: '设备部', amount: 86.5 }}
        aria-label="采购计划表单"
      >
        <Form.Item
          name="name"
          label="计划名称"
          rules={[{ required: true, message: '请输入计划名称' }]}
        >
          <Input placeholder="请输入计划名称" />
        </Form.Item>
        <Form.Item name="department" label="申报单位">
          <Select options={DEPARTMENT_OPTIONS} placeholder="请选择申报单位" />
        </Form.Item>
        <Form.Item
          name="amount"
          label="本次采购金额（万元）"
          rules={[{ min: 1, message: '金额不得低于 1 万元' }]}
        >
          <InputNumber min={1} step={1} />
        </Form.Item>
      </Form>
    </div>
  ));
}
