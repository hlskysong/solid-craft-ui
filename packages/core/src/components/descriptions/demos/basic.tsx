import { Button, Descriptions } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '详情页键值展示',
  description:
    '用原生 dl / dt / dd 承载字段名与值，标题与操作区按内容缺席；备注用 span=2 跨满一行。列数与跨列都恒输出 data-scui-*，SSR 与首帧一致。',
};

const items = [
  { key: 'no', label: '项目编号', children: 'WJ-2026-012' },
  { key: 'name', label: '项目名称', children: '主通风机更新改造' },
  { key: 'dept', label: '申报单位', children: '机电运输部' },
  { key: 'amount', label: '本次采购金额', children: '148 万元' },
  { key: 'date', label: '计划完成时间', children: '2026-12-31' },
  { key: 'status', label: '当前状态', children: '审批中' },
  {
    key: 'note',
    label: '备注',
    children: '含设备安装、调试与一年质保；到货后由使用单位组织验收。',
    span: 2 as const,
  },
];

export default function DescriptionsBasicDemo() {
  return (
    <DemoSection title="基础用法">
      <div class="demo-column">
        <Descriptions
          items={items}
          title="维简设备采购计划详情"
          extra={
            <Button variant="outline" size="small">
              编辑
            </Button>
          }
          data-testid="descriptions-basic"
        />
      </div>
    </DemoSection>
  );
}
