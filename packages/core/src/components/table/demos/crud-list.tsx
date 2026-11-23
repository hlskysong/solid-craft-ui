import { createMemo, createSignal, onMount, type JSX } from 'solid-js';
import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
  Table,
  Tag,
  useForm,
  type FormInstance,
  type FormValues,
  type TableChange,
  type TableColumn,
} from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: 'CRUD 列表页（查询 / 新增 / 编辑 / 删除）',
  description:
    '一页真实列表页：Form 查询 + Table 三参 onChange + Modal 新增编辑 + Popconfirm 删除确认 + 静态 message 反馈，四条链路端到端可跑；只组合既有组件，不新增组件或属性。',
};

type PlanStatus = 'draft' | 'approved' | 'locked';

interface Plan {
  id: string;
  name: string;
  department: string;
  amount: number;
  status: PlanStatus;
}

const STATUS_TEXT: Record<PlanStatus, string> = {
  draft: '草稿',
  approved: '已审批',
  locked: '已锁定',
};

const STATUS_COLOR: Record<PlanStatus, 'neutral' | 'success' | 'danger'> = {
  draft: 'neutral',
  approved: 'success',
  locked: 'danger',
};

const DEPARTMENT_OPTIONS = [
  { value: '研发部', label: '研发部' },
  { value: '设备部', label: '设备部' },
  { value: '财务部', label: '财务部' },
];

const INITIAL_PLANS: readonly Plan[] = [
  {
    id: 'PLAN-01',
    name: '主井提升机变频改造',
    department: '设备部',
    amount: 86.5,
    status: 'approved',
  },
  {
    id: 'PLAN-02',
    name: '综采工作面液压支架检修',
    department: '设备部',
    amount: 124,
    status: 'draft',
  },
  {
    id: 'PLAN-03',
    name: '矿井通风在线监测系统',
    department: '研发部',
    amount: 58.2,
    status: 'approved',
  },
  {
    id: 'PLAN-04',
    name: '选煤厂皮带机驱动更换',
    department: '设备部',
    amount: 39.8,
    status: 'locked',
  },
  {
    id: 'PLAN-05',
    name: '井下人员定位基站扩容',
    department: '研发部',
    amount: 72.6,
    status: 'draft',
  },
  {
    id: 'PLAN-06',
    name: '地面变电所继电保护改造',
    department: '财务部',
    amount: 45.3,
    status: 'approved',
  },
  {
    id: 'PLAN-07',
    name: '矿区视频监控存储扩容',
    department: '研发部',
    amount: 28.9,
    status: 'draft',
  },
  {
    id: 'PLAN-08',
    name: '压风机余热回收装置',
    department: '设备部',
    amount: 66.1,
    status: 'locked',
  },
];

const EMPTY_PLAN: FormValues = {
  name: '',
  department: '设备部',
  amount: 10,
};

/** FormValues holds unknown: narrow to string before use (no-base-to-string). */
const asText = (value: unknown, fallback: string): string =>
  typeof value === 'string' ? value : fallback;

/**
 * Modal 的内容走 Portal，只在弹层打开后才挂载；而 `useForm.setFieldsValue`
 * 只作用于已注册的字段（`Form.Item` 渲染时 register）。若在「打开弹层」之前
 * 回填，值会全丢、注册时又回落到 useForm 初值 —— 编辑态输入框因此变空。
 * 这个零 DOM 组件放在 Form 的最后一个 child，onMount 时三个字段已注册完毕，
 * 由它单点完成「新增清空 / 编辑回填」，业务侧不再在开关弹层时另写一份。
 */
function FillFieldsOnMount(props: { form: FormInstance; row: Plan | null }): JSX.Element {
  onMount(() => {
    const row = props.row;
    if (row === null) {
      props.form.resetFields();
      return;
    }
    props.form.setFieldsValue({
      name: row.name,
      department: row.department,
      amount: row.amount,
    });
  });
  return null;
}

