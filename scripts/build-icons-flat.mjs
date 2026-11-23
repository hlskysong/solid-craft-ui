import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * T4-18：`solid` 条件导出用的分片源码入口。
 *
 * 背景：全量 2317 个图标 = 2024 个实体模块。若 `solid` 条件仍指向逐文件 barrel，
 * Vite dev 会把这 2024 个模块全部拆成独立请求 —— 文档站 eager 加载所有 Demo，
 * 于是每个页面都发 2024 个图标请求，冷启动时 Vite 还要逐个 transform，
 * E2E 批量路由导航因此超时（实测首访 2621 请求 / 723ms warm）。
 *
 * 做法：把已经由 build-source.mjs 擦除类型的 dist/source/generated/*.jsx 合并成
 * `dist/flat-<n>.jsx` 分片，再由 `dist/flat.jsx` 统一 re-export。dev 只需 4~5 个请求；
 * 每片刻意压在 500 KB 以下 —— Babel 对更大的单文件会打 "deoptimised the styling"
 * 性能提示，SSR 冒烟的「0 warning」门禁会因此误报（T4-18 实测）。
 *
 * 该文件只由 `solid` 条件使用；`import` 条件继续指向逐文件 esm 产物，
 * 以保证 packages/icons/dist/esm/generated/<Icon>.js 的单图标体积预算不变。
 */
const repoRoot = resolve(import.meta.dirname, '..');
const pkgDir = join(repoRoot, 'packages', 'icons');
const srcDir = join(pkgDir, 'src');
const sourceGeneratedDir = join(pkgDir, 'dist', 'source', 'generated');
const distDir = join(pkgDir, 'dist');
const CHUNK_BUDGET = 350_000;

const indexSource = readFileSync(join(srcDir, 'index.ts'), 'utf8');
const exportLine = /^export \{ (\w+)(?: as (\w+))? \} from '\.\/generated\/(\w+)';$/;

/** @type {{ local: string, exposed: string, file: string }[]} */
const exports = [];
for (const line of indexSource.split('\n')) {
  const matched = exportLine.exec(line.trim());
  if (matched) {
    exports.push({ local: matched[1], exposed: matched[2] ?? matched[1], file: matched[3] });
  }
}
if (exports.length === 0) throw new Error('[build-icons-flat] 无法从 src/index.ts 解析导出清单');

const entityNames = [...new Set(exports.map((item) => item.local))].sort();
const exportsByEntity = new Map();
for (const item of exports) {
  if (!exportsByEntity.has(item.local)) exportsByEntity.set(item.local, []);
  exportsByEntity.get(item.local).push(item);
}

// macOS 大小写不敏感，letters 的实体文件叫 LettersAll.jsx（FILE_NAME_OVERRIDE）。
const fileNames = [...new Set(exports.map((item) => item.file))];
const generatedFiles = new Set(
  readdirSync(sourceGeneratedDir)
    .filter((file) => file.endsWith('.jsx'))
    .map((file) => file.replace(/\.jsx$/, '')),
);
const missing = fileNames.filter((name) => !generatedFiles.has(name));
if (missing.length > 0) {
  throw new Error(
    `[build-icons-flat] 缺少 ${missing.length} 个 source 产物（请先 build-source）：${missing.slice(0, 5).join(', ')}`,
  );
}

const definitions = new Map();
for (const name of entityNames) {
  const record = exportsByEntity.get(name)?.[0];
  if (!record) throw new Error(`[build-icons-flat] 找不到 ${name} 的导出记录`);
  const code = readFileSync(join(sourceGeneratedDir, `${record.file}.jsx`), 'utf8');
  // build-source 的每条产物形态固定：一行 splitProps import + 函数体 + `var X_default` 尾段。
  const body = code
    .replace(/^import \{ splitProps \} from "solid-js";\n/, '')
    .replace(/var \w+_default = [\s\S]*$/u, '')
    .trimEnd();
  if (!body.startsWith(`function ${name}(props)`)) {
    throw new Error(`[build-icons-flat] ${record.file}.jsx 结构变化，拒绝生成`);
  }
  definitions.set(name, body);
}

