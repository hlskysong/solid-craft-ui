# 基础组件总览 · 基础组件总览（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/overview/demos/basic.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

首页聚合预览：Button、Typography、Icon、Space、Divider、Layout、Grid、Input、InputNumber。

## 完整源码

```tsx
import {
  Button,
  Col,
  Content,
  Divider,
  Footer,
  Header,
  Icon,
  Input,
  InputNumber,
  Layout,
  Link,
  Paragraph,
  Row,
  Space,
  Text,
  Textarea,
  Title,
} from 'solid-craft';
import { DemoSection, DotIcon } from '../../demos/shared';

export const demo = {
  title: '基础组件总览',
  description:
    '首页聚合预览：Button、Typography、Icon、Space、Divider、Layout、Grid、Input、InputNumber。',
};

export default function Basic() {
  return (
    <>
      <DemoSection title="Button">
        <Button>默认主色</Button>
        <Button variant="outline" color="danger">
          危险描边
        </Button>
        <Button size="small" loading>
          加载中
        </Button>
      </DemoSection>
      <DemoSection title="Icon / Typography">
        <Icon label="示例">
          <DotIcon />
        </Icon>
        <Title level={3}>三级标题</Title>
        <Text tone="secondary">次要文本</Text>
        <Paragraph>固定段落文本</Paragraph>
        <Link href="#overview-anchor">锚点链接</Link>
      </DemoSection>
      <DemoSection title="Space / Divider">
        <Space>
          <Text>A</Text>
          <Text>B</Text>
          <Text>C</Text>
        </Space>
        <Divider>分区</Divider>
      </DemoSection>
      <DemoSection title="Layout / Grid">
        <Layout>
          <Header>页头</Header>
          <Content>内容区</Content>
          <Footer>页脚</Footer>
        </Layout>
        <Row class="demo-grid-row">
          <Col span={12}>span 12</Col>
          <Col span={12}>span 12</Col>
        </Row>
      </DemoSection>
      <DemoSection title="Input / InputNumber / Textarea">
        <Input defaultValue="带清除" aria-label="总览：可清除输入" allowClear />
        <Input type="password" defaultValue="secret" aria-label="总览：密码" />
        <InputNumber defaultValue={128} step={1} aria-label="总览：数量" />
        <Textarea
          autoSize={{ minRows: 2, maxRows: 4 }}
          showCount
          maxLength={40}
          aria-label="总览：备注"
        />
      </DemoSection>
      <p id="overview-anchor">锚点目标</p>
    </>
  );
}
```

## 相关页面

- [基础组件总览](../exports/root.md)
- [设计 Token](../design/tokens.md)
