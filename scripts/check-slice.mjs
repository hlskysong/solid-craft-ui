/**
 * T1-12 组件纵向切片门禁：把「组件 → 样式 → 测试 → 文档 → 构建 → 发布预演」
 * 按**组件维度横切**成一份可复制模板契约。
 *
 * 现有的 check:exports / check:llms / check:styles / check:docs 各自验纵向的某一层，
 * 但「新增一个组件必须同时具备哪些东西」此前只写在 docs/06 §3 的文字模板里，
 * 机器不会拦住「只写了 TSX、漏了 demo / llms / CSS 产物」的半截组件。本门禁补上这一环：
 *
 *   1. 模板定义出处存在（docs/06 §3 组件实现模板，受 SHA256 冻结）。
 *   2. packages/core/src/components/<name>/ 下 6 件源文件齐全且命名一致：
 *      <Pascal>.tsx / types.ts / index.ts / <name>.scss / <Pascal>.test.tsx / demos/basic.tsx。
 *      组件清单以 package.json 的 exports 子路径为权威来源，与源码目录双向比对
 *      （overview / demos 等辅助目录自动排除；删整个组件目录也不会让门禁假 PASS）。
 *   3. 组件实现必须走 CSS_PREFIX 单点定义并用 data-* 表达变体（不生成 modifier class）；
 *      index.ts 必须导出组件与 Props 类型。
 *   4. package.json 必须有 ./<name> 子路径，且 types / solid / import / default 四条件齐全。
 *   5. 构建产物 4 件齐全：dist/esm、dist/source、dist/types 的 index，以及 dist/styles/components/<name>.css。
 *   6. 文档生成物 4 件齐全：API 表、Demo 快照、llms exports 页、llms demos 页。
 *   7. 发布预演链路（pnpm preview:release / pnpm stage:release）入口在位，
 *      对应脚本真实存在（§27 / §28 的实证对象）。
 *
 * --template-dir <dir>：只校验「模板 6 件源文件」这一组，用于仓库外的影子组件演练，
 * 证明按模板克隆出一个新组件后结构判据仍可复用（不碰仓库内任何文件）。
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { CSS_PREFIX } from './scope.mjs';

const repoRoot = resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const templateDirArg = args.indexOf('--template-dir');
const templateDir = templateDirArg >= 0 ? resolve(args[templateDirArg + 1] ?? '') : '';

const errors = [];
let sliceCount = 0;
const fail = (message) => errors.push(message);
const read = (abs) => (existsSync(abs) ? readFileSync(abs, 'utf8') : '');
const isFile = (abs) => existsSync(abs) && statSync(abs).isFile();
const pascal = (name) => name.charAt(0).toUpperCase() + name.slice(1);

const sourceTemplate = [
  (dir, name, component) => [join(dir, `${component}.tsx`), `${name}: ${component}.tsx`],
  (dir) => [join(dir, 'types.ts'), 'types.ts'],
  (dir) => [join(dir, 'index.ts'), 'index.ts'],
  (dir, name) => [join(dir, `${name}.scss`), `${name}.scss`],
  (dir, name, component) => [join(dir, `${component}.test.tsx`), `${component}.test.tsx`],
  (dir) => [join(dir, 'demos', 'basic.tsx'), 'demos/basic.tsx'],
];

/** 只验「按模板克隆出的组件目录」自身，供 --template-dir 使用 */
function checkTemplateFiles(dir, label, componentName) {
  const component = componentName || pascal(dir.split(/[\\/]/).pop() ?? '');
  const name = dir.split(/[\\/]/).pop() ?? '';
  for (const pathOf of sourceTemplate) {
    const [abs, labelOf] = pathOf(dir, name, component);
    if (!isFile(abs)) fail(`${label}: 缺少模板文件 ${labelOf}`);
  }
  const impl = read(join(dir, `${component}.tsx`));
  if (impl) {
    if (!impl.includes('CSS_PREFIX')) fail(`${label}: ${component}.tsx 未走 CSS_PREFIX 单点定义`);
    // 先看「有没有真的输出 data-* 属性」，而不是「源码里有没有出现过这个字符串」：
    // ① 剥离块注释与行注释 —— 注释里写 data-x="..." 曾让 Checkbox 假通过；
    // ② 两种合法写法都要认：JSX 属性 `data-x={...}` / `data-x="..."`，以及
    //    通过对象 spread 传给共享壳的 `'data-x': ...`（T2-05 三件套用后者）。
    //    不认第二种会逼组件为了过门禁复制一份 label 结构或塞冗余 DOM 属性。
    const code = impl.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    const hasDataOutput = /data-[\w-]+\s*=/.test(code) || /['"]data-[\w-]+['"]\s*:/.test(code);
    if (!hasDataOutput) fail(`${label}: ${component}.tsx 未用 data-* 表达变体/状态`);
  }
  const types = read(join(dir, 'types.ts'));
  // 复合组件（Grid = Row/Col，Layout = Header/Content/...）不叫 <Name>Props，
  // 因此只要求「至少一个 *Props 类型」，并由 index.ts 全部转出，不强求单一命名。
  const propNames = [...types.matchAll(/export\s+(?:interface|type)\s+(\w*Props)\b/g)].map(
    (match) => match[1],
  );
  if (types && propNames.length === 0) fail(`${label}: types.ts 未导出任何 *Props 类型`);
  const barrel = read(join(dir, 'index.ts'));
  if (barrel && !barrel.includes('export')) fail(`${label}: index.ts 未导出组件与 Props 类型`);
  if (barrel) {
    for (const prop of propNames) {
      if (!barrel.includes(prop)) fail(`${label}: index.ts 未转出 ${prop}`);
    }
  }
  const styles = read(join(dir, `${name}.scss`));
  if (styles && !styles.includes('data-')) {
    fail(`${label}: ${name}.scss 未用 data-* 选择器（禁止 modifier class 死代码）`);
  }
}

if (templateDir) {
  checkTemplateFiles(templateDir, `模板演练 ${templateDir}`, '');
} else {
  // 1. 模板定义出处（冻结规范，受 check-goals 的 SHA256 保护）
  const spec = read(join(repoRoot, 'docs', '06-工程规范.md'));
  if (!spec.includes('## 3. 组件实现模板') || !spec.includes('components/button/types.ts')) {
    fail('docs/06 §3 组件实现模板缺失或已变形（模板唯一出处不可丢）');
  }

  const componentsRoot = join(repoRoot, 'packages', 'core', 'src', 'components');
  const corePkg = JSON.parse(read(join(repoRoot, 'packages', 'core', 'package.json')));

  // exports 子路径是组件清单的权威来源：若只靠「目录里有 index.ts + types.ts」自识别，
  // 删掉某个 index.ts 会让该组件凭空消失、门禁反而 PASS（负向实证抓到的盲区）。
  const nonComponents = new Set([
    '.',
    './package.json',
    './styles.css',
    './styles/*',
    './config-provider',
  ]);
  const expectedComponents = Object.keys(corePkg.exports ?? {}).filter(
    (key) => key.startsWith('./') && !nonComponents.has(key),
  );
  const componentDirs = readdirSync(componentsRoot).filter((name) => {
    const dir = join(componentsRoot, name);
    return (
      statSync(dir).isDirectory() &&
      (isFile(join(dir, `${pascal(name)}.tsx`)) || isFile(join(dir, 'types.ts')))
    );
  });
  if (componentDirs.length === 0) fail('未识别到任何组件目录（实现 TSX / types.ts 双判据为空）');
  sliceCount = componentDirs.length;
  for (const key of expectedComponents) {
    const name = key.slice(2);
    if (!componentDirs.includes(name)) {
      fail(`exports 声明了 ${key} 但缺少源码目录 components/${name}/`);
    }
  }
  for (const name of componentDirs) {
    if (!expectedComponents.includes(`./${name}`)) {
      fail(`源码目录 components/${name}/ 未在 exports 声明（半截组件不得入库）`);
    }
  }

  for (const name of componentDirs) {
    const dir = join(componentsRoot, name);
    const component = pascal(name);
    const label = `组件 ${name}`;

    // 2~3. 源文件与实现约定
    checkTemplateFiles(dir, label, component);

    // 4. exports 子路径四条件
    const entry = corePkg.exports?.[`./${name}`];
    if (!entry || typeof entry !== 'object') {
      fail(`${label}: package.json 缺少 ./${name} exports 子路径`);
    } else {
      for (const condition of ['types', 'solid', 'import', 'default']) {
        const target = entry[condition];
        if (!target || typeof target !== 'string') {
          fail(`${label}: ./${name} 缺少 ${condition} 条件`);
          continue;
        }
        // styles.css.d.ts 这类声明文件同样要求真实存在，避免只写字符串骗过门禁
        if (!isFile(join(repoRoot, 'packages', 'core', target.replace(/^\.\//, '')))) {
          fail(`${label}: ./${name} 的 ${condition} 目标不存在：${target}`);
        }
      }
    }

    // 5. 构建产物（build 之后才有，故本阶段排在 pnpm build 之后）
    const built = [
      `dist/esm/components/${name}/index.js`,
      `dist/source/components/${name}/index.jsx`,
      `dist/types/components/${name}/index.d.ts`,
      `dist/styles/components/${name}.css`,
    ];
    for (const rel of built) {
      if (!isFile(join(repoRoot, 'packages', 'core', rel))) fail(`${label}: 缺少构建产物 ${rel}`);
    }

    // 6. 文档生成物
    const generated = [
      `apps/docs/src/generated/api/${name}.json`,
      `apps/docs/src/generated/demos/${name}-basic.json`,
      `apps/docs/public/llms/exports/${name}.md`,
      `apps/docs/public/llms/demos/${name}-basic.md`,
    ];
    for (const rel of generated) {
      if (!isFile(join(repoRoot, rel))) fail(`${label}: 缺少文档生成物 ${rel}`);
    }
  }

  // 7. 发布预演链路（§27 / §28）
  const rootPkg = JSON.parse(read(join(repoRoot, 'package.json')));
  const chains = [
    ['preview:release', 'scripts/preview-release.mjs'],
    ['stage:release', 'scripts/stage-release.mjs'],
  ];
  for (const [script, rel] of chains) {
    if (!rootPkg.scripts?.[script]) fail(`发布预演链路缺少 pnpm ${script} 入口`);
    if (!isFile(join(repoRoot, rel))) fail(`发布预演链路缺少脚本 ${rel}`);
  }
  if (!corePkg.files?.includes('llms.txt')) {
    fail('core 的 files 白名单未含 llms.txt（Q1-L1 随包发布是纵向切片的文档环节）');
  }
  if (!CSS_PREFIX) fail('CSS_PREFIX 单点定义为空');
}

if (errors.length > 0) {
  console.error('[check:slice] 组件纵向切片门禁未通过：');
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

if (templateDir) {
  console.log(`[check:slice] 模板演练通过：${templateDir} 的 6 件源文件与实现约定齐全`);
} else {
  console.log(
    `[check:slice] 组件纵向切片模板：${sliceCount} 个组件 × 6 源文件 / 4 类 exports 条件 / 4 件构建产物 / 4 件文档生成物全齐；exports 与源码目录双向一致；发布预演链路在位`,
  );
}
