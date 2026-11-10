import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, posix, relative, resolve } from 'node:path';
import { applyNaming } from './naming-legacy.mjs';
import { PACKAGE_BASE, REPO_NAME } from './scope.mjs';

/**
 * T1-14：由单一真源生成 llmstxt.org 风格的完整 LLM 文档。
 *
 * 输入（任何一项改动都会让 `pnpm check:llms` 失败）：
 * - packages/core/package.json：exports 子路径 / 条件导出 / 版本 / 依赖；
 * - apps/docs/src/generated/*：T1-06 由组件源码 JSDoc 与 Demo 源文件生成的 catalog / api / demos；
 * - docs/01~07：按标题定位的规范章节摘录；
 * - packages/tokens/tokens/semantic/*.json：真实语义色与分档标注；
 * - examples/*：三端构建器与 SSR 示例的真实配置 / 入口源码。
 *
 * 产物写入两处（内容逐字一致，L1 方案）：
 * - apps/docs/public/（Vite 静态根，URL 即 /llms.txt），链接全部相对站点根；
 * - packages/core/ 根目录的三个文件（llms.txt / llms-full.txt / llms-manifest.json），
 *   由 package.json#files 带入 tarball，版本与所安装的包天然一致。
 * 逐页 Markdown 不随包发布：全量正文已合并进 llms-full.txt，离线可直接读取。
 * `--check` 只比对不落盘，另外校验结构、链接可达性、exports 覆盖率、full 完整性与包内副本。
 *
 * §30.9：`public/fonts/` 是手工维护的静态资产（固定 Web 字体 + OFL 许可证 + 字集清单），
 * 不是 llms 生成物，由 STATIC_ASSET_DIRS 精确豁免孤儿检测；其余目录仍逐文件严格比对，
 * 且非 `--check` 模式会清理真正的孤儿。豁免只按目录前缀，不放宽任何其它路径。
 */
const repoRoot = resolve(import.meta.dirname, '..');
const publicRoot = join(repoRoot, 'apps', 'docs', 'public');
const coreRoot = join(repoRoot, 'packages', 'core');
const generatedRoot = join(repoRoot, 'apps', 'docs', 'src', 'generated');
const checkOnly = process.argv.includes('--check');

const read = (rel) => readFileSync(join(repoRoot, rel), 'utf8');
const readJson = (rel) => JSON.parse(read(rel));
const fence = '```';
const codeBlock = (lang, source) => `${fence}${lang}\n${source.trimEnd()}\n${fence}`;
const cell = (value) =>
  String(value ?? '')
    .replaceAll('|', '\\|')
    .replaceAll('\n', ' ')
    .trim();

/**
 * 规范摘录里的仓库内相对链接对站点无效，转成纯文本保留信息。
 * docs/01~07 是 SHA256 冻结基线，正文仍是改名前占位名；这里统一过一遍
 * naming-legacy.mjs 映射层，保证对外产物只用正式名，冻结文件字节不变。
 */
const neutralize = (text) => applyNaming(text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'));

const specCache = new Map();
const specLines = (file) => {
  if (!specCache.has(file)) specCache.set(file, read(`docs/${file}`).split('\n'));
  return specCache.get(file);
};

/** 按标题前缀唯一命中抽取章节正文；标题改名 / 重复都会直接报错，不会静默漏摘。 */
const specSection = (file, headingPrefix) => {
  const lines = specLines(file);
  const hits = lines.flatMap((line, index) =>
    line.startsWith('#') && line.startsWith(headingPrefix) ? [index] : [],
  );
  if (hits.length !== 1) {
    throw new Error(
      `[generate-llms] docs/${file} 的标题「${headingPrefix}」命中 ${hits.length} 次（应为 1 次）`,
    );
  }
  const start = hits[0];
  const level = /^#+/.exec(lines[start])?.[0].length ?? 2;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const heading = /^(#{1,6}) /.exec(lines[index]);
    if (heading && heading[1].length <= level) {
      end = index;
      break;
    }
  }
  const body = lines
    .slice(start + 1, end)
    .join('\n')
    .trimEnd();
  if (body.length === 0) throw new Error(`[generate-llms] docs/${file} ${headingPrefix} 正文为空`);
  // 标题行也可能含冻结规范里的旧包名（如 docs/02 的 package.json 小节标题），
  // 一并过映射层，否则冻结规范的旧名会从标题泄漏到对外产物。
  return applyNaming(
    `> 规范摘录：\`docs/${file}\` → ${lines[start].trim()}\n\n${neutralize(body)}`,
  );
};

const corePkg = readJson('packages/core/package.json');
const catalog = readJson('apps/docs/src/generated/catalog.json');
const lightTokens = readJson('packages/tokens/tokens/semantic/light.json');
const darkTokens = readJson('packages/tokens/tokens/semantic/dark.json');
const rootPkg = readJson('package.json');
const apis = Object.fromEntries(
  readdirSync(join(generatedRoot, 'api')).map((name) => [
    name.slice(0, -'.json'.length),
    readJson(`apps/docs/src/generated/api/${name}`),
  ]),
);
const demoSources = Object.fromEntries(
  readdirSync(join(generatedRoot, 'demos')).map((name) => [
    name.slice(0, -'.json'.length),
    readJson(`apps/docs/src/generated/demos/${name}`),
  ]),
);

