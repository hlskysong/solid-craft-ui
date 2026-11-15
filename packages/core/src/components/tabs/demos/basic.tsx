import { createSignal } from 'solid-js';
import { Tabs } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '基础用法与键盘导航',
  description:
    'tablist / tab / tabpanel 与方向键、Home / End、roving tabindex 都由 Kobalte 原语输出；组件只把激活态落成 data-scui-current。禁用项不可聚焦。',
};

const items = [
  {
    key: 'plan',
    label: '计划概览',
    content: () => (
      <div data-testid="tabs-panel-plan">年度维简设备采购计划共 12 条，已提交 8 条。</div>
    ),
  },
  {
    key: 'detail',
    label: '明细清单',
    content: () => (
      <div data-testid="tabs-panel-detail">主通风机 2 台、皮带输送机 1 套、供电柜 4 面。</div>
    ),
  },
  {
    key: 'audit',
    label: '审批记录',
    content: () => <div data-testid="tabs-panel-audit">2026-11-12 由技术负责人复核通过。</div>,
  },
  {
    key: 'archive',
    label: '归档资料',
    disabled: true,
    content: () => <div data-testid="tabs-panel-archive">归档资料尚未开放。</div>,
  },
];

export default function TabsBasicDemo() {
  const [active, setActive] = createSignal('plan');
  const [controlledLog, setControlledLog] = createSignal('尚未点击');

  return (
    <DemoSection title="基础用法">
      <div class="demo-column">
        <Tabs
          items={items}
          defaultValue="plan"
          onChange={setActive}
          aria-label="采购计划分区"
          data-testid="tabs-basic-root"
        />
        <p data-testid="tabs-active-log">当前标签：{active()}</p>
        <p>把焦点移到第一个标签，用左右方向键与 Home / End 切换，观察上方文案。</p>
        <h3>受控 value 锁定在「计划概览」</h3>
        <Tabs
          items={items}
          value="plan"
          onChange={(key) => setControlledLog(`收到 ${key}，DOM 不回弹`)}
          aria-label="锁定标签页"
          data-testid="tabs-locked"
        />
        <p data-testid="tabs-controlled-log">{controlledLog()}</p>
      </div>
    </DemoSection>
  );
}
