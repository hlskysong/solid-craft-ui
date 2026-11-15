import { createSignal } from 'solid-js';
import { Button, Tabs, type TabsVariant } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '线型与卡片',
  description:
    '两档样式都由 data-scui-variant 表达（AGENTS 硬约束 3 把「变体」指派给该属性），激活态复用 data-scui-current。切换按钮验证属性与样式同步生效。',
};

const items = [
  { key: 'one', label: '基本信息', content: () => <div>项目编号：WJ-2026-012</div> },
  { key: 'two', label: '资金计划', content: () => <div>本次采购金额：148 万元</div> },
  { key: 'three', label: '附件', content: () => <div>共 3 份附件，待补充签字页。</div> },
];

export default function TabsVariantDemo() {
  const [variant, setVariant] = createSignal<TabsVariant>('line');

  return (
    <DemoSection title="线型 / 卡片">
      <div class="demo-column">
        <Button
          variant="outline"
          size="small"
          onClick={() => setVariant(variant() === 'line' ? 'card' : 'line')}
        >
          切换样式
        </Button>
        <p data-testid="tabs-variant-log">当前样式：{variant() === 'line' ? '线型' : '卡片'}</p>
        <Tabs items={items} variant="line" aria-label="线型标签页" data-testid="tabs-line" />
        <Tabs items={items} variant="card" aria-label="卡片标签页" data-testid="tabs-card" />
        <Tabs items={items} variant={variant()} aria-label="可切换标签页" />
      </div>
    </DemoSection>
  );
}
