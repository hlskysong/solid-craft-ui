/**
 * SSR 冒烟 runner（Phase 0 的 S-02 / S-04 / S-05 / S-06 + M2 起原语层的 T2-01）。
 *
 * 用 Vite 的 ssrLoadModule 把入口 TSX 按服务端条件编译，再调 renderToString，
 * 验证：① 不抛 Client-only API；② 双次 renderToString 逐字一致（无 today() / 随机漂移）；
 * ③ 各入口约定的 data-* 状态真实输出（只有 S-02 的 Kobalte 复合组件另验 data-hk，
 *    其余是纯 SSR 字符串、不带 hydration key）；④ 渲染期 0 console warning/error。
 *
 * 这里**不设**「弹层内容必须缺席」的 forbid 判据：T2-01 实测即便把 `ready` 改成恒 true，
 * Kobalte 的 Portal 在服务端构建下依然是空操作、SSR 输出不含任何弹层节点 ——
 * 那种判据恒真、破坏不了，属于假判据（负向实证 N62 记录的正是这件事）。
 * 「首帧不挂弹层」由 `src/primitives/primitives.test.tsx` 的 `useClientReady` 首帧断言覆盖。
 *
 * 为什么放在 spikes/ 下却要跑 src 的入口：这个脚本是仓库里唯一能拿到
 * 「真实服务端编译 + renderToString」的地方（vitest 跑在 jsdom，JSX 已被编成
 * document.createElement，做不了 SSR）。M2 的原语层要验 SSR 双渲确定性，
 * 复用这条已接进 `check:ci` 的链路比新建一个阶段成本低，也不新增 verify 阶段。
 *
 * 注意：这里只验 SSR 单档渲染的可行性，完整 SSR 回归按 docs/07 §6 仍在 M4。
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
    markers: [
      'data-scui-size',
      'aria-haspopup="listbox"',
      'data-scui-role="dialog-trigger"',
      'data-hk',
    ],
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
  {
    // T2-01：原语层（src 内实现，不是 Spike）。服务端只允许出触发骨架，
    // 弹层内容必须在客户端 onMount 后才装载（docs/02 §8 / api-draft/Table.md §6 同一口径）。
    id: 'T2-01',
    file: '/src/primitives/__tests__/ssr-entry.tsx',
    markers: [
      'data-scui-primitive="dialog-trigger"',
      'data-scui-primitive="select-trigger"',
      'data-scui-state="closed"',
      'aria-haspopup',
    ],
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
      errors.push(
        `${item.id} SSR 渲染抛错：${error instanceof Error ? error.message : String(error)}`,
      );
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
    originalWarn.call(
      console,
      `[spikes:ssr] ${item.id} ${html.length} chars · 双渲一致 · ${item.markers.length}/${item.markers.length} markers`,
    );
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
originalWarn.call(
  console,
  `[spikes:ssr] PASS: ${cases.length} 个入口 SSR 单档渲染零报错（双渲确定性 + data-* 契约 + 0 warning）`,
);
