import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

/**
 * 客户端 bundle（hydration 验证用）。
 *
 * vite-plugin-solid 会把 "solid" 条件自动加入 resolve.conditions，使
 * solid-craft 解析到 dist/source/*.jsx（保留 JSX 的源码产物）。
 * ssr: true 让插件在 client 环境产出 generate:'dom', hydratable:true 的代码。
 * 产物为单文件 IIFE，可直接用 jsdom 的 window.eval 执行。
 */
export default defineConfig({
  plugins: [solid({ ssr: true })],
  build: {
    minify: false,
    outDir: 'dist/client',
    emptyOutDir: true,
    lib: {
      entry: 'src/entry-client.tsx',
      formats: ['iife'],
      name: 'UiDesignSmoke',
      fileName: () => 'entry-client.js',
    },
  },
});