const exportSlug = (key) =>
  key === '.'
    ? 'root'
    : key
        .replace(/^\.\//, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase();
const exportPage = (key) => `llms/exports/${exportSlug(key)}.md`;
const exportSpecifier = (key) => (key === '.' ? corePkg.name : `${corePkg.name}/${key.slice(2)}`);

const banner = (source) =>
  `> 由 \`pnpm generate:llms\` 生成，请勿手工编辑。真源：${source}；改源后需重新生成，否则 \`pnpm check:llms\` 失败。`;

const renderApi = (api) => {
  if (!api) return '该子路径不暴露组件 Props。';
  return api.interfaces
    .map((iface) =>
      [
        `### ${iface.name}`,
        '',
        `继承：${iface.inherits ? `\`${cell(iface.inherits)}\`` : '无'}`,
        '',
        '| 属性 | 类型 | 默认值 | 说明 | 必填 |',
        '| --- | --- | --- | --- | --- |',
        ...iface.props.map(
          (prop) =>
            `| \`${cell(prop.name)}\` | \`${cell(prop.type)}\` | ${prop.default ? `\`${cell(prop.default)}\`` : '—'} | ${cell(prop.description) || '—'} | ${prop.optional ? '否' : '是'} |`,
        ),
        '',
      ].join('\n'),
    )
    .join('\n');
};

const renderConditions = (target) => {
  const rows =
    typeof target === 'string'
      ? [['default', target, '字符串简写，无条件分支']]
      : Object.entries(target).map(([condition, value]) => [
          condition,
          value,
          condition === 'solid'
            ? '保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译'
            : condition === 'types'
              ? 'TypeScript 声明入口'
              : '编译后或静态产物',
        ]);
  return [
    '| 条件 | 产物路径 | 说明 |',
    '| --- | --- | --- |',
    ...rows.map(([condition, value, note]) => `| \`${condition}\` | \`${value}\` | ${note} |`),
  ].join('\n');
};

/** 组件 / ConfigProvider 子路径页：描述 + 条件导出 + 引入 + 完整 API 表 + Demo 链接。 */
const buildExportPage = (key) => {
  const target = corePkg.exports[key];
  const specifier = exportSpecifier(key);
  const slug = exportSlug(key);
  const component = catalog.components.find((item) => item.slug === slug && item.hasApi);
  const extra = catalog.extraApis.find((item) => item.slug === slug);
  const api = apis[slug];
  const title = component?.title ?? extra?.title ?? '';
  const heading =
    key === '.'
      ? `根入口 \`${specifier}\``
      : title
        ? `${title}（\`${specifier}\`）`
        : `子路径 \`${specifier}\``;
  const parts = [
    `# ${heading}`,
    '',
    banner(
      '`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）',
    ),
    '',
    '## 概要',
    '',
    component?.description ??
      (extra
        ? '全局配置上下文，注入主题 / 密度 / 方向 / 语言 / z-index，注入值一律为 getter。'
        : `\`${specifier}\` 是 \`${corePkg.name}\` 的公开子路径，条件导出如下。`),
    '',
    '## 条件导出',
    '',
    renderConditions(target),
    '',
    '## 引入方式',
    '',
    codeBlock('ts', `import { /* 导出符号 */ } from '${specifier}';`),
    '',
    '## API',
    '',
    renderApi(api),
    ...(api
      ? [
          '',
          '## 类型定义源码（含 JSDoc 全文）',
          '',
          `源：\`${api.source}\`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 \`pnpm check:llms\` 失败。`,
          '',
          codeBlock('ts', read(api.source)),
        ]
      : []),
  ];

  if (component) {
    parts.push(
      '',
      '## 相关 Demo（完整源码见链接页）',
      '',
      ...component.demos.map(
        (demo) =>
          `- [${demo.title}](../demos/${component.slug}-${demo.name}.md)：${demo.description}（源文件 \`${demo.path}\`）`,
      ),
      '',
      '## 相关规范',
      '',
      specSection('02-架构设计.md', '### 6.1 命名与 Props'),
    );
  }

  if (key === '.') {
    parts.push(
      '',
      '## 根入口导出清单',
      '',
      ...catalog.components
        .filter((item) => item.exportPath)
        .map((item) => `- \`${item.exportPath}\` → ${item.title}：${item.description}`),
      '',
      '- `solid-craft/config-provider` → ConfigProvider 全局配置',
      '',
      '## 相关规范',
      '',
      specSection('02-架构设计.md', '### 3.2 消费方式'),
    );
  }

  if (slug === 'styles-css' || slug === 'styles') {
    parts.push(
      '',
      '## 样式引入约定',
      '',
      codeBlock(
        'ts',
        `// 全量\nimport '${corePkg.name}/styles.css';\n\n// 按需\nimport '${corePkg.name}/styles/base.css';\nimport '${corePkg.name}/styles/components/button.css';`,
      ),
      '',
      'JS 不隐式引入 CSS；所有 CSS 变量由 `solid-craft-tokens` 的 DTCG 源生成，统一以 `--scui-` 开头。',
      '',
      '## 相关规范',
      '',
      specSection('02-架构设计.md', '### 3.2 消费方式'),
      '',
      specSection('03-设计系统.md', '### 2.2 命名规范'),
    );
  }

  if (slug === 'package-json') {
    parts.push(
      '',
      '## 包元信息',
      '',
      '| 字段 | 值 |',
      '| --- | --- |',
      ...[
        ['name', corePkg.name],
        ['version', corePkg.version],
        ['type', corePkg.type],
        ['license', corePkg.license],
        ['sideEffects', JSON.stringify(corePkg.sideEffects ?? null)],
        ['dependencies', JSON.stringify(corePkg.dependencies ?? {})],
        ['peerDependencies', JSON.stringify(corePkg.peerDependencies ?? {})],
      ].map(([name, value]) => `| \`${name}\` | \`${cell(value)}\` |`),
      '',
      '## 全部 exports 子路径',
      '',
      ...Object.keys(corePkg.exports).map(
        (item) => `- \`${item}\` → [${exportSpecifier(item)}](../exports/${exportSlug(item)}.md)`,
      ),
    );
  }

  return {
    path: exportPage(key),
    title: `# ${heading}`,
    kind: 'exports',
    summary:
      component?.description ??
      (extra
        ? '全局配置上下文：主题 / 密度 / 方向 / 语言 / z-index 的注入与完整 Props。'
        : `\`${specifier}\` 的条件导出、产物路径与引入方式。`),
    body: `${parts.join('\n')}\n`,
  };
};

