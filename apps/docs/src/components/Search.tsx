import { A, useNavigate } from '@solidjs/router';
import Fuse from 'fuse.js';
import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import { searchEntries } from '../lib/catalog';
import { SearchIcon } from './icons';

/** 02 §12.4：构建期生成索引（generated/search.json），客户端用 Fuse.js 检索。 */
const fuse = new Fuse(searchEntries, {
  keys: ['title', 'description', 'keywords'],
  threshold: 0.35,
  ignoreLocation: true,
});

/** 搜索结果类型徽标（search.json 的 type 字段）。 */
const TYPE_LABELS: Record<string, string> = {
  component: '组件',
  demo: 'Demo',
  api: 'API',
  guide: '指南',
  design: '设计',
  page: '页面',
};

/**
 * 顶栏搜索：⌘K / Ctrl+K 聚焦，↑↓ 在结果间移动焦点，Enter 打开，Esc 清空。
 * 焦点直接落在结果链接上（roving focus），不额外套 combobox 语义，避免嵌套交互的 a11y 问题。
 */
export function Search() {
  const [query, setQuery] = createSignal('');
  const term = () => query().trim();
  const results = createMemo(() => (term() ? fuse.search(term()).slice(0, 8) : []));
  const navigate = useNavigate();
  let containerRef: HTMLDivElement | undefined;
  let inputRef: HTMLInputElement | undefined;
  let listRef: HTMLUListElement | undefined;

  const resultLinks = () => listRef?.querySelectorAll('a');

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setQuery('');
      inputRef?.focus();
      return;
    }
    const items = results();
    if (!items.length) return;
    const links = resultLinks();
    if (!links) return;
    const active = document.activeElement;
    const current = active instanceof HTMLAnchorElement ? [...links].indexOf(active) : -1;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      links[Math.min(current + 1, links.length - 1)]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (current <= 0) inputRef?.focus();
      else links[current - 1]?.focus();
    } else if (event.key === 'Enter' && current < 0) {
      const first = items[0];
      if (first) {
        navigate(first.item.href);
        setQuery('');
      }
    }
  };

  // ⌘K / Ctrl+K 全局聚焦搜索框。
  onMount(() => {
    const onGlobalKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef?.focus();
        inputRef?.select();
      }
    };
    document.addEventListener('keydown', onGlobalKeydown);
    onCleanup(() => document.removeEventListener('keydown', onGlobalKeydown));
  });

  // 点击搜索区外关闭结果（点结果本身在容器内，不会误关）。
  createEffect(() => {
    if (!term()) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && containerRef && !containerRef.contains(target)) setQuery('');
    };
    document.addEventListener('pointerdown', onPointerDown);
    onCleanup(() => document.removeEventListener('pointerdown', onPointerDown));
  });

  return (
    <div
      class="docs-search"
      ref={(element) => {
        containerRef = element;
      }}
    >
      <SearchIcon class="docs-search__icon" />
      <input
        type="search"
        class="docs-search__input"
        aria-label="搜索组件、API 与 Demo"
        placeholder="搜索组件 / API / Demo"
        value={query()}
        data-testid="search-input"
        ref={(element) => {
          inputRef = element;
        }}
        onInput={(event) => setQuery(event.currentTarget.value)}
        onKeyDown={onKeydown}
      />
      <Show when={!term()}>
        <kbd class="docs-search__kbd">⌘K</kbd>
      </Show>
      <Show when={term()}>
        <ul
          class="docs-search__results"
          data-testid="search-results"
          ref={(element) => {
            listRef = element;
          }}
        >
          <For each={results()} fallback={<li class="docs-search__empty">没有匹配结果</li>}>
            {(hit) => (
              <li>
                <A
                  href={hit.item.href}
                  data-testid="search-result"
                  onClick={() => setQuery('')}
                  onKeyDown={onKeydown}
                >
                  <span class="docs-search__type">{TYPE_LABELS[hit.item.type] ?? hit.item.type}</span>
                  <span class="docs-search__body">
                    <strong>{hit.item.title}</strong>
                    <span>{hit.item.description}</span>
                  </span>
                </A>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
}
