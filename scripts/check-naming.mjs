/**
 * D-01 正式命名门禁：把「正式名已定，占位名不得再出现在对外产物里」变成机器判据。
 *
 * 背景：Aming 2026-11-08 定名 —— 仓库 solid-craft-ui、主包 solid-craft、
 * 兄弟包 solid-craft-icons / solid-craft-tokens、CSS 前缀 scui-*。
 * docs/01~07 是 v0.3 冻结规范（SHA256 基线保护），正文仍是占位名且不允许改字节；
 * generate-llms.mjs 通过 scripts/naming-legacy.mjs 的映射层翻译摘录，
 * 因此「冻结文件保留占位名」与「对外产物零残留」可以同时成立，本脚本校验后者。
 *
 * 判据：
 *   1. 单点定义：scripts/scope.mjs 的 4 个常量值正确，且与 scope.ts 一致；
 *   2. workspace 全部包名与 PACKAGE_NAMES 逐项一致（含 docs / examples）；
 *   3. CSS 前缀派生一致：源码 SCSS / TSX / 产物 CSS 只用 --scui-*、data-scui-*、.scui-*；
 *   4. 真源零残留：除冻结规范、映射表、本脚本与 lockfile 外，任何真源文本文件不得含
 *      占位名；无扩展名 / 点文件（LICENSE、.npmrc、.gitignore 等）同样纳入扫描；
 *      任意层级的 node_modules / dist / 工具缓存不参与扫描（第三方代码自带 ui-*）；
 *   5. 对外产物零残留：被第 4 步豁免的产物必须逐文件点名复查 —— llms 站点页 / 构建镜像 /
 *      generated / 包内 llms 副本 / dist CSS / scope 编译产物，缺一即红灯；
 *   6. 映射层自证：把冻结规范正文喂给 applyNaming 后零占位名，且生成器确实调用了它；
 *   7. D-01 已由 Aming 勾定（docs/08 §0）。
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  CONFIG_ATTR_PREFIX,
  CSS_PREFIX,
  CSS_VAR_PREFIX,
  PACKAGE_BASE,
  PACKAGE_NAMES,
  REPO_NAME,
} from './scope.mjs';
import { legacyHits } from './naming-legacy.mjs';

const repoRoot = resolve(import.meta.dirname, '..');
const errors = [];
const fail = (message) => errors.push(message);
const read = (rel) =>
  existsSync(join(repoRoot, rel)) ? readFileSync(join(repoRoot, rel), 'utf8') : '';
const readJson = (rel) => (read(rel).length > 0 ? JSON.parse(read(rel)) : {});

/** 占位形态。注意 (?<![\w/-])ui-design(?![/\w-]) 不匹配本地目录名 ui-design/。 */
const LEGACY_PATTERNS = [
  ['@ui-design', /@ui-design/],
  ['--ui-', /--ui-/],
  ['data-ui-', /data-ui-/],
  ['.ui-', /\.ui-/],
  ['unplugin-ui-design', /unplugin-ui-design/],
  ['裸 ui- 前缀', /(?<![\w-])ui-(?!design)/],
  ['品牌名 ui-design', /(?<![\w/-])ui-design(?![/\w-])/],
];
const hitsIn = (text) =>
  LEGACY_PATTERNS.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);

// 1. 单点定义。常量是字面量类型，直接在 `!==` 分支里插值会被 oxlint --type-aware
//    判成 never（restrict-template-expressions）；经对象索引取值后类型变宽。
const EXPECTED_SCOPE = {
  REPO_NAME: 'solid-craft-ui',
  PACKAGE_BASE: 'solid-craft',
  CSS_PREFIX: 'scui-',
  CSS_VAR_PREFIX: '--scui-',
  CONFIG_ATTR_PREFIX: 'data-scui-',
};
const ACTUAL_SCOPE = { REPO_NAME, PACKAGE_BASE, CSS_PREFIX, CSS_VAR_PREFIX, CONFIG_ATTR_PREFIX };
for (const [key, expected] of Object.entries(EXPECTED_SCOPE)) {
  if (ACTUAL_SCOPE[key] !== expected) {
    fail(`${key} 应为 ${expected}，实际 ${String(ACTUAL_SCOPE[key])}`);
  }
}

const scopeTs = read('packages/core/src/scope.ts');
for (const value of [PACKAGE_BASE, CSS_PREFIX]) {
  if (!scopeTs.includes(`'${value}'`)) fail(`scope.ts 缺少单点定义值 '${value}'`);
}

