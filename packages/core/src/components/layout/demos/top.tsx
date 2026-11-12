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
