import { For, Show } from 'solid-js';
import { apiDocs } from '../lib/catalog';

/**
 * API 表（02 §12.3）：消费 scripts/generate-docs.mjs 用 oxc-parser 从 types.ts
 * 解析出的 interface / 类型 / JSDoc / @default；继承的原生属性只标注来源，不展开。
 */
export function ApiTable(props: { slug: string }) {
  const doc = () => apiDocs.get(props.slug);
  return (
    <Show
      when={doc()}
      fallback={<p class="docs-muted">该页面没有组件 Props 接口，见「快速开始」的 ConfigProvider API。</p>}
    >
      {(api) => (
        <section class="docs-api" id="api" data-testid="api-table" data-api={props.slug}>
          <h2>API</h2>
          <p class="docs-muted">
            由 <code>oxc-parser</code> 解析 <code>{api().source}</code> 生成，默认值来自 JSDoc{' '}
            <code>@default</code>；改动源码后必须执行 <code>pnpm docs:generate</code>。
          </p>
          <For each={api().interfaces}>
            {(iface) => (
              <div class="docs-api__block">
                <h3>{iface.name}</h3>
                <Show when={iface.inherits}>
                  <p class="docs-muted">
                    继承自 <code>{iface.inherits}</code>；原生属性不在此展开。
                  </p>
                </Show>
                <table class="docs-table">
                  <thead>
                    <tr>
                      <th scope="col">属性</th>
                      <th scope="col">类型</th>
                      <th scope="col">默认值</th>
                      <th scope="col">说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={iface.props}>
                      {(prop) => (
                        <tr id={`api-${prop.name}`} data-prop={prop.name}>
                          <th scope="row">
                            <code>{prop.name}</code>
                            <Show when={!prop.optional}>
                              <span class="docs-required">必填</span>
                            </Show>
                          </th>
                          <td>
                            <code>{prop.type}</code>
                          </td>
                          <td>
                            <code>{prop.default ?? '—'}</code>
                          </td>
                          <td>{prop.description || '—'}</td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            )}
          </For>
        </section>
      )}
    </Show>
  );
}