// 2. workspace 包名逐项一致
const pkgPaths = {
  core: 'packages/core/package.json',
  icons: 'packages/icons/package.json',
  tokens: 'packages/tokens/package.json',
  docs: 'apps/docs/package.json',
  'example-vite': 'examples/vite/package.json',
  'example-webpack': 'examples/webpack/package.json',
  'example-rspack': 'examples/rspack/package.json',
  'example-solid-start': 'examples/solid-start/package.json',
  'example-start-real': 'examples/start-real/package.json',
};
for (const [key, rel] of Object.entries(pkgPaths)) {
  const actual = readJson(rel).name;
  const expected = PACKAGE_NAMES[key];
  if (actual !== expected) fail(`${rel}: name 应为 ${expected}，实际 ${actual}`);
}

const rootPkg = readJson('package.json');
if (rootPkg.name !== `${REPO_NAME}-workspace`)
  fail(`根 package.json name 应为 ${REPO_NAME}-workspace，实际 ${rootPkg.name}`);
const changeset = readJson('.changeset/config.json');
for (const name of (changeset.fixed ?? []).flat()) {
  if (!Object.values(PACKAGE_NAMES).includes(name)) fail(`changeset fixed 含未知包名 ${name}`);
}

// 3. 前缀派生一致性（源码 + 产物）
const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    if (statSync(abs).isDirectory()) walk(abs, out);
    else out.push(abs);
  }
  return out;
};
const scssFiles = walk(join(repoRoot, 'packages/core/src')).filter((f) => f.endsWith('.scss'));
for (const abs of scssFiles) {
  const text = readFileSync(abs, 'utf8');
  const rel = abs.slice(repoRoot.length + 1);
  for (const label of hitsIn(text)) fail(`${rel} 含占位形态：${label}`);
}
const distCss = read('packages/core/dist/styles/index.css');
if (distCss.length === 0) fail('dist/styles/index.css 缺失（需先 pnpm build）');
else {
  if (!distCss.includes('--scui-color-primary')) fail('产物 CSS 缺少 --scui-* 变量，前缀未生效');
  for (const label of hitsIn(distCss)) fail(`产物 index.css 含占位形态：${label}`);
}

// 4. 真源零残留（明确豁免清单）
const EXEMPT_EXACT = new Set([
  'scripts/naming-legacy.mjs', // 映射表本身
  'scripts/check-naming.mjs', // 门禁自身
  'scripts/goals.baseline.json', // 哈希基线（无占位名，仍豁免以免误报）
  'pnpm-lock.yaml', // 由 pnpm install 生成
]);
// docs/ 是 v0.3 冻结规范，正文保留占位名，由第 6 步的映射层自证覆盖。
const EXEMPT_PREFIX = ['docs/'];
// 任意层级的依赖副本 / 构建产物 / 工具缓存都不算「真源」：workspace 内的
// node_modules 是 pnpm 软链，第三方库（vite / webpack / @solidjs/start）自身就带
// ui-* 字样，扫它们只会得到永远修不完的假红灯。真正会发布出去的产物在第 5 步
// 逐文件点名校验 —— 豁免不等于放空。
const EXEMPT_SEGMENTS = new Set([
  'node_modules',
  'dist',
  '.git',
  '.turbo',
  '.cache',
  '.artifacts',
  'coverage',
  'playwright-report',
  'test-results',
]);
const skip = (rel) =>
  EXEMPT_EXACT.has(rel) ||
  EXEMPT_PREFIX.some((prefix) => rel.startsWith(prefix)) ||
  rel.split('/').some((segment) => EXEMPT_SEGMENTS.has(segment));
const TEXT_EXT = new Set([
  '.ts',
  '.tsx',
  '.mjs',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.scss',
  '.css',
  '.html',
  '.yml',
  '.yaml',
]);
// 无扩展名 / 点文件同样是会推到 public 仓库的对外产物。2026-11-09 首次推送后
// 发现 LICENSE 仍写「Copyright (c) 2026 ui-design contributors」，而按「最后一个
// 点之后的后缀」过滤会把 LICENSE、.npmrc、.gitignore 一起漏掉。这里显式纳入。
const NO_EXT_TEXT = new Set([
  'LICENSE',
  'NOTICE',
  'AUTHORS',
  'CHANGELOG',
  '.gitignore',
  '.npmrc',
  '.node-version',
  '.nvmrc',
  '.prettierignore',
  '.editorconfig',
  '.gitattributes',
  '.dockerignore',
]);
const BINARY_EXT = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.pdf',
  '.zip',
  '.tgz',
  '.gz',
  '.wasm',
  '.node',
]);
const textLike = (rel) => {
  const base = rel.split('/').at(-1) ?? '';
  const ext = `.${base.split('.').at(-1)}`.toLowerCase();
  return !BINARY_EXT.has(ext) && (NO_EXT_TEXT.has(base) || TEXT_EXT.has(ext));
};
const allText = walk(repoRoot)
  .map((abs) => abs.slice(repoRoot.length + 1))
  .filter(textLike)
  .filter((rel) => !skip(rel));
