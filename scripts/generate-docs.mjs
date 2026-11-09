import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { parseSync } from 'oxc-parser';
import { codeToHtml } from 'shiki';
import { COMPONENTS, EXTRA_APIS } from '../apps/docs/src/content/catalog.mjs';
import { DESIGN_PAGES, GUIDE_PAGES } from '../apps/docs/src/content/pages.mjs';

/**
 * T1-06 文档站生成管线（02 §12.2 / §12.3 / §12.4、ADR-008）。
 *
 * 唯一真源是组件源码本身：
 * - Demo 模块与展示源码：packages/core/src/components/*\/demos/*.tsx（Vite 用 ?raw 读同一文件）；
 * - Demo 元数据：demo 文件里的 `export const demo = { title, description }`；
 * - API 表：oxc-parser 解析 types.ts 的 interface + JSDoc/@default；
 * - 目录 / 导航：apps/docs/src/content/catalog.mjs 与 pages.mjs。
 *
 * 产物写入 apps/docs/src/generated/，随工作区一起保存。
 * `--check` 只比对不落盘，源码与生成物不同步时退出码 1，供 `pnpm check:docs` 门禁使用。
 */
const repoRoot = resolve(import.meta.dirname, '..');
const coreSrc = join(repoRoot, 'packages', 'core', 'src');
const demosRoot = join(coreSrc, 'components');
const generatedRoot = join(repoRoot, 'apps', 'docs', 'src', 'generated');
const checkOnly = process.argv.includes('--check');

const parse = (path) => parseSync(path, readFileSync(path, 'utf8'));

/** 从紧邻成员的块注释里提取说明与 @default。 */
const docComment = (source, comments, member) => {
  const block = comments.findLast(
    (comment) =>
      comment.type === 'Block' &&
      comment.end <= member.start &&
      source.slice(comment.end, member.start).trim() === '',
  );
  if (!block) return { description: '', default: null };

  const lines = block.value
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trim())
    .filter(Boolean);
  const defaultLine = lines.find((line) => line.startsWith('@default'));
  return {
    description: lines.filter((line) => !line.startsWith('@')).join(' '),
    default: defaultLine ? defaultLine.slice('@default'.length).trim() || null : null,
  };
};

/** 解析一个 types.ts：所有 export interface 的字段、类型、JSDoc 与继承说明。 */
const buildApi = (slug, absPath, sourceLabel) => {
  const source = readFileSync(absPath, 'utf8');
  const { program, comments } = parse(absPath);
  const interfaces = [];

  for (const node of program.body) {
    const declaration =
      node.type === 'ExportNamedDeclaration'
        ? node.declaration
        : node.type === 'TSInterfaceDeclaration'
          ? node
          : null;
    if (declaration?.type !== 'TSInterfaceDeclaration') continue;

    const inherits = declaration.extends?.length
      ? source.slice(declaration.extends[0].start, declaration.extends[0].end)
      : null;
    const props = declaration.body.body
      .filter((member) => member.type === 'TSPropertySignature' && member.key?.name)
      .map((member) => ({
        name: member.key.name,
        type: source
          .slice(member.typeAnnotation.start, member.typeAnnotation.end)
          .replace(/^\s*:\s*/, '')
          .trim(),
        optional: Boolean(member.optional),
        ...docComment(source, comments, member),
      }));

    interfaces.push({ name: declaration.id.name, inherits, props });
  }

  if (interfaces.length === 0)
    throw new Error(`[generate-docs] ${sourceLabel}: 未解析到任何 interface`);
  return { slug, source: sourceLabel, interfaces };
};

