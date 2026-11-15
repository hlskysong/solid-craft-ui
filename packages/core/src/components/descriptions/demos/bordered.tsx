import { createSignal } from 'solid-js';
import { Button, Descriptions } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '边框与表头',
  description:
    'bordered 复用 Table / Tag 已登记的 data-scui-bordered（存在即真）；标题与操作区都为 undefined 时表头整块缺席，不留空盒子。',
};

const items = [
  { key: 'no', label: '项目编号', children: 'WJ-2026-012' },
  { key: 'name', label: '项目名称', children: '皮带输送机更新' },
  { key: 'amount', label: '本次采购金额', children: '86 万元' },
  { key: 'date', label: '计划完成时间', children: '2026-12-31' },
];

export default function DescriptionsBorderedDemo() {
  const [bordered, setBordered] = createSignal(true);

  return (
    <DemoSection title="边框">
      <div class="demo-column">
        <Button variant="outline" size="small" onClick={() => setBordered(!bordered())}>
          切换边框
        </Button>
        <p data-testid="descriptions-bordered-log">当前状态：{bordered() ? '有边框' : '无边框'}</p>
        <Descriptions
          items={items}
          bordered={bordered()}
          title="带边框详情"
          data-testid="descriptions-bordered-target"
        />
        <Descriptions items={items} title="无表头操作区" />
        <Descriptions items={items} bordered />
      </div>
    </DemoSection>
  );
}
