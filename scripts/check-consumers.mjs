/**
 * S-01 三端消费校验：Vite / Webpack 5 / Rspack 的产物必须同时满足
 *   1. 只引入了 Button / ConfigProvider 子路径（tree-shaking：其他组件不进 bundle）
 *   2. 显式引入的 styles.css 进入 CSS 产物
 *   3. 构建器实际解析的文件里包含 dist/source/*.jsx（"solid" 条件命中）
 *   4. 类型检查由各 example 的 `tsc --noEmit -p tsconfig.json` 覆盖
 *
 * 每个 example 的构建配置会把实际解析到的模块路径写到 dist/resolved.json，
 * 本脚本只认这份「构建器自报」的事实，不看配置文件里写了什么。
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../examples/', import.meta.url));
const targets = ['vite', 'webpack', 'rspack'];
const errors = [];

/**
 * 未被引用的组件目录。以 resolved.json（构建器实际纳入的模块清单）为准，
 * 不能只看 bundle.js 字符串：Webpack / Rspack 会把类名编译成
 * CSS_PREFIX + "button" 拼接，字符串判断会假通过。
 */
const unusedComponentDirs = ['grid', 'layout', 'typography', 'divider', 'space', 'icon'];

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

for (const target of targets) {
  const dist = path.join(root, target, 'dist');
  const prefix = `[${target}]`;

  if (!existsSync(dist)) {
    errors.push(`${prefix} dist/ 不存在，构建未执行`);
    continue;
  }

  const jsPath = path.join(dist, 'bundle.js');
  if (!existsSync(jsPath)) {
    errors.push(`${prefix} 缺少 bundle.js`);
    continue;
  }
  const js = readFileSync(jsPath, 'utf8');

  const cssFiles = readdirSync(dist).filter((name) => name.endsWith('.css'));
  const css = cssFiles.map((name) => readFileSync(path.join(dist, name), 'utf8')).join('\n');

  const resolvedPath = path.join(dist, 'resolved.json');
  const resolved = existsSync(resolvedPath) ? readJson(resolvedPath) : [];

  const sourceFiles = resolved.filter((file) => /dist\/source\//.test(file));
  const extraComponentFiles = sourceFiles.filter((file) =>
    unusedComponentDirs.some((dir) => file.includes(`dist/source/components/${dir}/`)),
  );

  const checks = [
    [
      'resolved.json 含 button 子路径源码（目标组件已进入产物）',
      sourceFiles.some((file) => file.includes('dist/source/components/button/')),
    ],
    [
      'JS 含 data-scui-variant 状态属性（Button 渲染逻辑未被摇掉）',
      js.includes('data-scui-variant'),
    ],
    [
      `tree-shaking：未引用的 ${unusedComponentDirs.length} 个组件模块均未纳入`,
      extraComponentFiles.length === 0,
    ],
    ['CSS 产物存在', cssFiles.length > 0],
    ['CSS 含 data-scui-variant 状态选择器', css.includes('data-scui-variant')],
    ['CSS 含 .scui-button 组件样式', css.includes('.scui-button')],
    ['CSS 含 token 变量引用', /var\(--scui-/.test(css)],
    [
      'resolved.json 记录到 dist/source/*.jsx（"solid" 条件命中）',
      resolved.some((file) => /dist\/source\/.*\.jsx$/.test(file)),
    ],
    [
      'resolved.json 记录到 styles CSS（显式引入生效）',
      resolved.some((file) => /dist\/styles\/.*\.css$/.test(file)),
    ],
  ];
  for (const file of extraComponentFiles) {
    console.error(`    UNEXPECTED MODULE ${file}`);
  }

  console.log(`=== ${target} ===`);
  console.log(
    `  bundle.js ${js.length} chars / ${cssFiles.length} CSS / ${resolved.length} resolved modules`,
  );
  for (const [label, ok] of checks) {
    console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${label}`);
    if (!ok) errors.push(`${prefix} ${label}`);
  }
}

if (errors.length > 0) {
  console.error(`\n[check-consumers] FAILED (${errors.length}):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log('\n[check-consumers] PASS: Vite / Webpack 5 / Rspack 三端消费校验通过');