const DESIGN_SPEC = {
  tokens: ['03-设计系统.md', '### 2.1 三层结构'],
  color: ['03-设计系统.md', '### 3.1 色板'],
  layout: ['03-设计系统.md', '### 5.1 间距'],
  motion: ['03-设计系统.md', '## 6. 动效'],
  dark: ['03-设计系统.md', '### 3.3 暗色'],
  density: ['03-设计系统.md', '## 8. 密度（Density）'],
};

/** DTCG 嵌套结构递归展开为 { path, cssVar, token }，与 style-dictionary 的 name/kebab 一致。 */
const flattenColorTokens = (tokens) => {
  const result = [];
  const walk = (node, path) => {
    for (const [key, value] of Object.entries(node ?? {})) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
      const next = [...path, key];
      if (typeof value.$value === 'string') {
        result.push({
          path: next.join('.'),
          cssVar: `--scui-${next.join('-')}`,
          token: value,
        });
      } else {
        walk(value, next);
      }
    }
  };
  walk(tokens.color, ['color']);
  return result;
};

const semanticRows = (tokens) =>
  flattenColorTokens(tokens)
    .map(
      ({ cssVar, token }) =>
        `| \`${cssVar}\` | \`${cell(token.$value)}\` | \`${cell(token.$contrastTier ?? '—')}\` | \`${cell(token.$contrastBg ?? '—')}\` | ${cell(token.$usage ?? '—')} |`,
    )
    .join('\n');

/** 设计页：文档站 DESIGN_PAGES 元数据 + 真实 semantic token 值 + docs/03 章节摘录。 */
const buildDesignPages = () =>
  catalog.designPages.map((page) => {
    const [file, prefix] = DESIGN_SPEC[page.slug] ?? [];
    if (!file) throw new Error(`[generate-llms] 设计页 ${page.slug} 缺少规范章节映射`);
    const parts = [
      `# ${page.title}`,
      '',
      banner(
        '`apps/docs/src/content/pages.mjs` + `docs/03-设计系统.md` + `packages/tokens/tokens/semantic/*.json`',
      ),
      '',
      '## 概要',
      '',
      page.description,
      '',
      `关键词：${page.keywords.join(' / ')}。`,
      '',
      '## 当前语义 Token（构建期校验过的真实值）',
      '',
      '| CSS 变量 | 值 | 对比度档位 | 校验背景 | 用途 |',
      '| --- | --- | --- | --- | --- |',
      semanticRows(lightTokens),
      '',
      '暗色主题由 `theme-dark.css` 覆盖同名变量；当前构建期按 03 §3.1 的 7 档规则校验，语义色漏标 `$contrastTier` 或不达标都会让 `pnpm build` 失败。',
      '',
      '## 规范摘录',
      '',
      specSection(file, prefix),
      '',
      '## 相关页面',
      '',
      '- [快速开始](../guides/getting-started.md)',
      '- [样式子路径](../exports/styles-css.md)',
      '- [SSR 与 Hydration](../guides/ssr.md)',
    ];
    return {
      path: `llms/design/${page.slug}.md`,
      title: `# ${page.title}`,
      kind: 'design',
      summary: page.description,
      body: `${parts.join('\n')}\n`,
    };
  });

