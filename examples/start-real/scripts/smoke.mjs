/**
 * S-01 真实 @solidjs/start SSR 冒烟。
 *
 * 与 examples/solid-start（Vite SSR + jsdom 复刻链路）分工：
 *   - 本脚本：真实框架的 build 产物 → 调用 createHandler 返回的 H3 handler
 *     拿到 SSR HTML，验证组件渲染、确定性 ID、CSS 资源与 "solid" 条件命中；
 *   - examples/solid-start/scripts/smoke.mjs：hydrate 交互实证（点击送达、
 *     createUniqueId 不变、0 hydration warning）。
 *
 * 判据（S-01 / X-04）：服务端不抛 Client-only API、HTML 含组件与 data-hk、
 * 构建器实际解析到 dist/source/*.jsx、无 console warning/error。
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const distDir = fileURLToPath(new URL('../dist/', import.meta.url));
const errors = [];
const warnings = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
  console.log(`  ${condition ? 'OK  ' : 'FAIL'} ${message}`);
}

const originalWarn = console.warn;
const originalError = console.error;
console.warn = (...args) => warnings.push(args.map(String).join(' '));
console.error = (...args) => warnings.push(args.map(String).join(' '));

const serverEntry = path.join(distDir, 'server', 'entry-server.js');
if (!existsSync(serverEntry)) {
  originalError(`[start-real] missing ${serverEntry}; run pnpm bundle first`);
  process.exit(1);
}

let html = '';
try {
  const mod = await import(pathToFileURL(serverEntry).href);
  const handler = mod.default;
  if (!handler) throw new Error('server entry has no default export');

  const request = new Request('http://localhost/', { method: 'GET' });
  let response;
  if (typeof handler.fetch === 'function') {
    response = await handler.fetch(request);
  } else if (typeof handler.request === 'function') {
    response = await handler.request(request);
  } else if (typeof handler === 'function') {
    response = await handler(request);
  } else {
    throw new Error(`unsupported handler shape: ${Object.keys(handler).join(', ')}`);
  }
  if (!response || typeof response.text !== 'function') {
    throw new Error('handler did not return a Response-like object');
  }
  html = await response.text();
  console.log(`  [handler] status ${response.status} / ${html.length} chars`);
} catch (error) {
  console.error = originalError;
  console.warn = originalWarn;
  originalError('[start-real] SSR render threw:');
  originalError(error instanceof Error ? error.stack : String(error));
  process.exit(1);
}

console.error = originalError;
console.warn = originalWarn;

console.log('=== 真实 SolidStart SSR HTML ===');
assert(html.includes('<html'), '返回完整 HTML 文档');
assert(html.includes('id="app"'), '存在 #app 挂载容器');
assert(html.includes('真实 SolidStart SSR'), '路由页面内容已服务端渲染');
assert(html.includes('scui-button'), 'Button 组件类名出现在 SSR HTML');
assert(html.includes('data-variant'), 'Button 的 data-* 状态属性正确输出');
assert(html.includes('data-testid="stable-id"'), 'createUniqueId 确定性 ID 输出');
assert(html.includes('data-hk'), 'HTML 含 data-hk（"solid" 源码产物 + hydratable 编译）');
assert(html.includes('entry-client'), 'HTML 引用客户端 bundle');
assert(html.includes('.css') || html.includes('<style'), 'HTML 引用组件 CSS');
assert(!html.includes('Client-only API'), '无 Client-only API 服务端报错');
assert(!/Hydration|hydration mismatch/i.test(html), 'HTML 无 hydration mismatch 文本');

console.log('=== 构建器模块解析（"solid" 条件） ===');
const resolvedFiles = readdirSync(distDir)
  .filter((name) => name.startsWith('resolved.') && name.endsWith('.json'))
  .toSorted((a, b) => a.localeCompare(b));
const allResolved = resolvedFiles.flatMap((name) =>
  JSON.parse(readFileSync(path.join(distDir, name), 'utf8')),
);
console.log(
  `  resolved 报告 ${resolvedFiles.length} 份 / ${allResolved.length} 个 core 模块：` +
    ` ${resolvedFiles.join(', ')}`,
);
assert(resolvedFiles.length > 0, '生成了按 environment 分组的解析报告');
assert(
  allResolved.some((file) => /dist\/source\/.*\.jsx$/.test(file)),
  '真实 SolidStart 构建命中 dist/source/*.jsx（"solid" 条件生效）',
);
assert(
  allResolved.some((file) => /dist\/styles\/.*\.css$/.test(file)),
  '组件 CSS 被真实框架纳入构建',
);

const clientAssetsDir = path.join(distDir, 'client', '_build', 'assets');
const clientJs = existsSync(clientAssetsDir)
  ? readdirSync(clientAssetsDir)
      .filter((name) => name.endsWith('.js'))
      .map((name) => readFileSync(path.join(clientAssetsDir, name), 'utf8'))
      .join('\n')
  : '';
assert(clientJs.includes('data-variant'), '客户端 bundle 含组件逻辑（可 hydrate）');

assert(warnings.length === 0, `SSR 阶段 0 console warning/error（实际 ${warnings.length}）`);
for (const warning of warnings) console.error(`    CONSOLE ${warning}`);

if (errors.length > 0) {
  console.error(`\n[smoke:start-real] FAILED (${errors.length}):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log('\n[smoke:start-real] PASS: 真实 @solidjs/start SSR 渲染 + "solid" 条件解析通过');
