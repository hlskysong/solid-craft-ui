import { A } from '@solidjs/router';
import { createSignal, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import {
  demoComponents,
  demoKey,
  demoRawSources,
  demoSourceDocs,
  findDemo,
  standalonePath,
} from '../lib/catalog';

/**
 * Demo 卡片（02 §12.2）：真实渲染区 + 源码展开 / 复制 + 独立页链接。
 *
 * - 渲染模块：import.meta.glob 加载 packages/core/src/components/*\/demos/*.tsx；
 * - 展示源码：同一路径的 ?raw 文本 + 生成脚本读同一磁盘文件的 Shiki 高亮 HTML；
 * - 独立页：?standalone=1 去掉文档站 chrome，供 Playwright 截图 / axe / 键盘链使用。
 */
export function Demo(props: { slug: string; name: string }) {
  const key = () => demoKey(props.slug, props.name);
  const [open, setOpen] = createSignal(false);
  const [copied, setCopied] = createSignal(false);

  const copySource = async () => {
    const source = demoRawSources.get(key()) ?? '';
    await navigator.clipboard.writeText(source);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Show when={findDemo(props.slug, props.name)} fallback={<p>未找到 Demo：{key()}</p>}>
      {(meta) => (
        <section class="docs-demo" data-demo-card={key()} data-testid={`demo-card-${key()}`}>
          <header class="docs-demo__head">
            <div class="docs-demo__heading">
              <h3>{meta().title}</h3>
              <p>{meta().description}</p>
            </div>
            <div class="docs-demo__actions">
              <button
                type="button"
                class="docs-button"
                aria-expanded={open()}
                data-testid={`source-toggle-${key()}`}
                onClick={() => setOpen((value) => !value)}
              >
                {open() ? '收起源码' : '查看源码'}
              </button>
              <button
                type="button"
                class="docs-button"
                data-copied={copied() ? '1' : '0'}
                data-testid={`source-copy-${key()}`}
                onClick={copySource}
              >
                {copied() ? '已复制' : '复制源码'}
              </button>
              <A
                class="docs-button"
                href={standalonePath(props.slug, props.name)}
                target="_blank"
                rel="noreferrer"
                data-testid={`standalone-link-${key()}`}
              >
                独立页
              </A>
            </div>
          </header>

          <div class="docs-demo__stage">
            <Dynamic component={demoComponents.get(key())} />
          </div>

          <Show when={open()}>
            <div class="docs-demo__source">
              <p class="docs-demo__source-path">{meta().path}</p>
              <div data-testid={`source-html-${key()}`} innerHTML={demoSourceDocs.get(key())?.html ?? ''} />
            </div>
          </Show>
        </section>
      )}
    </Show>
  );
}
