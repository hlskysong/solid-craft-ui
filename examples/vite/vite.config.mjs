import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

const distDir = fileURLToPath(new URL('./dist/', import.meta.url));

/** 记录 Rollup 实际纳入的 solid-craft 模块路径，用于实证 `"solid"` 条件命中。 */
function recordResolved() {
  return {
    name: 'record-resolved-core-modules',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const modules = Object.values(bundle).flatMap((chunk) => {
        const record = chunk;
        return 'modules' in record ? Object.keys(record.modules ?? {}) : [];
      });
      mkdirSync(distDir, { recursive: true });
      writeFileSync(
        `${distDir}resolved.json`,
        `${JSON.stringify(
          [...new Set(modules)].toSorted((a, b) => a.localeCompare(b)),
          null,
          2,
        )}\n`,
      );
    },
  };
}

export default defineConfig({
  // vite-plugin-solid 会自动把 "solid" 注入 resolve.conditions。
  plugins: [solid(), recordResolved()],
  build: {
    minify: false,
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: 'src/index.tsx',
      formats: ['es'],
      fileName: () => 'bundle.js',
    },
  },
});
