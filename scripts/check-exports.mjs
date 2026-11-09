import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { CSS_PREFIX, PACKAGE_BASE, PACKAGE_NAMES } from './scope.mjs';

/**
 * 发布门禁（X-02 / X-06 / X-07）：
 * 1. 所有包名、license、包基名 / 前缀单点定义一致；
 * 2. 每个含组件的 exports 子路径同时具备 types / solid / import，且文件真实存在；
 * 3. dist/esm/*.js 与 dist/source/*.jsx 一一对应；
 * 4. 声明文件入口存在；
 * 5. 组件 SCSS 的类名一律使用 CSS_PREFIX（不允许第二套硬编码前缀 / modifier class）。
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

if (errors.length > 0) {
  console.error('[check-exports] FAILED:');
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(
  '[check-exports] OK: scope / MIT / solid+import conditions / esm<->source parity / d.ts',
);