const examplePages = [
  { name: 'vite', title: 'Vite 消费', config: 'examples/vite/vite.config.mjs' },
  { name: 'webpack', title: 'Webpack 5 消费', config: 'examples/webpack/webpack.config.mjs' },
  { name: 'rspack', title: 'Rspack 消费', config: 'examples/rspack/rspack.config.mjs' },
];

/** 三端指南：真实 package.json / 配置文件 / 入口源码，不手写伪代码。 */
const buildConsumerPages = () =>
  examplePages.map((example) => {
    const pkg = readJson(`examples/${example.name}/package.json`);
    const parts = [
      `# ${example.title}`,
      '',
      banner(`\`examples/${example.name}/**\` 的真实配置与入口源码`),
      '',
      '## 概要',
      '',
      `工作区项目 \`${pkg.name}\`。\`"solid"\` 条件让构建器命中 \`dist/source/*.jsx\`，构建产物中实际纳入的模块记录在 \`examples/${example.name}/dist/resolved.json\`，由 \`pnpm smoke:consumers\` 校验。`,
      '',
      '## 依赖与命令',
      '',
      '| 字段 | 值 |',
      '| --- | --- |',
      ...[
        ['dependencies', JSON.stringify(pkg.dependencies ?? {})],
        ['devDependencies', JSON.stringify(pkg.devDependencies ?? {})],
        ['scripts', JSON.stringify(pkg.scripts ?? {})],
      ].map(([name, value]) => `| \`${name}\` | \`${cell(value)}\` |`),
      '',
      '## 构建器配置（全文）',
      '',
      codeBlock('js', read(example.config)),
      '',
      '## 入口源码（全文）',
      '',
      codeBlock('tsx', read(`examples/${example.name}/src/index.tsx`)),
      '',
      '## 相关页面',
      '',
      '- [快速开始](../guides/getting-started.md)',
      '- [SSR 与 Hydration](../guides/ssr.md)',
      '- [子路径与条件导出](../exports/root.md)',
    ];
    return {
      path: `llms/guides/${example.name}.md`,
      title: `# ${example.title}`,
      kind: 'guides',
      summary: `${example.title}的真实 package.json、构建器配置全文与入口源码，以及 \`"solid"\` 条件命中的实证方式。`,
      body: `${parts.join('\n')}\n`,
    };
  });

const renderSemanticSummary = () => {
  const darkByPath = new Map(
    flattenColorTokens(darkTokens).map((entry) => [entry.path, entry.token]),
  );
  return [
    '| CSS 变量 | light `$value` | dark `$value` | 分档 |',
    '| --- | --- | --- | --- |',
    ...flattenColorTokens(lightTokens).map(
      ({ path, cssVar, token }) =>
        `| \`${cssVar}\` | \`${cell(token.$value)}\` | \`${cell(darkByPath.get(path)?.$value ?? '—')}\` | \`${cell(token.$contrastTier ?? '—')}\` |`,
    ),
    '',
    '带 `{...}` 的值是 DTCG alias 引用，由 style-dictionary 在构建期解析为 CSS `var(--scui-color-palette-*)`。',
  ].join('\n');
};

