# Layout 布局 · 上下布局（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/layout/demos/top.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

不带侧边栏的页头 / 内容 / 页脚三段结构。

## 完整源码

```tsx
import { Content, Footer, Header, Layout } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '上下布局',
  description: '不带侧边栏的页头 / 内容 / 页脚三段结构。',
};

export default function Top() {
  return (
    <DemoSection title="页头 + 内容 + 页脚">
      <Layout class="demo-layout">
        <Header>设备维检计划</Header>
        <Content>内容区：按季度汇总各矿上报的设备需求。</Content>
        <Footer>页脚 · 冀中能源</Footer>
      </Layout>
    </DemoSection>
  );
}
```

## 相关页面

- [Layout 布局 API](../exports/layout.md)
- [设计 Token](../design/tokens.md)
