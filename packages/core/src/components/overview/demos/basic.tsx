import {
  Button,
  Col,
  Content,
  Divider,
  Footer,
  Header,
  Icon,
  Input,
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
  description: '首页聚合预览：Button、Typography、Icon、Space、Divider、Layout、Grid、Input。',
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
      <DemoSection title="Input / Textarea">
        <Input defaultValue="带清除" aria-label="总览：可清除输入" allowClear />
        <Input type="password" defaultValue="secret" aria-label="总览：密码" />
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