const buildGuidePages = () => {
  const gettingStarted = [
    '# 快速开始',
    '',
    banner(
      '`packages/core/package.json` + `docs/02-架构设计.md` + `generated/api/config-provider.json`',
    ),
    '',
    '## 概要',
    '',
    catalog.guidePages[0]?.description ?? '安装与接入。',
    '',
    '## 安装',
    '',
    codeBlock(
      'sh',
      `pnpm add ${corePkg.name}@${corePkg.version} solid-craft-tokens solid-craft-icons solid-js`,
    ),
    '',
    '## 引入样式（必须显式）',
    '',
    codeBlock('ts', `import '${corePkg.name}/styles.css';`),
    '',
    '## ConfigProvider',
    '',
    codeBlock(
      'tsx',
      `import { ConfigProvider } from '${corePkg.name}';\n\n<ConfigProvider theme="light" density="default" direction="ltr" themeTarget="global">\n  <App />\n</ConfigProvider>`,
    ),
    '',
    renderApi(apis['config-provider']),
    '',
    '## 构建器接入',
    '',
    '- [Vite](../guides/vite.md) · [Webpack 5](../guides/webpack.md) · [Rspack](../guides/rspack.md)：三端真实配置与入口源码',
    '- [SSR 与 Hydration](../guides/ssr.md)：SolidStart 与 `"solid"` 条件导出',
    '',
    '## 规范摘录',
    '',
    specSection('02-架构设计.md', '### 3.2 消费方式'),
  ];

  const ssr = [
    '# SSR 与 Hydration',
    '',
    banner(
      '`docs/01 / 02 / 06` 规范章节 + `examples/solid-start` / `examples/start-real` 真实源码 + 根 `package.json` 脚本',
    ),
    '',
    '## 概要',
    '',
    'MVP 主力场景是 SPA / MPA，但组件库在 SSR 场景必须 `renderToString` + hydrate 正常（ADR-018）。只发布编译后 ESM 会锁死 client-only DOM，因此每个组件子路径都同时提供 `"solid"` 条件源码产物。',
    '',
    '## 验收命令（来自根 package.json）',
    '',
    codeBlock(
      'json',
      JSON.stringify(
        Object.fromEntries(
          Object.entries(rootPkg.scripts).filter(([name]) =>
            /^smoke:(ssr|start-real|consumers|tarball)$/.test(name),
          ),
        ),
        null,
        2,
      ),
    ),
    '',
    '## 真实 SolidStart 入口（全文）',
    '',
    codeBlock('tsx', read('examples/solid-start/src/entry-server.tsx')),
    '',
    '## 规范摘录：条件导出',
    '',
    specSection('02-架构设计.md', '### 3.3'),
    '',
    '## 规范摘录：SSR 与 Hydration',
    '',
    specSection('02-架构设计.md', '## 8. SSR 与 Hydration'),
    '',
    '## 规范摘录：运行时约束',
    '',
    specSection('01-技术选型.md', '### SSR'),
    '',
    '## 规范摘录：验收分档',
    '',
    specSection('06-工程规范.md', '### 5.4 SSR / 消费方'),
    '',
    '## 相关页面',
    '',
    '- [根入口与全部子路径](../exports/root.md)',
    '- [Vite 消费](../guides/vite.md) · [Webpack 5 消费](../guides/webpack.md) · [Rspack 消费](../guides/rspack.md)',
  ];

  return [
    {
      path: 'llms/guides/getting-started.md',
      title: '# 快速开始',
      kind: 'guides',
      summary:
        catalog.guidePages[0]?.description ?? '安装、引入 CSS、ConfigProvider 与三端构建器接入。',
      body: `${gettingStarted.join('\n')}\n`,
    },
    {
      path: 'llms/guides/ssr.md',
      title: '# SSR 与 Hydration',
      kind: 'guides',
      summary:
        'SSR 可用的双构建约束、验收命令、真实 SolidStart 服务端入口与 01 / 02 / 06 规范摘录。',
      body: `${ssr.join('\n')}\n`,
    },
  ];
};

const buildDemoPages = () =>
  catalog.components.flatMap((component) =>
    component.demos.map((demo) => {
      const source = demoSources[`${component.slug}-${demo.name}`];
      if (!source || source.path !== demo.path) {
        throw new Error(
          `[generate-llms] Demo 生成物缺失或路径不一致：${component.slug}-${demo.name}`,
        );
      }
      const parts = [
        `# ${component.title} · ${demo.title}（源码）`,
        '',
        banner(`\`${demo.path}\`（与文档站渲染 / 展示 / 截图基线同源）`),
        '',
        '## 说明',
        '',
        demo.description,
        '',
        '## 完整源码',
        '',
        codeBlock('tsx', source.source),
        '',
        '## 相关页面',
        '',
        component.hasApi
          ? `- [${component.title} API](../exports/${component.slug}.md)`
          : '- [基础组件总览](../exports/root.md)',
        '- [设计 Token](../design/tokens.md)',
      ];
      return {
        path: `llms/demos/${component.slug}-${demo.name}.md`,
        title: `# ${component.title} · ${demo.title}（源码）`,
        kind: 'demos',
        summary: demo.description,
        body: `${parts.join('\n')}\n`,
      };
    }),
  );

const buildIndex = (pages) => {
  const parts = [
    `# ${REPO_NAME} 组件库总览`,
    '',
    banner('`generated/catalog.json` + `packages/core/package.json` + `docs/01~07`'),
    '',
    '## 概要',
    '',
    `SolidJS 企业级中后台组件库 \`${REPO_NAME}\`（主 npm 包 \`${PACKAGE_BASE}\`，兄弟包 \`${PACKAGE_BASE}-icons\` / \`${PACKAGE_BASE}-tokens\`，CSS 前缀 \`scui-\`）。当前版本 \`${corePkg.version}\`，公开包 \`${corePkg.name}\` 共 ${Object.keys(corePkg.exports).length} 个 exports 子路径、${catalog.components.filter((item) => item.hasApi).length} 个组件页、${catalog.components.reduce((sum, item) => sum + item.demos.length, 0)} 个 Demo。`,
    '',
    '## 关键约定',
    '',
    "- **样式显式引入**：JS 不隐式加载 CSS，需 `import 'solid-craft/styles.css'`，变量统一为 `--scui-*` 前缀。",
    '- **状态由 `data-*` 驱动**：组件不叠加 modifier class，样式按属性选择器命中。',
    '- **双构建 / `"solid"` 条件**：`dist/source/*.jsx` 保留 JSX 供消费方按 SSR / CSR 目标编译，`dist/esm/*.js` 为编译后产物。',
    '- **响应式契约**：Props 可为值或 Accessor，组件内部统一用 `resolveValue()` 读取。',
    '- **无障碍**：语义色按 03 §3.1 的 7 档 WCAG21 对比度在构建期校验，不达标即构建失败。',
    '',
    '## 语义色速查',
    '',
    renderSemanticSummary(),
    '',
    '## 组件与子路径',
    '',
    '| 组件 | 子路径 | 说明 |',
    '| --- | --- | --- |',
    ...catalog.components
      .filter((item) => item.exportPath)
      .map(
        (item) =>
          `| [${item.title}](exports/${item.slug}.md) | \`${item.exportPath}\` | ${cell(item.description)} |`,
      ),
    '',
    '- [ConfigProvider 全局配置](exports/config-provider.md) · [样式](exports/styles-css.md) · [按组件样式通配](exports/styles.md) · [package.json](exports/package-json.md)',
    '',
    '## 指南与设计',
    '',
    ...pages
      .filter((page) => page.kind === 'guides' || page.kind === 'design')
      .map((page) => `- [${page.title.slice(2)}](${page.path.replace(/^llms\//, '')})`),
    '',
    '## 规范摘录',
    '',
    specSection('01-技术选型.md', '## 1. 背景与约束'),
  ];
  return {
    path: 'llms/index.md',
    title: `# ${REPO_NAME} 组件库总览`,
    kind: 'index',
    summary: '组件库总览、关键约定、语义色速查与全部组件子路径索引。',
    body: `${parts.join('\n')}\n`,
  };
};

