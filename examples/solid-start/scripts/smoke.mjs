import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';

/**
 * S-10 / X-04 冒烟：验证 "solid" 条件导出的 dist/source/*.jsx 在消费端
 *  (1) 能被解析并 renderToString（不抛 Client-only API）；
 *  (2) 生成的 HTML 能被 hydrate，且无 mismatch warning / 节点重建。
 *
 * 前置：pnpm build（产出 core/dist/source） + pnpm --filter solid-craft-example-solid-start bundle
 */
const exampleRoot = resolve(import.meta.dirname, '..');
const repoRoot = resolve(exampleRoot, '..', '..');
const sourceEntry = join(repoRoot, 'packages', 'core', 'dist', 'source', 'index.jsx');
const serverBundle = join(exampleRoot, 'dist', 'server', 'entry-server.js');
const clientBundle = join(exampleRoot, 'dist', 'client', 'entry-client.js');

const fail = (message) => {
  console.error(`[ssr-smoke] FAIL: ${message}`);
  process.exit(1);
};

for (const file of [sourceEntry, serverBundle, clientBundle]) {
  if (!existsSync(file)) {
    fail(
      `missing ${file}\n  run: pnpm build && pnpm --filter solid-craft-example-solid-start bundle`,
    );
  }
}

const sourceHead = readFileSync(sourceEntry, 'utf8');
if (!sourceHead.includes('components/button')) {
  fail('dist/source/index.jsx does not look like the "solid" source build');
}

const { render } = await import(`${pathToFileURL(serverBundle).href}?t=${Date.now()}`);

let html;
let hydrationScript;
try {
  ({ html, hydrationScript } = await render());
} catch (error) {
  fail(`renderToString threw: ${error instanceof Error ? error.stack : String(error)}`);
}

const requiredSnippets = [
  'data-scui-theme="light"',
  'data-scui-density="default"',
  'data-scui-direction="ltr"',
  'data-scui-color="primary"',
  'data-scui-size="medium"',
  'data-testid="stable-id"',
  'SSR 冒烟',
  '默认按钮',
  '中性按钮',
  '分割线',
];
for (const snippet of requiredSnippets) {
  if (!html.includes(snippet)) fail(`SSR html is missing ${JSON.stringify(snippet)}`);
}
if (/Client-only API|Cannot read properties of undefined/.test(html)) {
  fail('SSR html contains a client-only error string');
}

const messages = [];
const virtualConsole = new VirtualConsole();
for (const level of ['error', 'warn']) {
  virtualConsole.on(level, (...args) => {
    messages.push({ level, text: args.map((value) => String(value)).join(' ') });
  });
}
virtualConsole.on('jsdomError', (error) => {
  messages.push({ level: 'error', text: error.message });
});

const dom = new JSDOM(
  `<!doctype html><html><head>${hydrationScript}</head><body><div id="app">${html}</div></body></html>`,
  { url: 'http://localhost/', runScripts: 'dangerously', virtualConsole },
);
const doc = dom.window.document;
const container = doc.getElementById('app');

const snapshot = () => ({
  nodes: container.querySelectorAll('*').length,
  buttons: container.querySelectorAll('button').length,
  stableId: doc.querySelector('[data-testid="stable-id"]')?.textContent ?? null,
  primary: container.querySelector('[data-scui-color="primary"]')?.textContent ?? null,
});

const before = snapshot();
if (before.buttons !== 2) fail(`expected 2 buttons in SSR html, got ${before.buttons}`);

const clientCode = readFileSync(clientBundle, 'utf8');
try {
  dom.window.eval(clientCode);
} catch (error) {
  fail(
    `client bundle threw during hydrate: ${error instanceof Error ? error.stack : String(error)}`,
  );
}

const after = snapshot();
const hydrationNoise = messages.filter(
  (message) => !message.text.startsWith('Not implemented: HTMLCanvasElement'),
);
if (hydrationNoise.length > 0) {
  fail(
    `hydration produced ${hydrationNoise.length} console warning(s)/error(s):\n${hydrationNoise
      .map((message) => `    [${message.level}] ${message.text}`)
      .join('\n')}`,
  );
}
if (after.stableId !== before.stableId) {
  fail(`createUniqueId mismatch: SSR=${before.stableId} hydrate=${after.stableId}`);
}
if (after.buttons !== before.buttons) {
  fail(`button count changed after hydration: ${before.buttons} -> ${after.buttons}`);
}
if (after.primary !== before.primary) {
  fail('primary Button content changed after hydration');
}
if (after.nodes > before.nodes + 2) {
  fail(
    `DOM nodes grew ${before.nodes} -> ${after.nodes}; the tree was re-created instead of hydrated`,
  );
}
if (!html.includes('data-hk')) {
  fail('SSR html has no data-hk markers — the "solid" source build was probably not used');
}

// 交互实证：只有 hydrate 真正绑定了事件委托，click 才会到达组件 onClick。
const primaryButton = container.querySelector('[data-scui-color="primary"]');
primaryButton.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
const clicks = dom.window.uiSmokeClicks ?? 0;
if (clicks !== 1) {
  fail(`hydrate did not attach event handlers: expected 1 click, got ${clicks}`);
}

console.log(
  `[ssr-smoke] OK: renderToString ${html.length} chars / ${before.nodes} nodes, data-hk present; ` +
    `hydrate preserved createUniqueId=${after.stableId}, ${after.buttons} buttons, ` +
    `click delivered=${clicks}, 0 warnings`,
);
dom.window.close();
