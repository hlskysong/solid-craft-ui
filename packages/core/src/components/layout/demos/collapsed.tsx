import { createSignal } from 'solid-js';
import { Button, Content, Header, Layout, Sider } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '受控折叠',
  description: 'collapsed 由外部状态驱动，触发器在页头而不是侧边栏。',
};

export default function Collapsed() {
  const [collapsed, setCollapsed] = createSignal(false);

  return (
    <DemoSection title="外部按钮控制折叠">
      <div class="demo-stack">
        <div class="demo-inline">
          <Button
            variant="outline"
            onClick={() => setCollapsed((value) => !value)}
            data-testid="sider-toggle"
          >
            {collapsed() ? '展开侧边栏' : '折叠侧边栏'}
          </Button>
          <output data-testid="sider-state">{collapsed() ? 'collapsed' : 'expanded'}</output>
        </div>
        <Layout hasSider class="demo-layout">
          <Sider collapsed={collapsed()} width={160} collapsedWidth={64}>
            {collapsed() ? '菜单' : '计划菜单'}
          </Sider>
          <Layout>
            <Header>设备维检计划</Header>
            <Content>内容区随侧边栏宽度变化重新排布。</Content>
          </Layout>
        </Layout>
      </div>
    </DemoSection>
  );
}