/** 解析 demo 文件里的 `export const demo = {...}`。 */
const buildDemoMeta = (absPath, sourceLabel) => {
  const { program } = parse(absPath);
  const declaration = program.body
    .filter((node) => node.type === 'ExportNamedDeclaration')
    .map((node) => node.declaration)
    .find(
      (node) =>
        node?.type === 'VariableDeclaration' &&
        node.declarations.some((item) => item.id.type === 'Identifier' && item.id.name === 'demo'),
    );
  const init = declaration?.declarations.find(
    (item) => item.id.type === 'Identifier' && item.id.name === 'demo',
  )?.init;
  if (init?.type !== 'ObjectExpression') {
    throw new Error(
      `[generate-docs] ${sourceLabel}: 缺少 export const demo = { title, description }`,
    );
  }

  const read = (key) => {
    const property = init.properties.find(
      (item) => item.type === 'Property' && item.key?.name === key,
    );
    return property?.value?.value ?? null;
  };
  const title = read('title');
  const description = read('description');
  if (!title || !description) {
    throw new Error(`[generate-docs] ${sourceLabel}: demo.title / demo.description 不能为空`);
  }
  return { title, description };
};

/** 扫描 demos 目录，并与 catalog.mjs 双向校验。 */
const buildCatalog = () => {
  const found = readdirSync(demosRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((slug) => existsSync(join(demosRoot, slug, 'demos')))
    .toSorted((a, b) => a.localeCompare(b));

  const declared = COMPONENTS.map((component) => component.slug).toSorted((a, b) =>
    a.localeCompare(b),
  );
  const missing = declared.filter((slug) => !found.includes(slug));
  const extra = found.filter((slug) => !declared.includes(slug));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `[generate-docs] catalog.mjs 与 demos 目录不同步：缺少 [${missing.join(', ')}]，多余 [${extra.join(', ')}]`,
    );
  }

  const components = COMPONENTS.map((component) => {
    const demoDir = join(demosRoot, component.slug, 'demos');
    const files = readdirSync(demoDir)
      .filter((name) => name.endsWith('.tsx'))
      .toSorted((a, b) => a.localeCompare(b));
    if (files.length === 0) {
      throw new Error(`[generate-docs] ${component.slug}: demos 目录为空`);
    }
    const demos = files.map((file) => {
      const abs = join(demoDir, file);
      const label = `packages/core/src/components/${component.slug}/demos/${file}`;
      return {
        name: file.slice(0, -'.tsx'.length),
        path: label,
        ...buildDemoMeta(abs, label),
      };
    });
    return { ...component, demos };
  });

  return {
    version: JSON.parse(readFileSync(join(repoRoot, 'packages/core/package.json'), 'utf8')).version,
    slugs: COMPONENTS.map((component) => component.slug),
    components,
    guidePages: GUIDE_PAGES,
    designPages: DESIGN_PAGES,
    extraApis: EXTRA_APIS,
  };
};

