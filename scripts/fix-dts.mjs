import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/**
 * 声明产物后处理（只改 dist/types，不动源码与运行时产物）：
 * 1. 为相对 import / export 补上 ESM 要求的 .js 扩展名。源码用 bundler
 *    moduleResolution（无扩展名），TS 7 emitDeclarationOnly 会原样保留；但
 *    Node16 / NodeNext ESM 消费者要求带扩展名，否则 attw 报 InternalResolutionError。
 * 2. 产出 ./styles.css 子路径的类型声明。消费方写
 *    `import 'solid-craft/styles.css'` 时 TS 7 会按 exports 的 types 条件
 *    找声明，缺失会报 TS2882；由本脚本保证它和构建产物一起生成。
 */
const repoRoot = resolve(import.meta.dirname, '..');
const pkgRel = process.argv[2] ?? 'packages/core';
const typesDir = join(repoRoot, pkgRel, 'dist', 'types');

if (!existsSync(typesDir)) {
  throw new Error(`[fix-dts] missing ${typesDir}; run tsc -p tsconfig.build.json first`);
}

const listDeclarations = (dir) => {
  const result = [];
  for (const name of readdirSync(dir).toSorted()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) result.push(...listDeclarations(full));
    else if (name.endsWith('.d.ts')) result.push(full);
  }
  return result;
};

let rewrittenFiles = 0;
let rewrittenSpecs = 0;
const unresolved = [];

const extend = (file, specifier) => {
  if (/\.(js|mjs|cjs|json|css|jsx)$/.test(specifier)) return specifier;
  const base = resolve(dirname(file), specifier);
  if (existsSync(`${base}.d.ts`)) return `${specifier}.js`;
  if (existsSync(join(base, 'index.d.ts'))) return `${specifier}/index.js`;
  unresolved.push(`${file.slice(repoRoot.length + 1)} -> ${specifier}`);
  return specifier;
};

for (const file of listDeclarations(typesDir)) {
  const original = readFileSync(file, 'utf8');
  const output = original
    .replace(/(\bfrom\s*)(['"])(\.\.?\/[^'"]+)\2/g, (_match, prefix, quote, specifier) => {
      const next = extend(file, specifier);
      if (next !== specifier) rewrittenSpecs += 1;
      return `${prefix}${quote}${next}${quote}`;
    })
    .replace(/(\bimport\s*\(\s*)(['"])(\.\.?\/[^'"]+)\2/g, (_match, prefix, quote, specifier) => {
      const next = extend(file, specifier);
      if (next !== specifier) rewrittenSpecs += 1;
      return `${prefix}${quote}${next}${quote}`;
    });
  if (output !== original) {
    writeFileSync(file, output);
    rewrittenFiles += 1;
  }
}

if (unresolved.length > 0) {
  console.error('[fix-dts] unresolved relative specifiers:');
  for (const item of unresolved) console.error(`  - ${item}`);
  process.exit(1);
}

// 副作用 CSS import 的模块声明：内容必须为空导出，声明该路径是一个合法模块。
writeFileSync(
  join(typesDir, 'styles.css.d.ts'),
  '// Side-effect-only stylesheet entry. See exports["./styles.css"].types.\nexport {};\n',
);

console.log(
  `[fix-dts] ${pkgRel}: ${rewrittenFiles} files / ${rewrittenSpecs} specifiers -> ESM; styles.css.d.ts emitted`,
);
