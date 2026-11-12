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
    // 不用 <main>：`main` 是「文档唯一主内容区」的 landmark，只能由**页面**提供。
    // 组件级 Layout 一旦渲染 <main>，任何已经带 main 的页面（文档站的 Demo 宿主、
    // 业务壳布局）嵌进来就变成 two mains —— axe 同时判
    // landmark-no-duplicate-main / landmark-main-is-top-level / landmark-unique。
    // T2-13 把 axe 扫描面扩到全部 Demo 时才暴露（此前只扫 basic 页，layout basic
    // 恰好也在扫，但当时判据只看 serious/critical，moderate 被略过）。
    <div
      {...rest}
      class={classNames(`${CSS_PREFIX}layout__content`, local.class)}
      data-scui-role="layout-content"
    >
      {local.children}
    </div>
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
