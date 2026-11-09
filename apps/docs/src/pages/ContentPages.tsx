import { A, useParams } from '@solidjs/router';
import { For, Show } from 'solid-js';
import { ApiTable } from '../components/ApiTable';
import { catalog } from '../lib/catalog';

export function GettingStarted() {
  return (
    <article class="docs-page" data-testid="page-getting-started">
      <h1>快速开始</h1>
      <p class="docs-lead">安装、引入样式、配置全局上下文，并在三类构建器中消费组件库。</p>

      <section class="docs-section" id="getting-started">
        <h2>安装</h2>
        <pre class="docs-code-block">
          <code>pnpm add solid-craft solid-craft-tokens solid-craft-icons solid-js</code>
        </pre>
      </section>

      <section class="docs-section">
        <h2>引入样式</h2>
        <p>JS 不隐式引入 CSS，由消费方显式引入全局样式或按组件样式（02 §1 设计原则 3）。</p>
        <pre class="docs-code-block">
          <code>import 'solid-craft/styles.css';</code>
        </pre>
        <p>
          CSS 变量由 <code>solid-craft-tokens</code> 的 DTCG 源生成，全部以 <code>--scui-*</code> 开头。
        </p>
      </section>

      <section class="docs-section">
        <h2>ConfigProvider</h2>
        <p>
          用 <code>ConfigProvider</code> 包裹应用根，注入主题 / 密度 / 方向 / 语言 / z-index 上下文。
          默认 <code>themeTarget='local'</code>；设 <code>global</code> 时把 <code>data-scui-*</code> 写到{' '}
          <code>document.documentElement</code>。
        </p>
        <pre class="docs-code-block">
          <code>{`import { ConfigProvider } from 'solid-craft';

<ConfigProvider theme="light" density="default" direction="ltr" themeTarget="global">
  <App />
</ConfigProvider>`}</code>
        </pre>
        <ApiTable slug="config-provider" />
      </section>

      <section class="docs-section">
        <h2>三端消费与 SSR</h2>
        <p>
          <code>package.json#exports</code> 的 <code>solid</code> 条件指向{' '}
          <code>dist/source/*.jsx</code>（保留 JSX 源码），<code>import</code> 条件指向编译后的{' '}
          <code>dist/esm/*.js</code>。Vite（<code>vite-plugin-solid</code>）、Webpack 5、Rspack
          三个示例在 <code>examples/</code>，SolidStart 2.2.x 的 SSR + hydration 冒烟也在其中。
        </p>
        <p class="docs-muted">
          实测命令：<code>pnpm smoke:consumers</code> / <code>pnpm smoke:ssr</code> /{' '}
          <code>pnpm smoke:start-real</code>，均已并入 <code>pnpm verify</code>。
        </p>
      </section>
    </article>
  );
}

const DESIGN_SECTIONS: Record<string, { title: string; paragraphs: string[] }> = {
  tokens: {
    title: '设计 Token',
    paragraphs: [
      'DTCG 三层结构：primitive（色阶 / 尺度）、semantic（亮 / 暗语义）、component（组件别名）。style-dictionary 5 负责解析与 outputReferences，colorjs.io 负责 OKLCH 色阶与 WCAG21 对比度。',
      '构建期按 03 §3.1 执行 7 档校验：text 4.5 / large-text 3 / auxiliary 3 / control 3 / decorative / disabled / background。语义色漏标 $contrastTier 或对比度不达标都会让 pnpm build 失败。',
      '产物：dist/css/tokens.css、theme-dark.css、dist/ts/tokens.ts、dist/json/tokens.json。组件 SCSS 只引用 var(--scui-*)，不写死色值。',
    ],
  },
  color: {
    title: '色彩',
    paragraphs: [
      '6 个色相（blue / green / amber / red / cyan / neutral）× 10 级 × 亮 / 暗两套，由 colorjs.io 在 OKLCH 空间生成，第 6 级精确等于品牌基准色。',
      '语义色只引用色阶，例如 light 的 --scui-color-primary 指向 --scui-color-palette-blue-6；调整品牌色只需改一处基准值。',
      '当前 light 的 primary / focus-ring 为 #2d66f5（对白底 4.85:1）。曾用的 #2f6bff 实测 4.499:1，差 0.001 未达 WCAG AA，已在构建期校验中固化。',
    ],
  },
  layout: {
    title: '布局与间距',
    paragraphs: [
      '间距以 8px 为基准，space.1~space.8 对应 DTCG 尺度；Grid 采用 24 栅格，断点为 xs / sm / md / lg / xl / xxl。',
      '文档站与组件 Demo 的最大段落宽度为 720px（03 §5），业务页面按自身布局决定。',
      'MVP 视觉回归只覆盖 light / ltr / default 与 1280 / 768 两个 viewport；375px 仅做不溢出冒烟（06 §5.3）。',
    ],
  },
  motion: {
    title: '动效',
    paragraphs: [
      'motion.duration.fast / normal / slow 与 motion.ease 由 primitive 尺度定义，组件 SCSS 统一引用。',
      '截图与浏览器测试固定 reducedMotion=reduce 并关闭全部动画，避免像素漂移；用户侧遵循系统偏好。',
    ],
  },
  dark: {
    title: '暗色主题',
    paragraphs: [
      '暗色由 theme-dark.css 覆盖语义变量，ConfigProvider theme="dark" 写入 data-scui-theme。',
      '当前状态：Token 与构建期对比度校验已覆盖暗色，但端到端视觉回归 / SSR 全矩阵按 06 §5.3、04 §3.2 属于 v1.0，MVP 未验收。文档站切换器标注为预览。',
    ],
  },
  density: {
    title: '密度与方向',
    paragraphs: [
      'ConfigProvider 的 density / direction 写入 data-scui-density 与 data-scui-direction，组件样式按属性选择器响应。',
      'compact 与 rtl 的完整视觉矩阵属于 v1.0；MVP 只验收 default / ltr。',
    ],
  },
};

export function DesignPage() {
  const params = useParams();
  const slug = () => params.slug ?? '';
  const section = () => DESIGN_SECTIONS[slug()];
  const page = () => catalog.designPages.find((item) => item.slug === slug());
  return (
    <Show when={section()} fallback={<p class="docs-muted">未找到设计页：{slug()}</p>}>
      {(content) => (
        <article class="docs-page" data-testid="page-design" data-design={slug()}>
          <h1>{content().title}</h1>
          <p class="docs-lead">{page()?.description}</p>
          <For each={content().paragraphs}>
            {(paragraph) => (
              <p class="docs-paragraph">{paragraph}</p>
            )}
          </For>
          <p>
            <A href="/docs/design/tokens">← 返回设计 Token</A>
          </p>
        </article>
      )}
    </Show>
  );
}

export function Changelog() {
  return (
    <article class="docs-page" data-testid="page-changelog">
      <h1>更新记录</h1>
      <p class="docs-lead">变更以 Changesets 为准；当前工作区版本 v{catalog.version}。</p>
      <section class="docs-section">
        <h2>v{catalog.version}（开发中）</h2>
        <ul>
          <li>脚手架：pnpm workspace + Turborepo + TypeScript 7 + 双构建（esm / source）。</li>
          <li>7 个基础组件 + ConfigProvider，全部状态由 data-* 驱动。</li>
          <li>Token 管线：style-dictionary 5 + colorjs.io，7 档对比度构建期校验。</li>
          <li>测试设施：Vitest / Playwright + axe / 截图基线三条链。</li>
          <li>消费验证：Vite / Webpack 5 / Rspack 三端 + 真实 SolidStart SSR。</li>
          <li>文档站：路由、同源 Demo、源码高亮、API 表、搜索。</li>
        </ul>
      </section>
      <p class="docs-muted">
        发版流程见 <code>docs/06-工程规范.md §9</code>；<code>pnpm changeset</code> → release PR →{' '}
        <code>pnpm release</code>。
      </p>
    </article>
  );
}

export function NotFound() {
  return (
    <article class="docs-page" data-testid="page-not-found">
      <h1>页面不存在</h1>
      <p>
        <A href="/">返回首页</A>
      </p>
    </article>
  );
}
