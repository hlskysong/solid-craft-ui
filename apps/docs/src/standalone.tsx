import { ConfigProvider } from 'solid-craft';
import { render } from 'solid-js/web';
import { demoComponents, demoKey, findComponent, findDemo } from './lib/catalog';

/**
 * ?standalone=1 的无 chrome Demo 宿主：06 §5.2「Playwright 针对文档站 Demo 页面运行」
 * 与 06 §5.3 截图基线的载体。DOM / CSS 与 T1-05 的临时宿主逐字一致，
 * 因此 16 张 light/ltr/default 基线无需重新生成（由 test:visual 实证）。
 */
export function renderStandalone(root: HTMLElement) {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const slug = parts.length === 3 && parts[0] === 'components' ? parts[1] : 'overview';
  const requestedName = parts.length === 3 ? parts[2] : 'basic';
  const component = findComponent(slug ?? '') ?? findComponent('overview');
  if (!component) throw new Error('[docs] catalog 缺少 overview');

  const demo = findDemo(component.slug, requestedName ?? '') ?? component.demos[0];
  if (!demo) throw new Error(`[docs] ${component.slug} 没有 Demo`);
  const Body = demoComponents.get(demoKey(component.slug, demo.name));
  if (!Body) throw new Error(`[docs] 未加载 Demo 模块 ${demoKey(component.slug, demo.name)}`);

  render(
    () => (
      <ConfigProvider theme="light" density="default" direction="ltr" themeTarget="global">
        <main class="demo-root" data-testid="demo-root" data-demo={component.slug}>
          <h1 class="demo-root__title">{component.title}</h1>
          <p class="demo-root__meta">light / ltr / default · 固定字体 · 关闭动画</p>
          <Body />
        </main>
      </ConfigProvider>
    ),
    root,
  );
}
