/**
 * T1-02 样式基础验收门禁：把「组件模板产出的 data-* 能被 SCSS 命中，无 modifier class 死代码」
 * 从人肉判断变成机器判据，接入 pnpm verify（build 之后执行，因为要读 dist/styles）。
 *
 * 三层校验：
 *   1. 源码层：reset / base / mixins 齐备且非空；mixins 被组件真实 @use；
 *      每个组件 SCSS 都只用 [data-*] 驱动状态，无 .scui-xxx--yyy modifier class。
 *   2. 组件层：SCSS 里出现的每个 data-<attr> 都能在同目录 *.tsx 源码里找到输出，
 *      否则说明样式写了但组件不产出该属性（死选择器）。
 *   3. 产物层：PostCSS 之后 index.css / base.css / reset.css / components/*.css 齐全，
 *      源码里的每个 [data-x='v'] 都仍在 index.css 中（Sass 会去掉引号，故归一化比对）。
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const coreDir = join(repoRoot, 'packages', 'core');
const srcStyles = join(coreDir, 'src', 'styles');
const componentsDir = join(coreDir, 'src', 'components');
const outDir = join(coreDir, 'dist', 'styles');
const errors = [];
const modifierSelector = /\.[a-zA-Z][\w-]*--[\w-]+/;

const read = (abs) => (existsSync(abs) ? readFileSync(abs, 'utf8') : '');
const fail = (message) => errors.push(message);

for (const name of ['reset.scss', 'base.scss', 'mixins.scss']) {
  if (read(join(srcStyles, name)).trim().length === 0) {
    fail(`样式基础缺失或为空：src/styles/${name}`);
  }
}

const componentScss = readdirSync(componentsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => ({
    name: entry.name,
    dir: join(componentsDir, entry.name),
    scss: join(componentsDir, entry.name, `${entry.name}.scss`),
  }))
  .filter((item) => existsSync(item.scss));

if (componentScss.length === 0) fail('未找到任何组件 SCSS');

let mixinUsers = 0;
const sourceValues = new Set();

for (const item of componentScss) {
  const scss = read(item.scss);
  if (/@use\s+['"]mixins['"]/.test(scss)) mixinUsers += 1;
  if (modifierSelector.test(scss)) fail(`${item.name}.scss 出现 modifier class（应只用 [data-*]）`);

  const attrs = [...scss.matchAll(/\[data-([a-z-]+)/g)].map((match) => match[1] ?? '');
  if (attrs.length === 0) fail(`${item.name}.scss 没有 [data-*] 选择器`);
  for (const match of scss.matchAll(/\[data-([a-z-]+)\s*=\s*['"]([^'"]+)['"]\]/g)) {
    sourceValues.add(`data-${match[1]}=${match[2]}`);
  }

  const tsx = readdirSync(item.dir, { withFileTypes: true })
    .filter(
      (entry) => entry.isFile() && entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx'),
    )
    .map((entry) => read(join(item.dir, entry.name)))
    .join('\n');
  for (const attr of new Set(attrs)) {
    if (!tsx.includes(`data-${attr}`)) {
      fail(`${item.name}.scss 使用 data-${attr}，但同目录组件源码未输出该属性`);
    }
  }
}

if (mixinUsers === 0) fail('mixins.scss 未被任何组件 @use（死代码）');

const requiredOutputs = [
  'index.css',
  'base.css',
  'reset.css',
  ...componentScss.map((item) => `components/${item.name}.css`),
];
for (const rel of requiredOutputs) {
  if (read(join(outDir, rel)).trim().length === 0) fail(`构建产物缺失或为空：dist/styles/${rel}`);
}

const collectCss = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const abs = join(dir, entry.name);
        return entry.isDirectory()
          ? collectCss(abs)
          : entry.name.endsWith('.css')
            ? [read(abs)]
            : [];
      })
    : [];
const allCss = collectCss(outDir).join('\n');
if (allCss.length === 0) fail('dist/styles 下没有任何 CSS 产物');

const indexCss = read(join(outDir, 'index.css'));
if (!indexCss.includes('--scui-color-primary')) {
  fail('index.css 未包含 Token 变量（PostCSS custom-properties 配置或 Token 管线异常）');
}
if (modifierSelector.test(allCss)) fail('编译产物出现 modifier class 死代码');

const outputValues = new Set(
  [...indexCss.matchAll(/\[data-([a-z-]+)\s*=\s*['"]?([^'"\]\s]+)['"]?\]/g)].map(
    (match) => `data-${match[1]}=${match[2]}`,
  ),
);
const lost = [...sourceValues].filter((value) => !outputValues.has(value));
if (lost.length > 0) {
  fail(`编译后丢失 ${lost.length} 个 data-* 选择器：${lost.slice(0, 6).join(', ')}`);
}

if (errors.length > 0) {
  console.error(`[check:styles] ${errors.length} 项不合规：`);
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}
console.log(
  `[check:styles] ${componentScss.length} 个组件样式表 / ${mixinUsers} 个 @use mixins / ${sourceValues.size} 个 data-* 取值全部命中组件源码与 index.css / 3 个基础样式文件 / ${requiredOutputs.length} 个产物 / 0 modifier class`,
);
