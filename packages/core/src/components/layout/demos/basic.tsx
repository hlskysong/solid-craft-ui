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
