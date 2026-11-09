import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { collectSources } from '../../scripts/collect-sources.mjs';
import { PACKAGE_NAMES } from '../../scripts/scope.mjs';

const srcDir = resolve(import.meta.dirname, 'src');
const entries = collectSources(srcDir).map((rel) => resolve(srcDir, rel));

/**
 * 方案 A 扁平无 scope 后，兄弟包叫 solid-craft-icons / solid-craft-tokens，
 * 不再共享 `solid-craft/` 目录前缀；用单点定义的包名精确匹配（含子路径），
 * 否则兄弟包会被误打进本包 bundle，破坏 workspace 包边界。
 */
const workspacePackageRe = new RegExp(`^(?:${Object.values(PACKAGE_NAMES).join('|')})(?:/|$)`);

export default defineConfig({
  plugins: [solid()],
  build: {
    minify: false,
    sourcemap: true,
    outDir: 'dist/esm',
    emptyOutDir: true,
    lib: {
      entry: entries,
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) =>
        /^solid-js(\/|$)/.test(id) ||
        workspacePackageRe.test(id) ||
        id.startsWith('@kobalte/') ||
        id.startsWith('@tanstack/') ||
        id.startsWith('@internationalized/') ||
        id.startsWith('@floating-ui/'),
      output: {
        preserveModules: true,
        preserveModulesRoot: srcDir,
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
      },
    },
  },
});
