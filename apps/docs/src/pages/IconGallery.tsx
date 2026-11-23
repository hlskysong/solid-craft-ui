import { A } from '@solidjs/router';
import { createMemo, createResource, createSignal, For, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { loadIconCatalog, type IconEntry } from '../lib/catalog';

/**
 * T4-18：图标列表与搜索页（参照 TDesign / Ant Design 图标页）。
 * 数据来自 solid-craft-icons 全量清单（2024 实体 / 2317 名字），
 * SVG 由 catalog 的 node 数组静态展开，不 import 2024 个组件以免增大文档站 bundle。
 */
const ALL = 'all';

function IconSvg(props: { icon: IconEntry }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <For each={props.icon.node}>
        {(node) => {
          const tag = typeof node[0] === 'string' ? node[0] : 'path';
          const rawAttrs = node[1];
          const attrs =
            rawAttrs && typeof rawAttrs === 'object'
              ? Object.fromEntries(Object.entries(rawAttrs).filter(([key]) => key !== 'key'))
              : {};
          return <Dynamic component={tag} {...attrs} />;
        }}
      </For>
    </svg>
  );
}

export function IconGallery() {
  const [iconCatalog] = createResource(loadIconCatalog);
  const [query, setQuery] = createSignal('');
  const [category, setCategory] = createSignal(ALL);
  const [copied, setCopied] = createSignal('');

  const filtered = createMemo(() => {
    const catalog = iconCatalog();
    if (!catalog) return [];
    const q = query()
      .trim()
      .toLowerCase()
      .replace(/solid-craft-icons/g, '');
    const cat = category();
    return catalog.icons.filter((icon) => {
      if (cat !== ALL && icon.category !== cat) return false;
      if (!q) return true;
      const haystack = [icon.name, icon.exportName, ...icon.aliases].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  });

  const copyImport = async (icon: IconEntry) => {
    const text = `import { ${icon.exportName} } from 'solid-craft-icons';`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(icon.name);
      window.setTimeout(() => setCopied(''), 1600);
    } catch {
      setCopied('');
    }
  };

  return (
    <article class="docs-page docs-icons" data-testid="page-icons">
      <h1>图标 Icon</h1>
      <p class="docs-lead">
        solid-craft-icons 全量图标：{iconCatalog()?.total ?? '…'} 个实体，覆盖 lucide 全部{' '}
        {iconCatalog()?.nameTotal ?? '…'} 个名字。点击任意图标复制导入语句。
      </p>
      <p class="docs-muted" data-testid="icon-xref-component">
        图标组件的用法、属性与主题示例见 <A href="/components/icon">Icon 图标组件文档</A>。
      </p>

      <div class="docs-icons-toolbar">
        <input
          class="docs-icons-search"
          type="search"
          placeholder="搜索图标名称、别名或组件名"
          aria-label="搜索图标"
          data-testid="icon-search"
          value={query()}
          onInput={(event) => setQuery(event.currentTarget.value)}
        />
        <span class="docs-icons-count" data-testid="icon-count">
          {filtered().length} 个图标
        </span>
      </div>

      <div class="docs-icons-cats" role="tablist" aria-label="图标分类">
        <For each={iconCatalog()?.categories ?? []}>
          {(cat) => (
            <button
              type="button"
              role="tab"
              class="docs-icons-cat"
              data-active={category() === cat.id}
              aria-selected={category() === cat.id}
              data-testid={`icon-cat-${cat.id}`}
              onClick={() => setCategory(cat.id)}
            >
              {cat.label}
            </button>
          )}
        </For>
      </div>

      <Show when={filtered().length > 0} fallback={<p class="docs-muted">没有匹配的图标，换个关键词试试。</p>}>
        <div class="docs-icons-grid" data-testid="icon-grid">
          <For each={filtered()}>
            {(icon) => (
              <button
                type="button"
                class="docs-icons-item"
                data-copied={copied() === icon.name ? '1' : '0'}
                data-testid={`icon-item-${icon.name}`}
                title={`${icon.exportName} · 点击复制导入语句`}
                onClick={() => void copyImport(icon)}
              >
                <span class="docs-icons-glyph">
                  <IconSvg icon={icon} />
                </span>
                <span class="docs-icons-name">{icon.name}</span>
              </button>
            )}
          </For>
        </div>
      </Show>
    </article>
  );
}
