#!/usr/bin/env node
/**
 * 增量 e2e 入口（docs/08 §30.33）。
 *
 * 按 `SCUI_E2E_SCOPE` 决定跑哪几条 spec，作用域本身由 scripts/affected.mjs 从
 * git diff 推断（默认全量、白名单才收缩）：
 *
 *   all        → browser + visual + docs + llms（等价改造前的 test:e2e）
 *   none       → docs + llms（本轮只动文档 / 生成物，浏览器与截图链没有意义）
 *   slug,slug  → browser + visual（Demo 清单已按作用域过滤）
 *
 * 为什么需要这层包装：`SCUI_E2E_SCOPE=none` 会让 DEMO_CASES 变空，
 * browser / visual 两条就会以「no tests found」失败 —— 跳过必须发生在
 * 「要不要启动这条链」这一层，而不是在用例内部。
 */
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const scope = (process.env.SCUI_E2E_SCOPE ?? 'all').trim().toLowerCase();

const specs =
  scope === 'none'
    ? ['docs', 'llms']
    : scope === 'all'
      ? ['browser', 'visual', 'docs', 'llms']
      : ['browser', 'visual'];

console.log(`[e2e] SCUI_E2E_SCOPE=${scope} → ${specs.join(' / ')}`);

for (const name of specs) {
  const result = spawnSync(
    'pnpm',
    ['exec', 'playwright', 'test', `tests/e2e/specs/${name}.spec.ts`],
    {
      cwd: repoRoot,
      stdio: 'inherit',
      env: process.env,
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
