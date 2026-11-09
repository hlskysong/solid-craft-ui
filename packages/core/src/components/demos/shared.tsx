import type { JSX } from 'solid-js';

/**
 * Demo 共享辅助件。
 *
 * 目录名 `demos` 已被 scripts/collect-sources.mjs 列入 EXCLUDED_DIRS，
 * 因此这里与同级的 `<component>/demos/*.tsx` 都不会进入发布产物。
 * 文档站（apps/docs）用 `import.meta.glob` 直接加载这些源文件。
 */
export const VARIANTS = ['solid', 'outline', 'dashed', 'text', 'link'] as const;
export const COLORS = ['primary', 'neutral', 'success', 'warning', 'danger'] as const;
export const SIZES = ['small', 'medium', 'large'] as const;
export const LEVELS = [1, 2, 3, 4, 5] as const;

export function DemoSection(props: { title: string; children?: JSX.Element }) {
  return (
    <section class="demo-section">
      <h2 class="demo-section__title">{props.title}</h2>
      <div class="demo-row">{props.children}</div>
    </section>
  );
}

export function DotIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill="currentColor" />
    </svg>
  );
}
