import { A, useParams } from '@solidjs/router';
import { For, Show } from 'solid-js';
import { ApiTable } from '../components/ApiTable';
import { Demo } from '../components/Demo';
import { catalog, findComponent, findDemo, standalonePath } from '../lib/catalog';

export function Home() {
  return (
    <article class="docs-page" data-testid="page-home">
      <h1>solid-craft-ui 组件文档</h1>
      <p class="docs-lead">
        SolidJS 组件库文档站。Demo 直接来自组件源码，页面展示的源码与实际渲染的模块是同一个文件；
        API 表由 <code>oxc-parser</code> 解析 <code>types.ts</code> + JSDoc 生成。
      </p>
      <section class="docs-cards">
        <For each={catalog.components.filter((component) => component.slug !== 'overview')}>
          {(component) => (
            <A class="docs-card" href={`/components/${component.slug}`}>
              <strong>{component.title}</strong>
              <span>{component.description}</span>
            </A>
          )}
        </For>
      </section>
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
          <h1>{item().title}</h1>
          <p class="docs-lead">{item().description}</p>
          <Show when={item().exportPath}>
            <p class="docs-import">
              <code>import &#123; ... &#125; from '{item().exportPath}';</code>
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
              键盘路径与 axe 扫描在 <code>tests/e2e/specs/browser.spec.ts</code> 中覆盖；
              WCAG AA 对比度在 Token 构建期校验（03 §3.1 / §11）。
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
