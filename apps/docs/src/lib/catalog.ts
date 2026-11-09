import type { JSX } from 'solid-js';
import catalogJson from '../generated/catalog.json';
import searchJson from '../generated/search.json';

/**
 * 文档站数据层：全部来自 scripts/generate-docs.mjs 的生成物 + Vite 的 Demo glob。
 *
 * 组件模块与 ?raw 源码指向同一个文件路径，因此「渲染的 Demo」与「展示的源码」
 * 不可能分叉；生成的 highlighted HTML 由生成脚本读同一磁盘文件产出。
 */
export interface DemoMeta {
  name: string;
  path: string;
  title: string;
  description: string;
}

export interface ComponentMeta {
  slug: string;
  title: string;
  category: string;
  description: string;
  exportPath: string | null;
  hasApi: boolean;
  demos: DemoMeta[];
}

export interface PageMeta {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
}

export interface ExtraApiMeta {
  slug: string;
  title: string;
  source: string;
  exportPath: string;
}

export interface Catalog {
  version: string;
  slugs: string[];
  components: ComponentMeta[];
  guidePages: PageMeta[];
  designPages: PageMeta[];
  extraApis: ExtraApiMeta[];
}

export interface ApiProp {
  name: string;
  type: string;
  optional: boolean;
  description: string;
  default: string | null;
}

export interface ApiDoc {
  slug: string;
  source: string;
  interfaces: { name: string; inherits: string | null; props: ApiProp[] }[];
}

export interface SearchEntry {
  type: string;
  title: string;
  description: string;
  keywords: string;
  href: string;
}

export interface DemoSourceDoc {
  path: string;
  source: string;
  html: string;
}

type DemoModule = { default: () => JSX.Element };

// Vite 8 的 import.meta.glob 只接受字面量，不能抽成变量（否则 dev 500 / build 静默漏打包）。
const modules = import.meta.glob<DemoModule>(
  '../../../../packages/core/src/components/*/demos/*.tsx',
  { eager: true },
);
const rawModules = import.meta.glob<string>(
  '../../../../packages/core/src/components/*/demos/*.tsx',
  { eager: true, query: '?raw', import: 'default' },
);
const apiModules = import.meta.glob<ApiDoc>('../generated/api/*.json', {
  eager: true,
  import: 'default',
});
const sourceModules = import.meta.glob<DemoSourceDoc>('../generated/demos/*.json', {
  eager: true,
  import: 'default',
});

// JSON import 由 TS 直接推断结构，用类型注解而非断言（oxlint no-unsafe-type-assertion）。
export const catalog: Catalog = catalogJson;
export const searchEntries: SearchEntry[] = searchJson;

const parseDemoKey = (path: string) => {
  const match = /components\/([^/]+)\/demos\/([^/]+)\.tsx/.exec(path);
  return match ? `${match[1]}/${match[2]}` : null;
};

const fromGlob = <T,>(globs: Record<string, T>): Map<string, T> => {
  const result = new Map<string, T>();
  for (const [path, value] of Object.entries(globs)) {
    const key = parseDemoKey(path);
    if (key) result.set(key, value);
  }
  return result;
};

/** Demo 模块：`slug/demoName` → 组件函数。 */
export const demoComponents = new Map<string, () => JSX.Element>(
  [...fromGlob(modules).entries()].map(([key, module]) => [key, module.default]),
);
/** Vite ?raw 读取的源码文本（复制按钮的数据源）。 */
export const demoRawSources = fromGlob(rawModules);
/** 生成脚本读同一文件产出的 Shiki 高亮 HTML。 */
export const demoSourceDocs = new Map<string, DemoSourceDoc>(
  Object.values(sourceModules).map((doc) => [parseDemoKey(doc.path) ?? doc.path, doc]),
);
export const apiDocs = new Map<string, ApiDoc>(
  Object.entries(apiModules).map(([path, doc]) => [
    path.split('/').at(-1)?.replace(/\.json$/, '') ?? '',
    doc,
  ]),
);

export const demoKey = (slug: string, name: string) => `${slug}/${name}`;

export const findComponent = (slug: string) =>
  catalog.components.find((component) => component.slug === slug);

export const findDemo = (slug: string, name: string) =>
  findComponent(slug)?.demos.find((demo) => demo.name === name);

export const standalonePath = (slug: string, name: string) =>
  `/components/${slug}/${name}?standalone=1`;
