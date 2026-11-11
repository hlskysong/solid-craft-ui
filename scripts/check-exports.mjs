import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { CSS_PREFIX, PACKAGE_BASE, PACKAGE_NAMES } from './scope.mjs';

/**
 * 发布门禁（X-02 / X-06 / X-07）：
 * 1. 所有包名、license、包基名 / 前缀单点定义一致；
 * 2. 每个含组件的 exports 子路径同时具备 types / solid / import，且文件真实存在；
 * 3. dist/esm/*.js 与 dist/source/*.jsx 一一对应；
 * 4. 声明文件入口存在；
 * 5. 组件 SCSS 的类名一律使用 CSS_PREFIX（不允许第二套硬编码前缀 / modifier class）；
 * 6. 声明文件类型隔离（T2-01）：dist/types 全域不得出现第三方无头库包名。
 *    原语层（src/primitives）是 Kobalte 与组件库之间的唯一接缝，公共 `.d.ts` 里
 *    一旦出现 `@kobalte/` 之类的引用，换实现库就会变成消费方的破坏性变更。
 */
const repoRoot = resolve(import.meta.dirname, '..');
const errors = [];

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

const listBuilt = (dir, extension) => {
  if (!existsSync(dir)) return new Set();
  const result = new Set();
  const walk = (current) => {
    for (const name of readdirSync(current)) {
      const full = join(current, name);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!name.endsWith(extension)) continue;
      const rel = full
        .slice(dir.length + 1)
        .split(sep)
        .join('/');
      result.add(rel.slice(0, -extension.length));
    }
  };
  walk(dir);
  return result;
};

for (const pkg of ['core', 'icons', 'tokens']) {
  const dir = join(repoRoot, 'packages', pkg);
  const pj = readJson(join(dir, 'package.json'));
  const expected = PACKAGE_NAMES[pkg];
  if (pj.name !== expected) {
    errors.push(`${pkg}: name should be ${expected}, got ${pj.name}`);
  }
  if (pj.license !== 'MIT') {
    errors.push(`${pkg}: license should be MIT, got ${pj.license}`);
  }
}

const scopeTs = readFileSync(join(repoRoot, 'packages', 'core', 'src', 'scope.ts'), 'utf8');
if (!scopeTs.includes(`'${PACKAGE_BASE}'`)) {
  errors.push(`core/src/scope.ts does not use PACKAGE_BASE=${PACKAGE_BASE}`);
}
if (!scopeTs.includes(`'${CSS_PREFIX}'`)) {
  errors.push(`core/src/scope.ts does not use CSS_PREFIX=${CSS_PREFIX}`);
}

const listScss = (dir) => {
  if (!existsSync(dir)) return [];
  const result = [];
  const walk = (current) => {
    for (const name of readdirSync(current)) {
      const full = join(current, name);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (name.endsWith('.scss')) result.push(full);
    }
  };
  walk(dir);
  return result;
};

for (const file of listScss(join(repoRoot, 'packages', 'core', 'src', 'components'))) {
  const content = readFileSync(file, 'utf8');
  const classes = [...content.matchAll(/(?:^|[^\w-])\.([a-zA-Z][\w-]*)/g)].map((match) => match[1]);
  for (const cls of new Set(classes)) {
    if (!cls.startsWith(CSS_PREFIX)) {
      errors.push(`${file.slice(repoRoot.length + 1)}: .${cls} must start with ${CSS_PREFIX}`);
    }
  }
}

for (const pkg of ['core', 'icons']) {
  const dir = join(repoRoot, 'packages', pkg);
  const pj = readJson(join(dir, 'package.json'));
  const exportsMap = pj.exports ?? {};

  for (const [key, value] of Object.entries(exportsMap)) {
    if (typeof value !== 'object' || value === null) continue;
    // 只有「含组件」的子路径（带 solid 条件）才必须三条件齐全；
    // CSS / 元数据等对象条目只需校验它声明的目标文件真实存在。
    const conditions =
      'solid' in value ? ['types', 'solid', 'import', 'default'] : Object.keys(value);
    for (const condition of conditions) {
      const target = value[condition];
      if (!target) {
        errors.push(`${pkg} exports["${key}"] missing "${condition}" condition`);
        continue;
      }
      if (typeof target !== 'string') continue;
      if (!existsSync(join(dir, target))) {
        errors.push(`${pkg} exports["${key}"].${condition} -> missing file ${target}`);
      }
    }
  }

  const esm = listBuilt(join(dir, 'dist', 'esm'), '.js');
  const source = listBuilt(join(dir, 'dist', 'source'), '.jsx');
  for (const rel of esm) {
    if (!source.has(rel))
      errors.push(`${pkg}: dist/source/${rel}.jsx missing (has dist/esm/${rel}.js)`);
  }
  for (const rel of source) {
    if (!esm.has(rel))
      errors.push(`${pkg}: dist/esm/${rel}.js missing (has dist/source/${rel}.jsx)`);
  }

  const typesEntry = exportsMap['.']?.types;
  if (!typesEntry || !existsSync(join(dir, typesEntry))) {
    errors.push(`${pkg}: missing declaration entry dist/types/index.d.ts`);
  }
}

// 6. 声明文件类型隔离：公共 .d.ts 不得引用第三方无头库（换库即破坏消费方类型）
//    只看真实的模块引用（`from '...'` / `import('...')`），不看注释文本 ——
//    注释里写「不得出现 @kobalte/」属于约束说明，不是泄漏，按纯字符串匹配会误报。
const THIRD_PARTY_TYPE_REFS = ['@kobalte/', '@tanstack/', '@internationalized/', '@floating-ui/'];
const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const typeRefPatterns = THIRD_PARTY_TYPE_REFS.map((ref) => ({
  ref,
  pattern: new RegExp(`(?:\\bfrom|\\bimport\\()\\s*['"]${escapeRe(ref)}`),
}));
const typesRoot = join(repoRoot, 'packages', 'core', 'dist', 'types');
const declarationFiles = [];
const walkDeclarations = (dir) => {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walkDeclarations(full);
      continue;
    }
    if (name.endsWith('.d.ts')) declarationFiles.push(full);
  }
};
walkDeclarations(typesRoot);
if (declarationFiles.length === 0) {
  // 构建未产出声明时，上面第 4 条已报缺入口；这里再堵一次「判据空转」的假 PASS
  errors.push('packages/core/dist/types 无任何 .d.ts（类型隔离判据无从校验，先跑 pnpm build）');
}
for (const file of declarationFiles) {
  const content = readFileSync(file, 'utf8');
  for (const { ref, pattern } of typeRefPatterns) {
    if (pattern.test(content)) {
      errors.push(
        `${file.slice(repoRoot.length + 1)} 引用第三方类型 ${ref}（原语层须在 .d.ts 边界收敛实现细节）`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error('[check-exports] FAILED:');
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(
  `[check-exports] OK: scope / MIT / solid+import conditions / esm<->source parity / d.ts / 类型隔离（${declarationFiles.length} 个声明文件零第三方引用）`,
);