export default function CrudListDemo() {
  const [plans, setPlans] = createSignal<readonly Plan[]>(INITIAL_PLANS);
  const [query, setQuery] = createSignal('');
  const [log, setLog] = createSignal('等待操作');
  const [modalOpen, setModalOpen] = createSignal(false);
  const [editing, setEditing] = createSignal<Plan | null>(null);
  const [nextSeq, setNextSeq] = createSignal(9);

  const [queryForm] = useForm<FormValues>({ keyword: '' });
  const [planForm] = useForm<FormValues>(EMPTY_PLAN);

  const visiblePlans = createMemo(() => {
    const key = query().trim();
    return key === '' ? plans() : plans().filter((row) => row.name.includes(key));
  });

  const handleQuery = (values: FormValues): void => {
    const key = asText(values.keyword, '');
    setQuery(key);
    setLog(`查询 ${key === '' ? '全部计划' : key}`);
    void message.info('列表已刷新');
  };

  const handleReset = (): void => {
    queryForm.resetFields();
    setQuery('');
    setLog('已重置查询');
  };

  const openCreate = (): void => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row: Plan): void => {
    setEditing(row);
    setModalOpen(true);
  };

  // Modal 的 onOk 返回 Promise：resolve 才关闭；校验不通过时 reject 保持打开，
  // 业务侧自己用 message 给反馈（T3-07 的异步协议，不在组件层造第二套状态）。
  const handleSubmit = (): Promise<void> =>
    planForm.validateFields().then((result) => {
      if (!result.valid) {
        void message.error('请先补全计划信息');
        throw new Error('计划表单校验未通过');
      }
      const values = result.values;
      const name = asText(values.name, '');
      const department = asText(values.department, '设备部');
      const amount = Number(values.amount ?? 0);
      const editingRow = editing();
      if (editingRow === null) {
        const id = `PLAN-${String(nextSeq()).padStart(2, '0')}`;
        setNextSeq(nextSeq() + 1);
        setPlans((list) => [...list, { id, name, department, amount, status: 'draft' }]);
        setLog(`新增 ${id} ${name}`);
        void message.success('采购计划已新增');
      } else {
        setPlans((list) =>
          list.map((row) =>
            row.id === editingRow.id ? { ...row, name, department, amount } : row,
          ),
        );
        setLog(`编辑 ${editingRow.id} ${name}`);
        void message.success('采购计划已更新');
      }
      setModalOpen(false);
    });

  const handleDelete = (row: Plan): void => {
    setPlans((list) => list.filter((item) => item.id !== row.id));
    setLog(`删除 ${row.id} ${row.name}`);
    void message.success('采购计划已删除');
  };

  // Table 的唯一出口一次给出三参完整快照；业务侧不自己维护页码，也不二次翻译。
  const handleTableChange = (change: TableChange): void => {
    const page = change.pagination;
    setLog(
      `表格变更：第 ${page?.current ?? 1} 页 / 每页 ${page?.pageSize ?? 5} 条 / 共 ${page?.total ?? 0} 条 / 排序 ${change.sorter.length} 列 / 筛选 ${Object.keys(change.filters).length} 列`,
    );
  };

  const columns: TableColumn<Plan>[] = [
    { title: '计划编号', dataIndex: 'id', width: 110 },
    { title: '计划名称', dataIndex: 'name' },
    { title: '申报单位', dataIndex: 'department', width: 110 },
    {
      title: '本次采购金额（万元）',
      dataIndex: 'amount',
      width: 180,
      align: 'right',
      render: (value) => <span>{Number(value ?? 0).toFixed(1)}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value) => {
        const status = String(value) as PlanStatus;
        return <Tag color={STATUS_COLOR[status]}>{STATUS_TEXT[status] ?? status}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_value, row) => (
        <div class="demo-row" data-testid={`crud-actions-${row.id}`}>
          <Button
            variant="text"
            color="primary"
            data-testid={`crud-edit-${row.id}`}
            onClick={() => openEdit(row)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该计划？"
            description="删除后不可恢复。"
            okText="确认删除"
            onOk={() => handleDelete(row)}
          >
            删除
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <DemoSection title="维简设备采购计划：列表 / 查询 / 新增 / 编辑 / 删除">
      <div class="demo-stack">
        <Form
          form={queryForm}
          layout="inline"
          aria-label="计划查询"
          data-testid="crud-query"
          onFinish={handleQuery}
        >
          <Form.Item name="keyword" label="计划名称">
            <Input placeholder="按名称关键字查询" data-testid="crud-query-keyword" />
          </Form.Item>
          <Button htmlType="submit" data-testid="crud-query-submit">
            查询
          </Button>
          <Button
            variant="outline"
            color="neutral"
            data-testid="crud-query-reset"
            onClick={handleReset}
          >
            重置
          </Button>
        </Form>

        <div class="demo-row" data-testid="crud-toolbar">
          <Button data-testid="crud-create" onClick={openCreate}>
            新增计划
          </Button>
          <output data-testid="crud-count">当前 {visiblePlans().length} 条</output>
          <output data-testid="crud-log">最近操作：{log()}</output>
        </div>

        <Table
          columns={columns}
          data={visiblePlans()}
          rowKey="id"
          bordered
          pagination={{
            defaultPageSize: 5,
            pageSizeOptions: [5, 10],
            showSizeChanger: true,
            showTotal: (total) => <span>共 {total} 条计划</span>,
          }}
          onChange={handleTableChange}
          aria-label="维简设备采购计划列表"
          data-testid="crud-table"
        />

        <Modal
          title={editing() === null ? '新增采购计划' : '编辑采购计划'}
          open={modalOpen()}
          onOpenChange={setModalOpen}
          onOk={handleSubmit}
          okText="保存计划"
          cancelText="取消"
        >
          <div data-testid="crud-modal-body">
            <Form
              form={planForm}
              layout="vertical"
              aria-label="采购计划表单"
              data-testid="crud-modal-form"
            >
              <Form.Item
                name="name"
                label="计划名称"
                rules={[{ required: true, message: '请输入计划名称' }]}
              >
                <Input placeholder="请输入计划名称" data-testid="crud-modal-name" />
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
              <FillFieldsOnMount form={planForm} row={editing()} />
            </Form>
          </div>
        </Modal>
      </div>
    </DemoSection>
  );
}
