import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { transform } from 'esbuild';
import { collectSources } from './collect-sources.mjs';

/**
 * "solid" 条件导出用的源码产物：只擦除 TS 类型、保留 JSX，不做 Solid 编译。
 * 由消费方（SolidStart / vite-plugin-solid）按 SSR / CSR 目标重新编译。
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
  });
  const dest = join(outDir, rel.replace(/\.tsx?$/, '.jsx'));
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, `${output.code}\n`);
}

console.log(`[build-source] ${pkgRel}: ${files.length} files -> dist/source/*.jsx`);
