import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * E2E 与文档站共用的唯一清单：直接读 scripts/generate-docs.mjs 生成的 catalog.json，
 * 而 catalog.json 又由 packages/core/src/components/*\/demos/ 目录扫描而来。
 * 因此「组件 Demo 目录 → 文档站路由 → 浏览器 / 截图用例」三层不可能漂移。
 *
 * 路由形态对齐 02 §12.1：/components/:slug/:demo；?standalone=1 是文档站的
 * 无 chrome 截图宿主（06 §5.2 / §5.3），overview 落在首页。
 *
 * T2-13 扩面（docs/08 §30.31）：清单粒度从「组件」细化到「组件 × Demo」。
 * 之前 `demoPath()` 写死 `basic`，于是除首 Demo 外的页面既没有视觉基线、也不进
 * axe 扫描 —— 「每组件 ≥3 Demo」的验收在机制上无法达成。现在 DEMO_CASES 由
 * catalog 展开，截图 / axe / 窄屏冒烟三条用例都按它循环，新增 Demo 自动纳入。
 */
const raw: unknown = JSON.parse(
  readFileSync(resolve(process.cwd(), 'apps/docs/src/generated/catalog.json'), 'utf8'),
);

interface RawDemo {
  name: string;
}

interface RawComponent {
  slug: string;
  demos: RawDemo[];
}

interface RawCatalog {
  slugs: unknown[];
  components: RawComponent[];
}

const isString = (value: unknown): value is string => typeof value === 'string';

const isRawDemo = (value: unknown): value is RawDemo =>
  typeof value === 'object' && value !== null && 'name' in value && isString(value.name);

const isRawComponent = (value: unknown): value is RawComponent =>
  typeof value === 'object' &&
  value !== null &&
  'slug' in value &&
  isString(value.slug) &&
  'demos' in value &&
  Array.isArray(value.demos) &&
  value.demos.every(isRawDemo);

const isRawCatalog = (value: unknown): value is RawCatalog =>
  typeof value === 'object' &&
  value !== null &&
  'slugs' in value &&
  Array.isArray(value.slugs) &&
  'components' in value &&
  Array.isArray(value.components) &&
  value.components.every(isRawComponent);

if (!isRawCatalog(raw)) {
  throw new Error(
    '[demo-list] apps/docs/src/generated/catalog.json 结构不符（缺 slugs / components）',
  );
}

/** 独立 Demo 页路径；overview 是聚合页，落在根路径。 */
function pathFor(slug: string, demo: string): string {
  return slug === 'overview' ? '/?standalone=1' : `/components/${slug}/${demo}?standalone=1`;
}

/** 一个「组件 × Demo」用例：截图 / axe / 窄屏冒烟的最小单元。 */
export interface DemoCase {
  /** 组件 slug（`overview` 是聚合页，不是组件，但仍要截图与扫描）。 */
  readonly slug: string;
  /** Demo 名，等于 `demos/` 下的文件名去掉 `.tsx`。 */
  readonly demo: string;
  /** 该 Demo 的无 chrome 独立页路径。 */
  readonly path: string;
}

/** 全量清单，顺序与 catalog 一致（组件按声明顺序，Demo 按文件名排序）。 */
export const DEMO_CASES: readonly DemoCase[] = raw.components.flatMap((component) =>
  component.demos.map((demo) => ({
    slug: component.slug,
    demo: demo.name,
    path: pathFor(component.slug, demo.name),
  })),
);

/** 组件 slug 列表：只关心「每组件一次」的用例（如首页目录断言）用它。 */
export const DEMO_IDS: readonly string[] = raw.slugs.filter(isString);

/**
 * catalog 里的 Demo 总数，**不经 DEMO_CASES 的映射**单独算一遍。
 *
 * 用途是让用例侧自检「清单没被截断」：如果有人把 DEMO_CASES 改成只取首 Demo，
 * 视觉基线文件与 catalog 仍然一致（基线都在），截图用例却少跑了大半 ——
 * 这种「静默缩水」只能靠两条独立路径的数一下来抓。
 */
export const CATALOG_DEMO_TOTAL: number = raw.components.reduce(
  (sum, component) => sum + component.demos.length,
  0,
);

/** 用例 id：`slug-demo`，同时是视觉基线文件名的中段。 */
export function demoCaseId(item: DemoCase): string {
  return `${item.slug}-${item.demo}`;
}

/** 独立 Demo 页路径；省略 `demo` 时取 `basic`（每组件首 Demo 的约定名）。 */
export function demoPath(slug: string, demo = 'basic'): string {
  return pathFor(slug, demo);
}
