import { defineConfig } from 'vitest/config';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid()],
  resolve: {
    conditions: ['development', 'browser'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // src/ 是发布源码；spikes/ 是 Phase 0 可行性预研（不进 dist / exports / npm 包）。
    // 两者共用同一 root，让 pnpm test 自动跑 Spike 实证，无需新增根级脚本。
    include: ['src/**/*.test.{ts,tsx}', 'spikes/**/*.test.{ts,tsx}'],
    globals: false,
    // 外部化依赖会用 Node 原生条件解析到 solid-js/web/dist/server.js；
    // inline 后交由 Vite 按 browser/development 条件解析成 DOM 版本。
    server: {
      deps: {
        inline: ['solid-js', '@solidjs/testing-library'],
      },
    },
  },
});
