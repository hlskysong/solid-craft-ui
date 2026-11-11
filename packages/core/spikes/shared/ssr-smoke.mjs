/**
 * Phase 0 Spike 的 SSR 冒烟 runner（S-02 / S-04 / S-05 / S-06 共用）。
 *
 * 用 Vite 的 ssrLoadModule 把 Spike TSX 按服务端条件编译，再调 renderToString，
 * 验证：① 不抛 Client-only API；② 双次 renderToString 逐字一致（无 today() / 随机漂移）；
 * ③ 各 Spike 约定的 data-* 状态真实输出（只有 S-02 的 Kobalte 复合组件另验 data-hk，
 *    其余三例是纯 SSR 字符串、不带 hydration key）；④ 渲染期 0 console warning/error。
 *
 * 注意：Phase 0 只验 SSR 单档渲染的可行性，完整 SSR 回归按 docs/07 §6 仍在 M4。
 */
import { fileURLToPath } from 'node:url';

import { createServer } from 'vite';
import solid from 'vite-plugin-solid';

// 本文件在 packages/core/spikes/shared/，向上两级才是 Vite root（packages/core/）
const root = fileURLToPath(new URL('../..', import.meta.url));

const cases = [
  {
    id: 'S-02',
    file: '/spikes/s02-kobalte/ssr.tsx',
    markers: ['data-scui-size', 'aria-haspopup="listbox"', 'data-scui-role="dialog-trigger"', 'data-hk'],
  },
  {
    id: 'S-04',
    file: '/spikes/s04-table/ssr.tsx',
    markers: ['data-scui-role="table"', 'data-scui-fixed="left"'],
  },
  {
    id: 'S-05',
    file: '/spikes/s05-date-picker/ssr.tsx',
    markers: ['data-scui-role="date-picker"', 'lang="zh-CN"'],
  },
  {
    id: 'S-06',
    file: '/spikes/s06-form/ssr.tsx',
    markers: ['data-scui-role="form"', 'data-scui-invalid'],
  },
];

const errors = [];
const warnings = [];
const server = await createServer({
  configFile: false,
  root,
  plugins: [solid()],
  server: { middlewareMode: true },
  logLevel: 'silent',
  appType: 'custom',
});

const originalWarn = console.warn;
const originalError = console.error;
console.warn = (...args) => warnings.push(args.map(String).join(' '));
console.error = (...args) => warnings.push(args.map(String).join(' '));

try {
  for (const item of cases) {
    let html = '';
    try {
      const mod = await server.ssrLoadModule(item.file);
      html = await mod.render();
      // SSR 确定性：同一组件连渲两次必须逐字一致（无 today() / Math.random 漂移）
      const again = await mod.render();
      if (again !== html) errors.push(`${item.id} 两次 renderToString 输出不一致（SSR 不稳定）`);
    } catch (error) {
      errors.push(`${item.id} SSR 渲染抛错：${error instanceof Error ? error.message : String(error)}`);
      console.error = originalError;
      originalError(`${item.id} 抛错详情：`, error);
      console.error = (...args) => warnings.push(args.map(String).join(' '));
      continue;
    }
    if (typeof html !== 'string' || html.length === 0) {
      errors.push(`${item.id} renderToString 未产出 HTML`);
    }
    if (!html.includes('<')) errors.push(`${item.id} HTML 未渲染出任何元素`);
    for (const marker of item.markers) {
      if (!html.includes(marker)) errors.push(`${item.id} HTML 缺少标记 ${marker}`);
    }
    if (/Client-only API|hydration mismatch/i.test(html)) {
      errors.push(`${item.id} HTML 含客户端专用 API / hydration mismatch 文本`);
    }
    originalWarn.call(console, `[spikes:ssr] ${item.id} ${html.length} chars · 双渲一致 · ${item.markers.length}/${item.markers.length} markers`);
  }
} finally {
  console.warn = originalWarn;
  console.error = originalError;
  await server.close();
}

if (warnings.length > 0) {
  errors.push(`渲染期出现 ${warnings.length} 条 console warning/error`);
  for (const line of warnings) originalWarn.call(console, `  CONSOLE ${line}`);
}

if (errors.length > 0) {
  originalError(`[spikes:ssr] FAILED (${errors.length}):`);
  for (const line of errors) originalError(`  - ${line}`);
  process.exit(1);
}
originalWarn.call(console, `[spikes:ssr] PASS: ${cases.length} 个 Spike SSR 单档渲染零报错（双渲确定性 + data-* 契约 + 0 warning）`);