/** 从正文里抽出所有 markdown 链接目标（忽略纯锚点）。 */
const extractLinks = (text) =>
  [...text.matchAll(/\]\(([^)]+)\)/g)]
    .map((match) => match[1]?.trim() ?? '')
    .filter((href) => href.length > 0 && !href.startsWith('#') && !href.startsWith('http'));

const linkTarget = (fromRel, href) => {
  const withoutAnchor = href.split('#')[0];
  if (withoutAnchor.length === 0) return null;
  const target = posix.normalize(posix.join(posix.dirname(fromRel), withoutAnchor));
  return target.startsWith('..') ? null : target;
};

const pages = [
  ...Object.keys(corePkg.exports).map(buildExportPage),
  ...buildDesignPages(),
  ...buildGuidePages(),
  ...buildConsumerPages(),
  ...buildDemoPages(),
];
const indexPage = buildIndex(pages);
const allPages = [indexPage, ...pages];

const linkLine = (page, description) =>
  `- [${page.title.replace(/^# /, '').replaceAll('`', '')}](${page.path}): ${description}`;

const indexDescription = (page) => {
  if (page.kind === 'index') return '组件库总览、关键约定、语义色速查与全部组件子路径索引。';
  if (page.kind === 'exports') return 'exports 子路径的条件导出、API 表与引入方式。';
  if (page.kind === 'guides') return '由真实配置与规范章节生成的接入指南。';
  if (page.kind === 'design') return '设计维度的规范摘录与当前语义 Token 真实值。';
  return '组件 Demo 的完整 TSX 源码（与文档站渲染同源）。';
};

const corePages = allPages.filter((page) => page.kind !== 'demos');
const demoPages = allPages.filter((page) => page.kind === 'demos');

const llmsTxt = [
  `# ${REPO_NAME}`,
  '',
  `> SolidJS 企业级中后台组件库 \`${REPO_NAME}\`（npm 包 \`${corePkg.name}\` v${corePkg.version}，MIT，CSS 前缀 \`scui-\`）。面向企业内部业务系统，状态由 \`data-*\` 驱动，样式需显式引入，语义色在构建期按 WCAG21 分档校验。`,
  '> 同时提供编译后 ESM 与保留 JSX 的 `"solid"` 条件产物，SSR 可 renderToString + hydrate。本文件遵循 llmstxt.org；链接相对站点根，逐页为 LLM 友好的 Markdown，完整合并版见 llms-full.txt。',
  `> Package: \`${corePkg.name}@${corePkg.version}\` · 本文件随 NPM 包发布，版本与所安装版本一致；Agent 可用 \`import.meta.resolve('${corePkg.name}/package.json')\` 定位同目录副本。`,
  `> 包内仅发布索引 / 全量合并正文 / manifest 三个文件；\`## Docs\` 的逐页链接为文档站相对路径，离线请直接读同目录 \`llms-full.txt\`（含全部 ${allPages.length} 页正文、API 表、Demo 源码、Token 与三端消费指南）。`,
  '',
  '## Docs',
  '',
  ...corePages.map((page) => linkLine(page, page.summary ?? indexDescription(page))),
  '',
  '## Optional',
  '',
  '- [llms-full.txt（完整合并文档）](llms-full.txt): 所有页面的正文合并，含全部 API 表、Demo 源码、Token、SSR 与三端消费指南。',
  ...demoPages.map((page) => linkLine(page, page.summary ?? indexDescription(page))),
  '',
].join('\n');

