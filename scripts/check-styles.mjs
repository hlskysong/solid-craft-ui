/**
 * T1-02 样式基础验收门禁：把「组件模板产出的 data-* 能被 SCSS 命中，无 modifier class 死代码」
 * 从人肉判断变成机器判据，接入 pnpm verify（build 之后执行，因为要读 dist/styles）。
 *
 * 四层校验：
 *   1. 源码层：reset / base / mixins 齐备且非空；mixins 被组件真实 @use；
 *      每个组件 SCSS 都只用 [data-*] 驱动状态，无 .scui-xxx--yyy modifier class。
 *   2. 组件层：SCSS 里出现的每个 data-<attr> 都能在同目录 *.tsx 源码里找到输出，
 *      否则说明样式写了但组件不产出该属性（死选择器）。
 *   3. 产物层：PostCSS 之后 index.css / base.css / reset.css / components/*.css 齐全，
 *      源码里的每个 [data-x='v'] 都仍在 index.css 中（Sass 会去掉引号，故归一化比对）。
 *   4. 命名层（R1 = B，Aming 2026-11-11 裁决）：src 内禁止裸 data-*，只允许
 *      `data-<CSS_PREFIX>*`；`data-testid` / `data-hk` 是行业通用测试锚点与 Solid
 *      hydration key，白名单放行。同时每个带 [data-*] 的 SCSS 选择器，其**解析后**
 *      的完整选择器必须被 `.scui-` 静态类作用域覆盖（含 `&` 嵌套与 @media 包裹），
 *      否则裸属性可以被宿主任意全局样式改到，B 的防污染动机就没闭环。
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CSS_PREFIX } from './scope.mjs';

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

// ---- 第 4 层：R1 命名与作用域契约（Aming 2026-11-11 裁决「R1 = B」）----

const DATA_PREFIX = `data-${CSS_PREFIX}`;
const DATA_ALLOWLIST = new Set(['data-testid', 'data-hk']);
const SCAN_EXTS = new Set(['.ts', '.tsx', '.css', '.scss']);
const DATA_TOKEN = /data-[a-z][a-z0-9-]*/g;

if (String(DATA_PREFIX) !== 'data-scui-') {
  fail(`data 属性前缀与 CSS_PREFIX 不同源：期望 data-scui-，实际 ${String(DATA_PREFIX)}`);
}

const walkFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : walkFiles(abs);
    return SCAN_EXTS.has(entry.name.slice(entry.name.lastIndexOf('.'))) ? [abs] : [];
  });

// 4a. src 内禁止裸 data-*（data-testid / data-hk 白名单）
const srcFiles = walkFiles(join(coreDir, 'src'));
const bareHits = [];
for (const abs of srcFiles) {
  const text = read(abs);
  for (const match of text.matchAll(DATA_TOKEN)) {
    const attr = match[0];
    if (attr.startsWith(DATA_PREFIX) || DATA_ALLOWLIST.has(attr)) continue;
    const line = text.slice(0, match.index).split('\n').length;
    bareHits.push(`${abs.slice(coreDir.length + 1)}:${line} ${attr}`);
  }
}
if (bareHits.length > 0) {
  fail(
    `src 内出现 ${bareHits.length} 处裸 data-*（应统一 ${DATA_PREFIX}*，白名单仅 data-testid / data-hk）：` +
      `${bareHits.slice(0, 6).join(' / ')}${bareHits.length > 6 ? ' …' : ''}`,
  );
}

// 4b. SCSS：每个 [data-*] 选择器解析后必须被 .scui- 静态类作用域覆盖
const parseScssRules = (text) => {
  const rules = [];
  const stack = [];
  let buf = '';
  let line = 1;
  let i = 0;
  let quote = null;
  let inBlockComment = false;
  let inLineComment = false;

  while (i < text.length) {
    const ch = text[i];
    if (ch === '\n') {
      line += 1;
      i += 1;
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && text[i + 1] === '/') {
        inBlockComment = false;
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }
    if (inLineComment) {
      i += 1;
      continue;
    }
    if (quote) {
      if (ch === '\\') {
        buf += text.slice(i, i + 2);
        i += 2;
        continue;
      }
      if (ch === quote) quote = null;
      buf += ch;
      i += 1;
      continue;
    }
    if (ch === '/' && text[i + 1] === '*') {
      inBlockComment = true;
      i += 2;
      continue;
    }
    if (ch === '/' && text[i + 1] === '/') {
      inLineComment = true;
      i += 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      buf += ch;
      i += 1;
      continue;
    }
    if (ch === '{') {
      const raw = buf.trim();
      const isAtRule = raw.startsWith('@');
      const parent = [...stack].toReversed().find((entry) => !entry.atRule);
      let selector = raw;
      if (!isAtRule && parent) {
        selector = raw.includes('&')
          ? raw.replaceAll('&', parent.selector)
          : `${parent.selector} ${raw}`;
      }
      const rule = { selector, atRule: isAtRule, line };
      rules.push(rule);
      stack.push(rule);
      buf = '';
      i += 1;
      continue;
    }
    if (ch === '}') {
      stack.pop();
      buf = '';
      i += 1;
      continue;
    }
    if (ch === ';') {
      buf = '';
      i += 1;
      continue;
    }
    buf += ch;
    i += 1;
  }
  return rules;
};

const allScss = walkFiles(join(coreDir, 'src')).filter((abs) => abs.endsWith('.scss'));
let dataSelectorCount = 0;
for (const abs of allScss) {
  const text = read(abs);
  if (!text.includes('[data-')) continue;
  for (const rule of parseScssRules(text)) {
    if (rule.atRule || !rule.selector.includes('[data-')) continue;
    dataSelectorCount += 1;
    const rel = abs.slice(coreDir.length + 1);
    if (!rule.selector.includes(`[${DATA_PREFIX}`)) {
      fail(`${rel}:${rule.line} 选择器使用了非 ${DATA_PREFIX}* 的 data 属性：${rule.selector}`);
    }
    if (!/\.scui-[a-z0-9_-]+/.test(rule.selector)) {
      fail(
        `${rel}:${rule.line} 的 [data-*] 选择器缺少 .scui- 静态类作用域：${rule.selector}（裸属性可被宿主全局样式改到）`,
      );
    }
  }
}

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

// 4c. 产物层同样不允许裸属性回流（PostCSS 插件或第三方样式带进来的也要拦）
const cssBare = [...allCss.matchAll(DATA_TOKEN)]
  .map((match) => match[0])
  .filter((attr) => !attr.startsWith(DATA_PREFIX) && !DATA_ALLOWLIST.has(attr));
if (cssBare.length > 0) {
  fail(`dist/styles 产物出现裸 data-*：${[...new Set(cssBare)].slice(0, 6).join(', ')}`);
}

if (errors.length > 0) {
  console.error(`[check:styles] ${errors.length} 项不合规：`);
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}
console.log(
  `[check:styles] ${componentScss.length} 个组件样式表 / ${mixinUsers} 个 @use mixins / ${sourceValues.size} 个 data-* 取值全部命中组件源码与 index.css / 3 个基础样式文件 / ${requiredOutputs.length} 个产物 / 0 modifier class / R1：src 零裸 data-* · ${dataSelectorCount} 个 [data-*] 选择器全部被 .scui- 类作用域覆盖 · 产物零裸属性回流`,
);
