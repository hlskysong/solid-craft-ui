# Tabs 标签页 · 懒加载开关（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/tabs/demos/lazy.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

lazy 默认 true：未激活 panel 的 content 工厂一次都不调用，切换才创建。lazy=false 时所有 panel 首帧挂载，非激活的用原生 hidden 收起，不重复创建。

## 完整源码

```tsx
import { Tabs } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '懒加载开关',
  description:
    'lazy 默认 true：未激活 panel 的 content 工厂一次都不调用，切换才创建。lazy=false 时所有 panel 首帧挂载，非激活的用原生 hidden 收起，不重复创建。',
};

const makeItems = (mode: string) => [
  {
    key: 'first',
    label: '第一页',
    content: () => <div data-testid={`tabs-lazy-${mode}-first`}>第一页内容：概览数据。</div>,
  },
  {
    key: 'second',
    label: '第二页',
    content: () => <div data-testid={`tabs-lazy-${mode}-second`}>第二页内容：明细表格。</div>,
  },
  {
    key: 'third',
    label: '第三页',
    content: () => <div data-testid={`tabs-lazy-${mode}-third`}>第三页内容：审批意见。</div>,
  },
];

export default function TabsLazyDemo() {
  return (
    <DemoSection title="懒加载">
      <div class="demo-column">
        <h3>默认 lazy=true（只挂载激活 panel）</h3>
        <Tabs items={makeItems('lazy')} aria-label="懒加载标签页" data-testid="tabs-lazy-on" />
        <h3>lazy=false（全部挂载，非激活 hidden）</h3>
        <Tabs
          items={makeItems('eager')}
          lazy={false}
          aria-label="全量挂载标签页"
          data-testid="tabs-lazy-off"
        />
      </div>
    </DemoSection>
  );
}
```

## 相关页面

- [Tabs 标签页 API](../exports/tabs.md)
- [设计 Token](../design/tokens.md)