const buildApis = (catalog) => {
  const result = {};
  for (const component of catalog.components.filter((item) => item.hasApi)) {
    const abs = join(coreSrc, 'components', component.slug, 'types.ts');
    if (!existsSync(abs)) throw new Error(`[generate-docs] ${component.slug}: 缺少 types.ts`);
    result[component.slug] = buildApi(
      component.slug,
      abs,
      relative(repoRoot, abs).replaceAll('\\', '/'),
    );
  }
  for (const extra of EXTRA_APIS) {
    const abs = join(coreSrc, extra.source.replace(/^src\//, ''));
    if (!existsSync(abs)) throw new Error(`[generate-docs] ${extra.slug}: 缺少 ${extra.source}`);
    result[extra.slug] = buildApi(extra.slug, abs, relative(repoRoot, abs).replaceAll('\\', '/'));
  }
  return result;
};

/** Fuse.js 索引条目：文档页 + 组件 + Demo + API 属性。 */
const buildSearch = (catalog, apis) => {
  const entries = [];
  const push = (entry) => entries.push(entry);

  for (const page of catalog.guidePages) {
    push({
      type: 'guide',
      title: page.title,
      description: page.description,
      keywords: page.keywords.join(' '),
      href: `/docs/getting-started#${page.slug}`,
    });
  }
  for (const page of catalog.designPages) {
    push({
      type: 'design',
      title: page.title,
      description: page.description,
      keywords: page.keywords.join(' '),
      href: `/docs/design/${page.slug}`,
    });
  }
  for (const component of catalog.components) {
    push({
      type: 'component',
      title: component.title,
      description: component.description,
      keywords: `${component.slug} ${component.exportPath ?? ''}`,
      href: `/components/${component.slug}`,
    });
    for (const demo of component.demos) {
      push({
        type: 'demo',
        title: `${component.title} · ${demo.title}`,
        description: demo.description,
        keywords: `${component.slug} ${demo.name}`,
        href: `/components/${component.slug}/${demo.name}`,
      });
    }
    const api = apis[component.slug];
    if (api) {
      for (const iface of api.interfaces) {
        for (const prop of iface.props) {
          push({
            type: 'api',
            title: `${iface.name}.${prop.name}`,
            description: prop.description,
            keywords: `${component.slug} ${prop.type}`,
            href: `/components/${component.slug}#api-${prop.name}`,
          });
        }
      }
    }
  }
  push({
    type: 'page',
    title: '更新记录',
    description: 'Changesets 版本记录',
    keywords: 'changelog',
    href: '/changelog',
  });
  push({
    type: 'page',
    title: '首页',
    description: '基础组件总览与快速导航',
    keywords: 'home',
    href: '/',
  });
  return entries;
};

const catalog = buildCatalog();
const apis = buildApis(catalog);

/** 每个 Demo 的源码文本 + Shiki 高亮 HTML；文档站仍用 Vite ?raw 读同一文件做同源校验。 */
const demoSources = {};
for (const component of catalog.components) {
  for (const demo of component.demos) {
    const source = readFileSync(join(repoRoot, demo.path), 'utf8');
    const html = await codeToHtml(source, { lang: 'tsx', theme: 'github-light' });
    demoSources[`demos/${component.slug}-${demo.name}.json`] = {
      path: demo.path,
      source,
      html,
    };
  }
}

const files = {
  'catalog.json': catalog,
  'search.json': buildSearch(catalog, apis),
  ...Object.fromEntries(Object.entries(apis).map(([slug, api]) => [`api/${slug}.json`, api])),
  ...demoSources,
};

const stale = [];
for (const [name, value] of Object.entries(files)) {
  const abs = join(generatedRoot, name);
  const content = `${JSON.stringify(value, null, 2)}\n`;
  if (checkOnly) {
    if (!existsSync(abs) || readFileSync(abs, 'utf8') !== content) stale.push(name);
  } else {
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
}

// 清理已不再生成的文件，避免孤儿页（check 模式下只报告，不落盘）。
const expectedByDir = {
  api: new Set(Object.keys(files).filter((name) => name.startsWith('api/'))),
  demos: new Set(Object.keys(files).filter((name) => name.startsWith('demos/'))),
};
const orphans = [];
for (const [subdir, expected] of Object.entries(expectedByDir)) {
  const dir = join(generatedRoot, subdir);
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir)) {
    const rel = `${subdir}/${name}`;
    if (!expected.has(rel)) orphans.push(rel);
  }
}
if (checkOnly) {
  stale.push(...orphans.map((name) => `${name}（孤儿）`));
} else {
  for (const name of orphans) unlinkSync(join(generatedRoot, name));
}

if (checkOnly) {
  if (stale.length > 0) {
    console.error(`[check:docs] 生成物与源码不同步：${stale.join('、')}`);
    console.error('[check:docs] 请运行 pnpm docs:generate 后重新提交生成物。');
    process.exit(1);
  }
  console.log(`[check:docs] ${Object.keys(files).length} 个生成物与源码一致`);
} else {
  console.log(
    `[generate-docs] catalog ${catalog.components.length} 组件 / ${catalog.components.reduce((sum, item) => sum + item.demos.length, 0)} Demo / ${Object.keys(apis).length} API 表 / ${files['search.json'].length} 条搜索索引`,
  );
}
