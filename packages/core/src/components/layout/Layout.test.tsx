import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Content, Footer, Header, Layout, Sider } from './Layout';

afterEach(cleanup);

describe('Layout', () => {
  it('renders a vertical layout without sider by default', () => {
    const { container } = render(() => (
      <Layout>
        <Header>头部</Header>
        <Content>内容</Content>
        <Footer>底部</Footer>
      </Layout>
    ));

    const root = container.firstElementChild;
    expect(root).not.toBeNull();
    expect(root).toHaveClass('scui-layout');
    expect(root).toHaveAttribute('data-scui-has-sider', 'false');

    expect(screen.getByRole('banner')).toHaveClass('scui-layout__header');
    // Content 是普通容器而不是 <main>：main landmark 由页面提供，
    // 组件里再渲染一个会让「Layout 嵌进已有 main 的页面」直接产生两个 main。
    expect(screen.getByText('内容')).toHaveClass('scui-layout__content');
    expect(screen.getByText('内容')).toHaveAttribute('data-scui-role', 'layout-content');
    expect(screen.queryByRole('main')).toBeNull();
    expect(screen.getByRole('contentinfo')).toHaveClass('scui-layout__footer');
  });

  it('switches to horizontal direction when hasSider is true', () => {
    const { container } = render(() => (
      <Layout hasSider>
        <Sider>导航</Sider>
        <Content>内容</Content>
      </Layout>
    ));

    const root = container.firstElementChild;
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute('data-scui-has-sider', 'true');
  });

  it('uses the default sider width and expanded state', () => {
    render(() => (
      <Layout hasSider>
        <Sider>导航</Sider>
      </Layout>
    ));

    const sider = screen.getByRole('complementary');
    expect(sider).toHaveAttribute('data-scui-collapsed', 'false');
    expect(sider).toHaveAttribute('data-scui-collapsible', 'false');
    expect(sider.getAttribute('style')).toMatch(/--scui-sider-width:\s*200px/);
  });

  it('toggles uncontrolled collapsed state and calls onCollapse through the trigger', () => {
    const onCollapse = vi.fn();

    render(() => (
      <Sider collapsible defaultCollapsed={false} onCollapse={onCollapse}>
        导航
      </Sider>
    ));

    const sider = screen.getByRole('complementary');
    const trigger = screen.getByRole('button', { name: '切换侧边栏' });

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(sider).toHaveAttribute('data-scui-collapsed', 'false');

    fireEvent.click(trigger);

    expect(onCollapse).toHaveBeenCalledWith(true);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(sider).toHaveAttribute('data-scui-collapsed', 'true');
    expect(sider.getAttribute('style')).toMatch(/--scui-sider-width:\s*64px/);
  });

  it('keeps controlled state unchanged and still calls onCollapse', () => {
    const onCollapse = vi.fn();

    render(() => (
      <Sider collapsible collapsed onCollapse={onCollapse}>
        导航
      </Sider>
    ));

    const sider = screen.getByRole('complementary');
    const trigger = screen.getByRole('button', { name: '切换侧边栏' });

    expect(sider).toHaveAttribute('data-scui-collapsed', 'true');

    fireEvent.click(trigger);

    expect(sider).toHaveAttribute('data-scui-collapsed', 'true');
    expect(onCollapse).toHaveBeenCalledWith(false);
  });
});
