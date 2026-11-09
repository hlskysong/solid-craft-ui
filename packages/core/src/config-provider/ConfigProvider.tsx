import { createEffect, createMemo, createSignal, onCleanup, onMount, splitProps } from 'solid-js';
import { isServer } from 'solid-js/web';
import { CSS_PREFIX } from '../scope';
import { classNames } from '../utils/class-names';
import { resolveValue } from '../utils/resolve-value';
import { ConfigProviderContext } from './context';
import type { ConfigProviderProps, ThemeName, UIConfig } from './types';

export function ConfigProvider(props: ConfigProviderProps) {
  const [local] = splitProps(props, [
    'locale',
    'theme',
    'density',
    'direction',
    'zIndexBase',
    'portalContainer',
    'themeTarget',
    'class',
    'children',
  ]);

  const locale = createMemo(() => resolveValue(local.locale) ?? 'zh-CN');
  const themeProp = createMemo(() => resolveValue(local.theme) ?? 'light');
  const density = createMemo(() => resolveValue(local.density) ?? 'default');
  const direction = createMemo(() => resolveValue(local.direction) ?? 'ltr');
  const zIndexBase = createMemo(() => resolveValue(local.zIndexBase) ?? 0);
  const themeTarget = createMemo(() => resolveValue(local.themeTarget) ?? 'local');
  const [systemTheme, setSystemTheme] = createSignal<'light' | 'dark'>('light');

  const theme = createMemo<ThemeName>(() => {
    const value = themeProp();
    if (value !== 'system') return value;
    return isServer ? 'light' : systemTheme();
  });

  // portalContainer 的默认值必须懒解析，避免在模块渲染期间访问 document。
  const portalContainer = () => {
    const provided = resolveValue(local.portalContainer);
    if (provided !== undefined) return provided;
    return typeof document === 'undefined' ? undefined : document.body;
  };

  const config: UIConfig = {
    locale: () => locale(),
    theme: () => theme(),
    density: () => density(),
    direction: () => direction(),
    zIndexBase: () => zIndexBase(),
    portalContainer: () => portalContainer(),
  };

  onMount(() => {
    if (themeProp() !== 'system') return;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setSystemTheme(query.matches ? 'dark' : 'light');
    sync();
    query.addEventListener('change', sync);
    onCleanup(() => query.removeEventListener('change', sync));
  });

  onMount(() => {
    if (themeTarget() !== 'global') return;
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const previous = {
      theme: root.getAttribute('data-scui-theme'),
      density: root.getAttribute('data-scui-density'),
      direction: root.getAttribute('data-scui-direction'),
      zIndexBase: root.style.getPropertyValue('--scui-z-index-base'),
      zIndexBasePriority: root.style.getPropertyPriority('--scui-z-index-base'),
    };

    createEffect(() => {
      root.setAttribute('data-scui-theme', theme());
      root.setAttribute('data-scui-density', density());
      root.setAttribute('data-scui-direction', direction());
      root.style.setProperty('--scui-z-index-base', String(zIndexBase()));
    });

    onCleanup(() => {
      if (previous.theme === null) root.removeAttribute('data-scui-theme');
      else root.setAttribute('data-scui-theme', previous.theme);

      if (previous.density === null) root.removeAttribute('data-scui-density');
      else root.setAttribute('data-scui-density', previous.density);

      if (previous.direction === null) root.removeAttribute('data-scui-direction');
      else root.setAttribute('data-scui-direction', previous.direction);

      if (previous.zIndexBase === '') root.style.removeProperty('--scui-z-index-base');
      else
        root.style.setProperty(
          '--scui-z-index-base',
          previous.zIndexBase,
          previous.zIndexBasePriority,
        );
    });
  });

  return (
    <ConfigProviderContext.Provider value={config}>
      {themeTarget() === 'global' ? (
        local.children
      ) : (
        <div
          class={classNames(`${CSS_PREFIX}config-provider`, local.class)}
          data-scui-theme={theme()}
          data-scui-density={density()}
          data-scui-direction={direction()}
          style={{
            display: 'contents',
            '--scui-z-index-base': String(zIndexBase()),
          }}
        >
          {local.children}
        </div>
      )}
    </ConfigProviderContext.Provider>
  );
}
