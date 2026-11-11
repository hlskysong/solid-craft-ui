import { createSignal, Show, splitProps } from 'solid-js';
import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import { resolveValue } from '../../utils/resolve-value';
import type { ContentProps, FooterProps, HeaderProps, LayoutProps, SiderProps } from './types';

export function Layout(props: LayoutProps) {
  const [local, rest] = splitProps(props, ['hasSider', 'class', 'children']);

  return (
    <div
      {...rest}
      class={classNames(`${CSS_PREFIX}layout`, local.class)}
      data-scui-has-sider={local.hasSider ? 'true' : 'false'}
    >
      {local.children}
    </div>
  );
}

export function Header(props: HeaderProps) {
  const [local, rest] = splitProps(props, ['class', 'children']);

  return (
    <header {...rest} class={classNames(`${CSS_PREFIX}layout__header`, local.class)}>
      {local.children}
    </header>
  );
}

export function Content(props: ContentProps) {
  const [local, rest] = splitProps(props, ['class', 'children']);

  return (
    <main {...rest} class={classNames(`${CSS_PREFIX}layout__content`, local.class)}>
      {local.children}
    </main>
  );
}

export function Footer(props: FooterProps) {
  const [local, rest] = splitProps(props, ['class', 'children']);

  return (
    <footer {...rest} class={classNames(`${CSS_PREFIX}layout__footer`, local.class)}>
      {local.children}
    </footer>
  );
}

export function Sider(props: SiderProps) {
  const [local, rest] = splitProps(props, [
    'collapsed',
    'defaultCollapsed',
    'collapsible',
    'width',
    'collapsedWidth',
    'onCollapse',
    'trigger',
    'class',
    'children',
  ]);

  const [innerCollapsed, setInnerCollapsed] = createSignal(local.defaultCollapsed ?? false);

  const isControlled = () => local.collapsed !== undefined;
  const collapsed = () => {
    const value = local.collapsed;
    return value !== undefined ? resolveValue(value) : innerCollapsed();
  };
  const siderWidth = () => (collapsed() ? (local.collapsedWidth ?? 64) : (local.width ?? 200));

  return (
    <aside
      {...rest}
      class={classNames(`${CSS_PREFIX}layout__sider`, local.class)}
      data-scui-collapsed={collapsed() ? 'true' : 'false'}
      data-scui-collapsible={local.collapsible ? 'true' : 'false'}
      style={{ '--scui-sider-width': `${siderWidth()}px` }}
    >
      {local.children}
      <Show when={local.collapsible}>
        <button
          type="button"
          class={`${CSS_PREFIX}layout__trigger`}
          aria-expanded={!collapsed()}
          aria-label="切换侧边栏"
          onClick={() => {
            const next = !collapsed();
            if (!isControlled()) setInnerCollapsed(next);
            local.onCollapse?.(next);
          }}
        >
          <Show when={local.trigger} fallback={collapsed() ? '»' : '«'}>
            {local.trigger}
          </Show>
        </button>
      </Show>
    </aside>
  );
}
