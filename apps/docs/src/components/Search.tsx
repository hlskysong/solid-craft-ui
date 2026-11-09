import { A } from '@solidjs/router';
import Fuse from 'fuse.js';
import { createMemo, createSignal, For, Show } from 'solid-js';
import { searchEntries } from '../lib/catalog';

/** 02 §12.4：构建期生成索引（generated/search.json），客户端用 Fuse.js 检索。 */
const fuse = new Fuse(searchEntries, {
  keys: ['title', 'description', 'keywords'],
  threshold: 0.35,
  ignoreLocation: true,
});

export function Search() {
  const [query, setQuery] = createSignal('');
  const term = () => query().trim();
  const results = createMemo(() => (term() ? fuse.search(term()).slice(0, 8) : []));

  return (
    <div class="docs-search">
      <input
        type="search"
        class="docs-search__input"
        aria-label="搜索组件、API 与 Demo"
        placeholder="搜索组件 / API / Demo"
        value={query()}
        data-testid="search-input"
        onInput={(event) => setQuery(event.currentTarget.value)}
      />
      <Show when={term()}>
        <ul class="docs-search__results" data-testid="search-results">
          <For each={results()} fallback={<li class="docs-search__empty">没有匹配结果</li>}>
            {(hit) => (
              <li>
                <A
                  href={hit.item.href}
                  data-testid="search-result"
                  onClick={() => setQuery('')}
                >
                  <strong>{hit.item.title}</strong>
                  <span>{hit.item.description}</span>
                </A>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
}
