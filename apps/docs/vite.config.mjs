import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

/**
 * 文档站（ADR-008）：Vite + Solid SPA，与组件库同运行时。
 * - vite-plugin-solid 注入 "solid" 条件，命中 solid-craft 的 dist/source/*.jsx；
 * - Demo 源文件来自 packages/core/src/components/*\/demos/*.tsx，通过 import.meta.glob 加载，
 *   同一路径的 ?raw 保证「展示源码」与「实际渲染模块」是同一个文件；
 * - base 可通过 UI_DOCS_BASE 配置，便于部署到内部静态服务器的子路径（02 §12.4）。
 */
export default defineConfig({
  base: process.env.UI_DOCS_BASE ?? '/',
  plugins: [solid()],
  server: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
    // Demo 源码位于 apps/docs 之外的 packages/core，显式放行 workspace 根。
    fs: { allow: [resolve(import.meta.dirname, '../..')] },
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