/** full 文档：把每页内部链接按该页所在目录重写成站点根相对链接，避免合并后死链。 */
const inlineBody = (page) =>
  page.body.replace(/\]\(([^)]+)\)/g, (match, href) => {
    if (href.startsWith('#') || href.startsWith('http')) return match;
    const withoutAnchor = href.split('#')[0];
    const anchor = href.includes('#') ? href.slice(href.indexOf('#')) : '';
    const target = posix.normalize(posix.join(posix.dirname(page.path), withoutAnchor));
    return `](${target}${anchor})`;
  });
const llmsFullTxt = [
  `# ${REPO_NAME} · 完整文档（llms-full.txt）`,
  '',
  `> 由 \`pnpm generate:llms\` 生成。版本 ${corePkg.version}，共 ${allPages.length} 页；页面顺序与 /llms.txt 的 Docs + Optional 一致，逐页源文件见 HTML 注释。`,
  '',
  '---',
  '',
  ...allPages.flatMap((page) => [
    `<!-- source: ${page.path} -->`,
    '',
    inlineBody(page).trimEnd(),
    '',
    '---',
    '',
  ]),
].join('\n');

/** L1 随包发布的三个平铺文件；名字必须出现在 core/package.json#files 里才会进 tarball。 */
const packageDocNames = ['llms.txt', 'llms-full.txt', 'llms-manifest.json'];

const manifest = {
  version: corePkg.version,
  package: corePkg.name,
  index: 'llms.txt',
  full: 'llms-full.txt',
  pageCount: allPages.length,
  packageDocs: packageDocNames,
  pages: allPages.map((page) => ({ path: page.path, title: page.title, kind: page.kind })),
  exports: Object.fromEntries(Object.keys(corePkg.exports).map((key) => [key, exportPage(key)])),
  links: extractLinks(llmsTxt),
  requiredSections: ['SSR 与 Hydration', 'Webpack 5 消费', 'Rspack 消费', 'Vite 消费', 'Token'],
};

const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;

const files = new Map([
  ['llms.txt', llmsTxt],
  ['llms-full.txt', llmsFullTxt],
  ['llms/manifest.json', manifestJson],
  ...allPages.map((page) => [page.path, page.body]),
]);

/** 站点索引 / 全量正文 / manifest 的逐字副本，落到 packages/core 根目录随包发布。 */
const packageFiles = new Map([
  ['llms.txt', llmsTxt],
  ['llms-full.txt', llmsFullTxt],
  ['llms-manifest.json', manifestJson],
]);

/** 结构 / 死链 / 孤儿 / 覆盖率 / full 完整性校验，生成与 check 两条路径共用。 */
const validate = (readOutput) => {
  const errors = [];
  const indexText = readOutput('llms.txt');
  const fullText = readOutput('llms-full.txt');

  if (!indexText.startsWith(`# ${REPO_NAME}\n`)) errors.push('llms.txt 缺少 H1 项目名');
  if (!/^> .+/m.test(indexText)) errors.push('llms.txt 缺少 blockquote 摘要');
  const versionHeader = `> Package: \`${corePkg.name}@${corePkg.version}\``;
  if (!indexText.includes(versionHeader)) {
    errors.push(`llms.txt 版本头与 core/package.json 不一致（期望 ${versionHeader}）`);
  }
  const declaredFiles = Array.isArray(corePkg.files) ? corePkg.files : [];
  for (const name of packageDocNames) {
    if (!declaredFiles.includes(name)) {
      errors.push(`core/package.json#files 缺少 ${name}：L1 包内文档不会进 tarball`);
    }
  }
  if (!indexText.includes('\n## Docs\n')) errors.push('llms.txt 缺少 ## Docs');
  if (!indexText.includes('\n## Optional\n')) errors.push('llms.txt 缺少 ## Optional');
  const linkLines = [...indexText.matchAll(/^- \[[^\]]+\]\([^)]+\): .+$/gm)];
  if (linkLines.length === 0) errors.push('llms.txt 没有合规的 `- [title](url): 说明` 链接行');

  const linked = new Set();
  for (const [fromRel, text] of [
    ['llms.txt', indexText],
    ['llms-full.txt', fullText],
    ...allPages.map((page) => [page.path, readOutput(page.path)]),
  ]) {
    for (const href of extractLinks(text)) {
      const target = linkTarget(fromRel, href);
      if (!target) {
        errors.push(`${fromRel}: 链接越界 ${href}`);
        continue;
      }
      if (!files.has(target) && !existsSync(join(publicRoot, target))) {
        errors.push(`${fromRel}: 死链 ${href} → ${target}`);
        continue;
      }
      if (fromRel === 'llms.txt') linked.add(target);
    }
  }

  for (const page of allPages) {
    if (!linked.has(page.path)) errors.push(`孤儿页（未被 llms.txt 链接）：${page.path}`);
    if (!fullText.includes(inlineBody(page).trimEnd())) {
      errors.push(`llms-full.txt 缺少页面正文：${page.path}`);
    }
  }
  if (!linked.has('llms-full.txt')) errors.push('llms-full.txt 未被 llms.txt 链接');

  for (const key of Object.keys(corePkg.exports)) {
    const page = exportPage(key);
    if (!files.has(page)) errors.push(`exports 子路径 ${key} 缺页面 ${page}`);
    if (!linked.has(page)) errors.push(`exports 子路径 ${key} 未被 llms.txt 链接`);
  }
  for (const section of manifest.requiredSections) {
    if (!fullText.includes(section)) errors.push(`llms-full.txt 缺少必需章节：${section}`);
  }
  for (const api of Object.values(apis)) {
    for (const iface of api.interfaces) {
      if (!fullText.includes(iface.name)) errors.push(`llms-full.txt 缺少 API 表：${iface.name}`);
    }
  }
  for (const demo of Object.values(demoSources)) {
    if (!fullText.includes(demo.source.trimEnd())) {
      errors.push(`llms-full.txt 缺少 Demo 源码：${demo.path}`);
    }
  }
  return { errors, linked, linkLines: linkLines.length };
};

