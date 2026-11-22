import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { transform } from 'esbuild';
import { collectSources } from './collect-sources.mjs';

/**
 * "solid" 条件导出用的源码产物：只擦除 TS 类型、保留 JSX，不做 Solid 编译。
 * 由消费方（SolidStart / vite-plugin-solid）按 SSR / CSR 目标重新编译。
 *
 * sourcemap（T4-11）：与 dist/esm 一致保留 map（docs/02 架构决策「不压缩、保留 sourcemap」）。
 * click-to-component 用它把 solid-devtools 注入的**产物行列**精确反查回**手写源码行列** ——
 * 擦除 TS 类型会让行号漂移（实测 Button 产物 L51 = 源码 L57），没有 map 只能近似定位。
 */
const repoRoot = resolve(import.meta.dirname, '..');
const pkgRel = process.argv[2] ?? 'packages/core';
const pkgDir = resolve(repoRoot, pkgRel);
const srcDir = join(pkgDir, 'src');
const outDir = join(pkgDir, 'dist', 'source');

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const files = collectSources(srcDir);
for (const rel of files) {
  const code = readFileSync(join(srcDir, rel), 'utf8');
  const output = await transform(code, {
    loader: rel.endsWith('.tsx') ? 'tsx' : 'ts',
    format: 'esm',
    target: 'es2022',
    jsx: 'preserve',
    sourcefile: rel,
    sourcemap: 'external',
  });
  const dest = join(outDir, rel.replace(/\.tsx?$/, '.jsx'));
  const mapDest = `${dest}.map`;
  mkdirSync(dirname(dest), { recursive: true });

  // esbuild 的 sources 是 sourcefile 原样（'components/button/Button.tsx'），不是相对 map 位置的路径。
  // 改成从 *.jsx.map 所在目录回指真实源码， IDE / trace-mapping 才能解析到 src。
  const map = JSON.parse(output.map);
  map.file = relative(dirname(mapDest), dest); // 'Button.jsx'
  map.sources = map.sources.map((source) =>
    relative(dirname(mapDest), join(srcDir, source)).split('\\').join('/'),
  );
  writeFileSync(mapDest, `${JSON.stringify(map)}\n`);
  writeFileSync(dest, `${output.code}\n//# sourceMappingURL=${map.file}.map\n`);
}

console.log(`[build-source] ${pkgRel}: ${files.length} files -> dist/source/*.jsx (+ .jsx.map)`);
