import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * E2E 与文档站共用的唯一清单：直接读 scripts/generate-docs.mjs 生成的 catalog.json，
 * 而 catalog.json 又由 packages/core/src/components/*\/demos/ 目录扫描而来。
 * 因此「组件 Demo 目录 → 文档站路由 → 浏览器 / 截图用例」三层不可能漂移。
 *
 * 路由形态对齐 02 §12.1：/components/:slug/:demo；?standalone=1 是文档站的
 * 无 chrome 截图宿主（06 §5.2 / §5.3），overview 落在首页。
 */
const raw: unknown = JSON.parse(
  readFileSync(resolve(process.cwd(), 'apps/docs/src/generated/catalog.json'), 'utf8'),
);

const isSlugList = (value: unknown): value is { slugs: unknown[] } =>
  typeof value === 'object' && value !== null && 'slugs' in value && Array.isArray(value.slugs);

if (!isSlugList(raw)) {
  throw new Error('[demo-list] apps/docs/src/generated/catalog.json 缺少 slugs 数组');
}

export const DEMO_IDS: readonly string[] = raw.slugs.filter(
  (value): value is string => typeof value === 'string',
);

/** 独立 Demo 页路径；overview 落在根路径。 */
export function demoPath(id: string): string {
  return id === 'overview' ? '/?standalone=1' : `/components/${id}/basic?standalone=1`;
}