// 手工静态资产目录：不属于 llms 生成物，既不判孤儿也不得被 generate 模式删除。
const STATIC_ASSET_DIRS = ['fonts/'];
const diskFiles = () => {
  const found = [];
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
        continue;
      }
      const rel = relative(publicRoot, abs).replaceAll('\\', '/');
      const isStaticAsset = STATIC_ASSET_DIRS.some((prefix) => rel.startsWith(prefix));
      if (!isStaticAsset && /\.(md|txt|json)$/.test(entry.name)) found.push(rel);
    }
  };
  walk(publicRoot);
  return found;
};

/** 包内 llms 相关文件（只扫 core 根目录，不递归，避免误删 dist 产物）。 */
const coreDocFiles = () =>
  existsSync(coreRoot)
    ? readdirSync(coreRoot, { withFileTypes: true })
        .filter((entry) => entry.isFile() && /^llms.*\.(txt|json)$/.test(entry.name))
        .map((entry) => entry.name)
    : [];

if (checkOnly) {
  const stale = [];
  for (const [name, content] of files) {
    const abs = join(publicRoot, name);
    if (!existsSync(abs) || readFileSync(abs, 'utf8') !== content) stale.push(name);
  }
  for (const name of diskFiles()) {
    if (!files.has(name)) stale.push(`${name}（孤儿文件）`);
  }
  for (const [name, content] of packageFiles) {
    const abs = join(coreRoot, name);
    if (!existsSync(abs) || readFileSync(abs, 'utf8') !== content) stale.push(`包内 ${name}`);
  }
  for (const name of coreDocFiles()) {
    if (!packageFiles.has(name)) stale.push(`包内 ${name}（孤儿文件）`);
  }
  const { errors, linked, linkLines } = validate((name) => {
    const abs = join(publicRoot, name);
    return existsSync(abs) ? readFileSync(abs, 'utf8') : '';
  });
  const all = [...stale.map((name) => `生成物与源码不同步：${name}`), ...errors];
  if (all.length > 0) {
    console.error(`[check:llms] ${all.length} 项不合规：`);
    for (const message of all.slice(0, 20)) console.error(`  - ${message}`);
    if (all.length > 20) console.error(`  ... 另有 ${all.length - 20} 项`);
    console.error('[check:llms] 请运行 pnpm generate:llms 后重新提交生成物。');
    process.exit(1);
  }
  console.log(
    `[check:llms] ${files.size} 个站点生成物 + ${packageFiles.size} 个包内副本与源码一致（版本 ${corePkg.version}）；${allPages.length} 页 / ${Object.keys(corePkg.exports).length} 个 exports 子路径 100% 覆盖 / ${linkLines} 条链接行 / ${linked.size} 个链接目标全部可解析 / 0 孤儿页 / 0 死链`,
  );
} else {
  const generated = validate((name) => files.get(name) ?? '');
  if (generated.errors.length > 0) {
    console.error('[generate-llms] 生成结果自检失败：');
    for (const message of generated.errors) console.error(`  - ${message}`);
    process.exit(1);
  }
  for (const [name, content] of files) {
    const abs = join(publicRoot, name);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  for (const name of diskFiles()) {
    if (!files.has(name)) {
      unlinkSync(join(publicRoot, name));
      console.log(`[generate-llms] 清理孤儿文件：${name}`);
    }
  }
  mkdirSync(coreRoot, { recursive: true });
  for (const [name, content] of packageFiles) {
    writeFileSync(join(coreRoot, name), content);
  }
  for (const name of coreDocFiles()) {
    if (!packageFiles.has(name)) {
      unlinkSync(join(coreRoot, name));
      console.log(`[generate-llms] 清理包内孤儿文件：${name}`);
    }
  }
  console.log(
    `[generate-llms] ${files.size} 个站点文件（llms.txt / llms-full.txt / manifest.json + ${allPages.length} 页，${Object.keys(corePkg.exports).length} 个 exports 子路径全覆盖）+ ${packageFiles.size} 个包内副本（版本 ${corePkg.version}）；${generated.linkLines} 条链接行，0 死链，0 孤儿页`,
  );
}