const version = /export const ICONS_PACKAGE_VERSION = '([^']+)'/.exec(indexSource)?.[1];
const total = /export const ICON_TOTAL = (\d+)/.exec(indexSource)?.[1];
const nameTotal = /export const ICON_NAME_TOTAL = (\d+)/.exec(indexSource)?.[1];
if (!version || !total || !nameTotal) {
  throw new Error('[build-icons-flat] 无法解析版本 / 数量常量');
}

const asLine = (item) =>
  item.local === item.exposed ? `  ${item.exposed},` : `  ${item.local} as ${item.exposed},`;

const chunks = [];
/** @type {{ entities: string[], items: typeof exports, bytes: number }} */
let current = { entities: [], items: [], bytes: 0 };
for (const name of entityNames) {
  const body = definitions.get(name);
  const bytes = Buffer.byteLength(body) + 1;
  if (current.entities.length > 0 && current.bytes + bytes > CHUNK_BUDGET) {
    chunks.push(current);
    current = { entities: [], items: [], bytes: 0 };
  }
  current.entities.push(body);
  current.items.push(...exportsByEntity.get(name));
  current.bytes += bytes;
}
if (current.entities.length > 0) chunks.push(current);

const chunkFiles = [];
for (const [index, chunk] of chunks.entries()) {
  const fileName = `flat-${index + 1}.jsx`;
  const source = [
    '/**',
    ` * solid-craft-icons solid 条件分片 ${index + 1}/${chunks.length}（由 build-icons-flat.mjs 生成，请勿手改）。`,
    ' */',
    'import { splitProps } from "solid-js";',
    '',
    ...chunk.entities.map((definition) => `${definition}\n`),
    'export {',
    ...chunk.items.map(asLine),
    '};',
    '',
  ].join('\n');
  writeFileSync(join(distDir, fileName), source);
  chunkFiles.push({ fileName, items: chunk.items, bytes: Buffer.byteLength(source) });
  if (Buffer.byteLength(source) >= 500_000) {
    throw new Error(`[build-icons-flat] ${fileName} 超过 Babel 500 KB 性能提示阈值`);
  }
}

const barrel = [
  '/**',
  ' * solid-craft-icons solid 条件入口（由 scripts/build-icons-flat.mjs 生成，请勿手改）。',
  ` * ${entityNames.length} 个实体 + ${exports.length - entityNames.length} 个 alias，分 ${chunks.length} 片以避开 Babel 大文件提示。`,
  ' */',
  `export const ICONS_PACKAGE_VERSION = "${version}";`,
  `export const ICON_TOTAL = ${total};`,
  `export const ICON_NAME_TOTAL = ${nameTotal};`,
  '',
  ...chunkFiles.map(
    ({ fileName, items }) =>
      `export { ${items.map((item) => (item.local === item.exposed ? item.exposed : `${item.local} as ${item.exposed}`)).join(', ')} } from "./${fileName}";`,
  ),
  '',
].join('\n');
writeFileSync(join(distDir, 'flat.jsx'), barrel);

const compareNames = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const covered = chunkFiles
  .flatMap((chunk) => chunk.items.map((item) => item.exposed))
  .toSorted(compareNames);
const expected = exports.map((item) => item.exposed).toSorted(compareNames);
if (covered.length !== expected.length || covered.some((name, index) => name !== expected[index])) {
  throw new Error('[build-icons-flat] 分片导出名与 src/index.ts 不一致');
}

console.log(
  `[build-icons-flat] ${entityNames.length} entities + ${exports.length - entityNames.length} aliases -> ${chunks.length} chunks (${chunkFiles.map((chunk) => `${chunk.fileName} ${(chunk.bytes / 1024).toFixed(0)} KB`).join(', ')}) + flat.jsx`,
);
