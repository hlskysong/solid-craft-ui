import { A, useLocation } from '@solidjs/router';
import { ConfigProvider } from 'solid-craft';
import { createEffect, createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import type { JSX } from 'solid-js';
import workspacePkg from '../../../../package.json';
import { catalog } from '../lib/catalog';
import {
  isDensitySetting,
  isDirectionSetting,
  isThemeSetting,
  SettingsProvider,
  useSettings,
} from '../lib/settings';
import { ChevronIcon, CloseIcon, GitHubIcon, InfoIcon, MenuIcon } from './icons';
import { Search } from './Search';

/**
 * 组件分组展示序（catalog.category 是唯一数据源，这里只定顺序）。
 * 「总览」组件挂在首页入口，不进分组。
 */
const COMPONENT_CATEGORIES = ['通用', '布局', '表单', '数据', '反馈'];
const componentGroups = COMPONENT_CATEGORIES.map((category) => ({
  category,
  items: catalog.components.filter((component) => component.category === category),
})).filter((group) => group.items.length > 0);

const isComponentPath = (pathname: string, slug: string) =>
  pathname === `/components/${slug}` || pathname.startsWith(`/components/${slug}/`);

/**
 * Router 的 root 布局（仿 antd / TDesign 文档站）：
 * 顶栏固定高度不滚动；侧栏与内容区在 100dvh 壳内各自独立滚动，互不影响。
 * 全局主题 / 密度 / 方向切换真实写入 ConfigProvider（themeTarget=global）。
 */
export function Shell(props: { children?: JSX.Element }) {
  return (
    <SettingsProvider>
      <ShellBody>{props.children}</ShellBody>
    </SettingsProvider>
  );
}

function ShellBody(props: { children?: JSX.Element }) {
  const settings = useSettings();
  const location = useLocation();
  const [navOpen, setNavOpen] = createSignal(false);
  const [collapsed, setCollapsed] = createSignal<Record<string, boolean>>({});
  let siderRef: HTMLElement | undefined;
  let mainRef: HTMLElement | undefined;

  /** 分组默认展开；折叠后若当前路由落在该组内，强制展开保证 active 项可见。 */
  const groupOpen = (group: (typeof componentGroups)[number]) =>
    !collapsed()[group.category] ||
    group.items.some((component) => isComponentPath(location.pathname, component.slug));

  const toggleGroup = (category: string) =>
    setCollapsed((prev) => ({ ...prev, [category]: !prev[category] }));

  const sectionActive = (prefix: string) => location.pathname.startsWith(prefix);

  // 路由变化：收起移动抽屉；内容区回顶（带 hash 时滚到锚点）；侧栏 active 项滚入视野。
  createEffect(() => {
    const pathname = location.pathname;
    const hash = location.hash;
    setNavOpen(false);
    queueMicrotask(() => {
      if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
      else if (pathname) mainRef?.scrollTo({ top: 0 });
      siderRef?.querySelector('.docs-nav__link.is-active')?.scrollIntoView({ block: 'nearest' });
    });
  });

  // 方向设置同步到文档 dir：chrome 全部用逻辑属性，随 dir 真实镜像。
  // （ConfigProvider 只写 data-scui-direction 契约属性，文档 dir 由宿主负责。）
  createEffect(() => {
    document.documentElement.dir = settings.direction();
    onCleanup(() => {
      document.documentElement.dir = 'ltr';
    });
  });

  onMount(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavOpen(false);
    };
    document.addEventListener('keydown', onKeydown);
    onCleanup(() => document.removeEventListener('keydown', onKeydown));
  });

  return (
    <ConfigProvider
      theme={settings.theme()}
      density={settings.density()}
      direction={settings.direction()}
      themeTarget="global"
    >
      <div class="docs-app" data-testid="docs-app">
        <a class="docs-skip" href="#main-content">
          跳到主要内容
        </a>
        <header class="docs-header">
          <button
            type="button"
            class="docs-menu-btn"
            aria-expanded={navOpen()}
            aria-controls="docs-sider"
            aria-label={navOpen() ? '关闭导航' : '打开导航'}
            onClick={() => setNavOpen((value) => !value)}
          >
            <Show when={navOpen()} fallback={<MenuIcon />}>
              <CloseIcon />
            </Show>
          </button>
          <A class="docs-brand" href="/">
            <img
              class="docs-brand__logo"
              src={`${import.meta.env.BASE_URL}favicon.svg`}
              alt=""
              width="26"
              height="26"
            />
            <span class="docs-brand__name">solid-craft-ui</span>
          </A>
          <span
            class="docs-version"
            data-testid="docs-version"
            title="按 release tag 构建，历史版本待发布"
          >
            v{catalog.version}
          </span>
          <nav class="docs-topnav" aria-label="站点导航">
            <A
              class="docs-topnav__link"
              classList={{ 'is-active': sectionActive('/docs/getting-started') }}
              href="/docs/getting-started"
            >
              指南
            </A>
            <A
              class="docs-topnav__link"
              classList={{ 'is-active': sectionActive('/components') }}
              href="/components/overview"
            >
              组件
            </A>
            <A
              class="docs-topnav__link"
              classList={{ 'is-active': sectionActive('/docs/design') }}
              href="/docs/design/tokens"
            >
              设计
            </A>
            <A
              class="docs-topnav__link"
              classList={{ 'is-active': sectionActive('/icons') }}
              href="/icons"
            >
              图标
            </A>
            <A
              class="docs-topnav__link"
              classList={{ 'is-active': sectionActive('/changelog') }}
              href="/changelog"
            >
              更新记录
            </A>
          </nav>
          <Search />
          <div class="docs-settings">
            <label class="docs-settings__item">
              <span class="docs-settings__label">主题</span>
              <select
                data-testid="setting-theme"
                aria-label="主题"
                value={settings.theme()}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  if (isThemeSetting(value)) settings.setTheme(value);
                }}
              >
                <option value="light">light</option>
                <option value="dark">dark</option>
              </select>
            </label>
            <label class="docs-settings__item docs-settings__item--density">
              <span class="docs-settings__label">密度</span>
              <select
                data-testid="setting-density"
                aria-label="密度"
                value={settings.density()}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  if (isDensitySetting(value)) settings.setDensity(value);
                }}
              >
                <option value="default">default</option>
                <option value="compact">compact</option>
              </select>
            </label>
            <label class="docs-settings__item docs-settings__item--direction">
              <span class="docs-settings__label">方向</span>
              <select
                data-testid="setting-direction"
                aria-label="方向"
                value={settings.direction()}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  if (isDirectionSetting(value)) settings.setDirection(value);
                }}
              >
                <option value="ltr">ltr</option>
                <option value="rtl">rtl</option>
              </select>
            </label>
            <details class="docs-help">
              <summary class="docs-help__toggle" aria-label="显示设置说明" title="显示设置说明">
                <InfoIcon />
              </summary>
              <div class="docs-help__panel">
                <p>版本按 release tag 构建，历史版本待发布。</p>
                <p>
                  ⚠️ 切换真实写入 <code>data-scui-*</code>，但 dark / compact / rtl 的完整视觉回归按
                  06 §5.3 属 v1.0，MVP 只验收 light / default / ltr。
                </p>
              </div>
            </details>
          </div>
          <a
            class="docs-github"
            href={workspacePkg.homepage}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub 仓库"
            title="GitHub 仓库"
          >
            <GitHubIcon />
          </a>
        </header>

        <div class="docs-body">
          <nav
            class="docs-sider"
            id="docs-sider"
            aria-label="文档导航"
            data-open={navOpen() ? 'true' : 'false'}
            ref={(element) => {
              siderRef = element;
            }}
          >
            <p class="docs-nav__group">总览</p>
            <A class="docs-nav__link" href="/" end activeClass="is-active">
              首页
            </A>
            <p class="docs-nav__group">指南</p>
            <For each={catalog.guidePages}>
              {(page) => (
                <A class="docs-nav__link" href={`/docs/getting-started#${page.slug}`} activeClass="is-active">
                  {page.title}
                </A>
              )}
            </For>
            <p class="docs-nav__group">设计</p>
            <For each={catalog.designPages}>
              {(page) => (
                <A class="docs-nav__link" href={`/docs/design/${page.slug}`} activeClass="is-active">
                  {page.title}
                </A>
              )}
            </For>
            <For each={componentGroups}>
              {(group) => (
                <div class="docs-nav__section">
                  <button
                    type="button"
                    class="docs-nav__toggle"
                    aria-expanded={groupOpen(group)}
                    onClick={() => toggleGroup(group.category)}
                  >
                    <ChevronIcon class="docs-nav__chevron" />
                    {group.category}
                    <span class="docs-nav__count">{group.items.length}</span>
                  </button>
                  <Show when={groupOpen(group)}>
                    <For each={group.items}>
                      {(component) => (
                        <A
                          class="docs-nav__link"
                          href={`/components/${component.slug}`}
                          activeClass="is-active"
                        >
                          {component.title}
                        </A>
                      )}
                    </For>
                  </Show>
                </div>
              )}
            </For>
            <p class="docs-nav__group">其他</p>
            <A class="docs-nav__link" href="/icons" activeClass="is-active">
              图标
            </A>
            <A class="docs-nav__link" href="/changelog" activeClass="is-active">
              更新记录
            </A>
            <A class="docs-nav__link" href="/llms" activeClass="is-active">
              llms.txt
            </A>
          </nav>
          <Show when={navOpen()}>
            <button
              type="button"
              class="docs-nav-backdrop"
              aria-label="关闭导航"
              tabIndex={-1}
              onClick={() => setNavOpen(false)}
            />
          </Show>

          <main
            class="docs-main"
            id="main-content"
            ref={(element) => {
              mainRef = element;
            }}
            tabindex={0}
          >
            {props.children}
          </main>
        </div>
      </div>
    </ConfigProvider>
  );
}
