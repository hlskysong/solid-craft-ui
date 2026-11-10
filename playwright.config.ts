import { dirname, delimiter } from 'node:path';
import { defineConfig } from '@playwright/test';

/**
 * T1-05：浏览器 / A11y / 视觉回归三条链。
 * - 单测链由 packages/core 的 Vitest + jsdom 覆盖（pnpm test）。
 * - 浏览器链与截图链在此，Demo 宿主为 apps/docs 的 ?standalone=1 独立页（T1-06 文档站）。
 * - 渲染引擎固定为 Playwright 自带的 bundled chromium（版本由 pnpm-lock.yaml 锁定）：
 *   本机与 CI 都执行 `pnpm exec playwright install chromium --no-shell` 装同一 build；显式用
 *   channel:'chromium' 走完整 build 的 new headless 模式，不依赖额外的 headless-shell 下载。
 *   2026-11-10 前默认 channel:'chrome' 用系统 Chrome，CI runner 与本机 Chrome 版本
 *   不同，导致 5 张截图出现 ratio 0.01 像素差、Full gate 连续 5 次失败（docs/08 §30.8）。
 *   仅本地排查时可设 PLAYWRIGHT_USE_SYSTEM_CHROME=1 临时切回系统 Chrome，CI 不得使用。
 * - 固定字体 / locale / 时区 / 色彩方案 / reducedMotion，动画由 Demo 侧 CSS 与
 *   toHaveScreenshot({ animations: 'disabled' }) 双重关闭，满足 06 §5.3。
 */
const useSystemChrome = process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === '1';
const nodeBinDir = dirname(process.execPath);

export default defineConfig({
  testDir: './tests/e2e/specs',
  outputDir: 'test-results/e2e',
  snapshotPathTemplate: 'tests/e2e/baselines/{arg}{ext}',
  fullyParallel: false,
  workers: 1,
  forbidOnly: process.env.CI === 'true',
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      threshold: 0.2,
      maxDiffPixelRatio: 0.002,
    },
  },
  use: {
    ...(useSystemChrome ? { channel: 'chrome' } : { channel: 'chromium' }),
    headless: true,
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    colorScheme: 'light',
    reducedMotion: 'reduce',
    // 环境启用了批量删除防护：retain-on-failure 会为每个用例录临时 trace，
    // 通过后的清理若一次涉及 >50 个文件会被拦截，残留又会让下一段 spec 启动时的
    // outputDir 清理再次失败。retries=0 时仅重试录制等价于不产临时文件；
    // 失败诊断已有截图 diff + HTML report，将来开启 retries 会自动恢复 trace。
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm --filter solid-craft-ui-docs dev',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: process.env.CI !== 'true',
    timeout: 120_000,
    // 保证 webServer 子进程与当前 Playwright 用同一套 Node / pnpm（本机 fnm v26.12.1）。
    env: {
      PATH: `${nodeBinDir}${delimiter}${process.env.PATH ?? ''}`,
    },
  },
});
