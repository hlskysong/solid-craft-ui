import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

/**
 * 服务端 bundle（renderToString 验证用）。
 *
 * build.ssr 让 vite-plugin-solid 产出 generate:'ssr', hydratable:true 的代码。
 * 含 "solid" 条件导出的 solid-craft 会被插件自动加入 ssr.noExternal，
 * 因此其 dist/source/*.jsx 会被编译成服务端渲染代码；solid-js 保持 external，
 * 在 Node 下解析到 web/dist/server.js。
 */
export default defineConfig({
  plugins: [solid({ ssr: true })],
  build: {
    minify: false,
    outDir: 'dist/server',
    emptyOutDir: true,
    ssr: 'src/entry-server.tsx',
    rollupOptions: {
      output: { entryFileNames: 'entry-server.js' },
    },
  },
});
