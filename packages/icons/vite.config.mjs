import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { collectSources } from '../../scripts/collect-sources.mjs';
import { PACKAGE_NAMES } from '../../scripts/scope.mjs';

const srcDir = resolve(import.meta.dirname, 'src');
const entries = collectSources(srcDir).map((rel) => resolve(srcDir, rel));

/** 扁平无 scope 后按单点定义的包名精确 external，见 packages/core/vite.config.mjs。 */
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
      external: (id) => /^solid-js(\/|$)/.test(id) || workspacePackageRe.test(id),
      output: {
        preserveModules: true,
        preserveModulesRoot: srcDir,
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
      },
    },
  },
});