let scanned = 0;
for (const rel of allText) {
  const labels = hitsIn(read(rel));
  if (labels.length > 0) fail(`${rel} 残留占位名：${labels.join(' / ')}`);
  scanned += 1;
}

// 5. 对外产物逐文件点名校验（第 4 步跳过 dist / node_modules，这里把「会发出去的东西」补回来）
const pageDir = join(repoRoot, 'apps/docs/public/llms');
const pages = walk(pageDir).filter((file) => file.endsWith('.md'));
const pageCount = pages.length;
if (pageCount < 30) fail(`llms 逐页 Markdown 仅 ${pageCount} 页（应 ≥30），产物可能未生成`);
for (const abs of pages) {
  const rel = abs.slice(repoRoot.length + 1);
  for (const label of hitsIn(readFileSync(abs, 'utf8'))) fail(`${rel} 含占位形态：${label}`);
}
// 文档站 build 产物是 public/llms 的镜像，逐页再扫一遍，防止 build 产物回退。
const builtPages = walk(join(repoRoot, 'apps/docs/dist/llms')).filter((file) =>
  file.endsWith('.md'),
);
for (const abs of builtPages) {
  const rel = abs.slice(repoRoot.length + 1);
  for (const label of hitsIn(readFileSync(abs, 'utf8'))) fail(`${rel} 含占位形态：${label}`);
}
const requiredClean = [
  'apps/docs/public/llms.txt',
  'apps/docs/public/llms-full.txt',
  'apps/docs/public/llms/manifest.json',
  'packages/core/llms.txt',
  'packages/core/llms-full.txt',
  'packages/core/llms-manifest.json',
  'packages/core/dist/styles/index.css',
  'packages/core/dist/esm/scope.js',
  'packages/core/dist/types/scope.d.ts',
];
for (const rel of requiredClean) {
  if (!existsSync(join(repoRoot, rel))) {
    fail(`对外产物缺失：${rel}`);
    continue;
  }
  for (const label of hitsIn(read(rel))) fail(`对外产物 ${rel} 含占位形态：${label}`);
}
const indexText = read('apps/docs/public/llms.txt');
if (!indexText.startsWith(`# ${REPO_NAME}\n`)) fail('llms.txt H1 不是正式仓库名');
if (!indexText.includes(`> Package: \`${PACKAGE_BASE}@`))
  fail('llms.txt 缺少正式包名的 Package 版本头');
const manifest = readJson('apps/docs/public/llms/manifest.json');
if (manifest.package !== PACKAGE_BASE) fail(`llms manifest.package 应为 ${PACKAGE_BASE}`);

// 6. 映射层自证：冻结规范正文喂给 applyNaming 后零占位
const specDocs = readdirSync(join(repoRoot, 'docs'))
  .filter((name) => /^0[1-7]-.*\.md$/.test(name))
  .toSorted((a, b) => (a < b ? -1 : a > b ? 1 : 0));
for (const name of specDocs) {
  const left = legacyHits(read(`docs/${name}`));
  if (left.length > 0) fail(`映射层未覆盖 docs/${name} 的占位形态：${left.join(' / ')}`);
}
const generator = read('scripts/generate-llms.mjs');
if (!generator.includes('applyNaming')) fail('generate-llms.mjs 未接入映射层 applyNaming');
if (!generator.includes('naming-legacy.mjs'))
  fail('generate-llms.mjs 未引用 scripts/naming-legacy.mjs');

// 7. D-01 决策状态
const todo = read('docs/08-实施Todo.md');
const d01 = todo.split('\n').find((line) => /^\|\s*D-01\s*\|/.test(line)) ?? '';
if (d01.length === 0) fail('无法解析 docs/08 §0 的 D-01 行');
else if (!/\|\s*\[x\]\s*\|\s*$/.test(d01)) fail('D-01 正式命名仍为 [ ]，命名未登记');

if (errors.length > 0) {
  console.error(`[check:naming] ${errors.length} 项不合规：`);
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}
console.log(
  `[check:naming] 正式命名 ${REPO_NAME} / ${PACKAGE_BASE} / ${CSS_PREFIX}* 一致：${Object.keys(pkgPaths).length} 个 workspace 包名 · ${scanned} 个真源文件零残留 · ${pageCount} 页站点 + ${builtPages.length} 页构建镜像 + ${requiredClean.length} 个入口/发布产物零残留 · ${specDocs.length} 份冻结规范映射自证通过 · 产物 CSS 前缀生效 · D-01 已登记`,
);
