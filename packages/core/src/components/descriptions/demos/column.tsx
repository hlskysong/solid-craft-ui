import { createSignal } from 'solid-js';
import { Button, Descriptions, type DescriptionsColumn } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '列数与跨列',
  description:
    'column=1 / 2 / 3 三档由 data-scui-column 派生 grid 列数；窄屏强制单列且把 span 收回 1，避免隐式列导致横向溢出。',
};

const items = [
  { key: 'a', label: '项目编号', children: 'WJ-2026-012' },
  { key: 'b', label: '申报单位', children: '机电运输部' },
  { key: 'c', label: '资金来源', children: '维简费' },
  { key: 'd', label: '本次采购金额', children: '148 万元' },
  { key: 'e', label: '经办人', children: '宋桂明' },
  { key: 'f', label: '当前状态', children: '审批中' },
];

export default function DescriptionsColumnDemo() {
  const [column, setColumn] = createSignal<DescriptionsColumn>(2);

  return (
    <DemoSection title="列数">
      <div class="demo-column">
        <div class="demo-row">
          <Button variant="outline" size="small" onClick={() => setColumn(1)}>
            一列
          </Button>
          <Button variant="outline" size="small" onClick={() => setColumn(2)}>
            两列
          </Button>
          <Button variant="outline" size="small" onClick={() => setColumn(3)}>
            三列
          </Button>
        </div>
        <p data-testid="descriptions-column-log">当前列数：{column()}</p>
        <Descriptions
          items={items}
          column={column()}
          title="可切换列数"
          data-testid="descriptions-column-target"
        />
        <Descriptions items={items} column={1} title="单列详情" />
        <Descriptions items={items} column={3} title="三列详情" />
      </div>
    </DemoSection>
  );
}
