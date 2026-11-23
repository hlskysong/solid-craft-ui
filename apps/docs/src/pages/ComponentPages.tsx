import { A, useParams } from '@solidjs/router';
import { For, Show } from 'solid-js';
import { ApiTable } from '../components/ApiTable';
import { Demo } from '../components/Demo';
import { CodeIcon, DropletIcon, FileTextIcon, LayersIcon } from '../components/icons';
import { catalog, findComponent, findDemo, standalonePath } from '../lib/catalog';

/** 首页组件分组展示序（与侧栏一致；catalog.category 是唯一数据源）。 */
const HOME_CATEGORIES = ['通用', '布局', '表单', '数据', '反馈'];
const homeGroups = HOME_CATEGORIES.map((category) => ({
  category,
  items: catalog.components.filter((component) => component.category === category),
})).filter((group) => group.items.length > 0);

const componentTotal = catalog.components.filter((component) => component.slug !== 'overview').length;
const demoTotal = catalog.components.reduce((total, component) => total + component.demos.length, 0);

/** 首页卖点（全部对应已验收的工程事实，见 docs/08 锚点）。 */
const FEATURES = [
  {
    icon: CodeIcon,
    title: '同源 Demo',
    description: '页面渲染的 Demo 与展示的源码来自同一个文件，复制即可运行，不会分叉。',
  },
  {
    icon: FileTextIcon,
    title: '生成式 API',
    description: 'oxc-parser 解析 types.ts 与 JSDoc，API 表与 @default 默认值自动生成。',
  },
  {
    icon: DropletIcon,
    title: 'Design Token',
    description: 'DTCG 三层 Token，亮 / 暗语义色，7 档 WCAG 对比度在构建期校验。',
  },
  {
    icon: LayersIcon,
    title: 'SSR 双构建',
    description: 'esm / source 双产物，Vite / Webpack / Rspack 与真实 SolidStart SSR 实测。',
  },
];

export function Home() {
  return (
    <article class="docs-page docs-home" data-testid="page-home">
      <section class="docs-hero">
        <h1>solid-craft-ui 组件文档</h1>
        <p class="docs-hero__lead">
          基于 SolidJS 的企业级组件库。状态由 <code>data-scui-*</code> 驱动，样式由{' '}
          <code>--scui-*</code> Token 提供；Demo 直接来自组件源码，API 表由类型与 JSDoc 生成。
        </p>
        <div class="docs-hero__actions">
          <A class="docs-cta docs-cta--primary" href="/docs/getting-started">
            快速开始
          </A>
          <A class="docs-cta" href="/components/overview">
            组件总览
          </A>
        </div>
        <ul class="docs-hero__stats">
          <li>
            <strong>{componentTotal}</strong>
            <span>组件</span>
          </li>
          <li>
            <strong>{demoTotal}</strong>
            <span>同源 Demo</span>
          </li>
          <li>
            <strong>2000+</strong>
            <span>图标</span>
          </li>
        </ul>
      </section>

      <section class="docs-features" aria-label="特性">
        <For each={FEATURES}>
          {(feature) => (
            <div class="docs-feature">
              <span class="docs-feature__icon">
                <feature.icon />
              </span>
              <strong>{feature.title}</strong>
              <p>{feature.description}</p>
            </div>
          )}
        </For>
      </section>

      <h2>组件</h2>
      <For each={homeGroups}>
        {(group) => (
          <section class="docs-home-group">
            <h3>
              {group.category}
              <span class="docs-nav__count">{group.items.length}</span>
            </h3>
            <div class="docs-cards">
              <For each={group.items}>
                {(component) => (
                  <A class="docs-card" href={`/components/${component.slug}`}>
                    <strong>{component.title}</strong>
                    <span>{component.description}</span>
                  </A>
                )}
              </For>
            </div>
          </section>
        )}
      </For>

      <h2>基础组件总览</h2>
      <Demo slug="overview" name="basic" />
      <p class="docs-muted">
        独立预览：<A href={standalonePath('overview', 'basic')}>打开无 chrome 的截图基线页</A>。
      </p>
    </article>
  );
}

/** 02 §12.1：/components/:slug = Demo + API + 设计指南 + A11y。 */
export function ComponentPage() {
  const params = useParams();
  const slug = () => params.slug ?? '';
  const component = () => findComponent(slug());
  return (
    <Show when={component()} fallback={<p class="docs-muted">未找到组件：{slug()}</p>}>
      {(item) => (
        <article class="docs-page" data-testid="page-component" data-component={slug()}>
          <nav class="docs-breadcrumb" aria-label="面包屑">
            <A href="/">首页</A>
            <span aria-hidden="true">/</span>
            <A href="/components/overview">组件</A>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{item().title}</span>
          </nav>
          <h1>{item().title}</h1>
          <p class="docs-lead">{item().description}</p>
          <Show when={item().exportPath}>
            <p class="docs-import">
              <code>import &#123; ... &#125; from '{item().exportPath}';</code>
            </p>
          </Show>

          <Show when={slug() === 'icon'}>
            <p class="docs-muted" data-testid="icon-xref-gallery">
              组件文档演示图标用法；全部图标见 <A href="/icons">图标列表与搜索</A> 页。
            </p>
          </Show>

          <h2>Demo</h2>
          <p class="docs-muted">共 {item().demos.length} 个 Demo，均可展开源码、复制与打开独立页。</p>
          <For each={item().demos}>
            {(demo) => <Demo slug={item().slug} name={demo.name} />}
          </For>

          <ApiTable slug={item().slug} />

          <section class="docs-section">
            <h2>设计指南</h2>
            <p>
              所有状态使用 <code>data-*</code> 属性驱动，样式由 <code>--scui-*</code> CSS 变量提供；
              Token 分档与对比度校验见 <A href="/docs/design/tokens">设计 Token</A>。
              一个视图内主色按钮建议不超过 1 个（ADR-019）。
            </p>
          </section>
          <section class="docs-section">
            <h2>无障碍</h2>
            <p>
              键盘路径与 axe 扫描在 <code>tests/e2e/specs/browser.spec.ts</code> 中覆盖；WCAG AA
              对比度在 Token 构建期校验（03 §3.1 / §11）。
            </p>
          </section>
        </article>
      )}
    </Show>
  );
}

/** 02 §12.1：/components/:slug/:demo 单 Demo 独立页（截图回归入口）。 */
export function DemoPage() {
  const params = useParams();
  const slug = () => params.slug ?? '';
  const demoName = () => params.demo ?? 'basic';
  const meta = () => findDemo(slug(), demoName());
  return (
    <Show when={meta()} fallback={<p class="docs-muted">未找到 Demo：{slug()}/{demoName()}</p>}>
      {(demo) => (
        <article class="docs-page" data-testid="page-demo" data-demo={demoName()}>
          <p>
            <A href={`/components/${slug()}`}>← 返回 {findComponent(slug())?.title}</A>
          </p>
          <h1>{demo().title}</h1>
          <Demo slug={slug()} name={demoName()} />
          <p class="docs-muted">
            无 chrome 的基线页：<A href={standalonePath(slug(), demoName())}>?standalone=1</A>。
          </p>
        </article>
      )}
    </Show>
  );
}
