# Layout 布局 · 基础用法（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/layout/demos/basic.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

带侧边栏的三段布局，含可折叠触发器。

## 完整源码

```tsx
import { Content, Footer, Header, Layout, Sider } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description: '带侧边栏的三段布局，含可折叠触发器。',
};

export default function Basic() {
  return (
    <DemoSection title="带侧边栏的三段布局">
      <Layout hasSider class="demo-layout">
        <Sider collapsible width={160} collapsedWidth={64}>
          侧边栏
        </Sider>
        <Layout>
          <Header>页头</Header>
          <Content>内容区</Content>
          <Footer>页脚</Footer>
        </Layout>
      </Layout>
    </DemoSection>
  );
}
```

## 相关页面

- [Layout 布局 API](../exports/layout.md)
- [设计 Token](../design/tokens.md)
