import { A } from '@solidjs/router';
import { ConfigProvider } from 'solid-craft';
import { For } from 'solid-js';
import type { JSX } from 'solid-js';
import { catalog } from '../lib/catalog';
import {
  isDensitySetting,
  isDirectionSetting,
  isThemeSetting,
  SettingsProvider,
  useSettings,
} from '../lib/settings';
import { Search } from './Search';

/** Router 的 root 布局：顶栏 + 侧栏 + 内容区，并提供全局主题 / 密度 / 方向切换。 */
export function Shell(props: { children?: JSX.Element }) {
  return (
    <SettingsProvider>
      <ShellBody>{props.children}</ShellBody>
    </SettingsProvider>
  );
}

function ShellBody(props: { children?: JSX.Element }) {
  const settings = useSettings();
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
          <A class="docs-brand" href="/">
            solid-craft-ui
          </A>
          <span class="docs-version" data-testid="docs-version">
            v{catalog.version}
          </span>
          <span class="docs-version-note">按 release tag 构建，历史版本待发布</span>
          <Search />
          <div class="docs-settings">
            <label>
              主题
              <select
                data-testid="setting-theme"
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
            <label>
              密度
              <select
                data-testid="setting-density"
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
            <label>
              方向
              <select
                data-testid="setting-direction"
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
          </div>
          <p class="docs-settings__note">
            ⚠️ 切换真实写入 <code>data-scui-*</code>，但 dark / compact / rtl 的完整视觉回归按 06 §5.3 属 v1.0，MVP 只验收 light / default / ltr。
          </p>
        </header>

        <div class="docs-body">
          <nav class="docs-sider" aria-label="文档导航">
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
            <p class="docs-nav__group">组件</p>
            <For each={catalog.components}>
              {(component) => (
                <A class="docs-nav__link" href={`/components/${component.slug}`} activeClass="is-active">
                  {component.title}
                </A>
              )}
            </For>
            <p class="docs-nav__group">其他</p>
            <A class="docs-nav__link" href="/changelog" activeClass="is-active">
              更新记录
            </A>
          </nav>

          <main class="docs-main" id="main-content">
            {props.children}
          </main>
        </div>
      </div>
    </ConfigProvider>
  );
}
