import { ConfigProvider } from 'solid-craft';
import { render } from 'solid-js/web';
import { demoComponents, demoKey, findComponent, findDemo } from './lib/catalog';

/**
 * ?standalone=1 的无 chrome Demo 宿主：06 §5.2「Playwright 针对文档站 Demo 页面运行」
 * 与 06 §5.3 截图基线的载体。DOM / CSS 与 T1-05 的临时宿主逐字一致，
 * 因此 16 张 light/ltr/default 基线无需重新生成（由 test:visual 实证）。
 *
 * 宿主根节点就是页面的 `<main>`：Demo 片段本身不再提供 main（`Layout` 的
 * `Content` 在 T2-13 已从 `<main>` 改成普通容器），因此这里恒有且只有一个 main
 * landmark —— 内容全部落在 landmark 内，`landmark-one-main` / `region` 两条
 * 文档级规则同时满足（53 个 Demo 页 axe 全 0 violation）。
 */
export function renderStandalone(root: HTMLElement) {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const slug = parts.length === 3 && parts[0] === 'components' ? parts[1] : 'overview';
  const requestedName = parts.length === 3 ? parts[2] : 'basic';
  const component = findComponent(slug ?? '') ?? findComponent('overview');
  if (!component) throw new Error('[docs] catalog 缺少 overview');

  // 找不到指定 Demo 时回落到首 Demo 只是「用户体验兜底」，不能让 E2E 也一起被兜住：
  // 截图用例同时断言 `data-demo-name`，Demo 名写错 / 改名未同步时立刻红灯，
  // 而不是悄悄截了一张 basic 的图还判为通过（T2-13 扩面的关键守卫）。
  const demo = findDemo(component.slug, requestedName ?? '') ?? component.demos[0];
  if (!demo) throw new Error(`[docs] ${component.slug} 没有 Demo`);
  const Body = demoComponents.get(demoKey(component.slug, demo.name));
  if (!Body) throw new Error(`[docs] 未加载 Demo 模块 ${demoKey(component.slug, demo.name)}`);

  render(
    () => (
      <ConfigProvider theme="light" density="default" direction="ltr" themeTarget="global">
        <main
          class="demo-root"
          data-testid="demo-root"
          data-demo={component.slug}
          data-demo-name={demo.name}
        >
          <h1 class="demo-root__title">{component.title}</h1>
          <p class="demo-root__meta">light / ltr / default · 固定字体 · 关闭动画</p>
          <Body />
        </main>
      </ConfigProvider>
    ),
    root,
  );
}
