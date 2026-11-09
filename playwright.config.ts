import { dirname, delimiter } from 'node:path';
import { defineConfig } from '@playwright/test';

/**
 * T1-05：浏览器 / A11y / 视觉回归三条链。
 * - 单测链由 packages/core 的 Vitest + jsdom 覆盖（pnpm test）。
 * - 浏览器链与截图链在此，Demo 宿主为 apps/docs 的 ?standalone=1 独立页（T1-06 文档站）。
 * - 默认使用本机已安装的 Chrome（channel: 'chrome'），不下载 Playwright 浏览器二进制；
 *   CI 固定 Docker 镜像里若只有 bundled chromium，设 PLAYWRIGHT_USE_BUNDLED=1 即可切换。
 * - 固定字体 / locale / 时区 / 色彩方案 / reducedMotion，动画由 Demo 侧 CSS 与
 *   toHaveScreenshot({ animations: 'disabled' }) 双重关闭，满足 06 §5.3。
 */
const useBundled = process.env.PLAYWRIGHT_USE_BUNDLED === '1';
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
    ...(useBundled ? {} : { channel: 'chrome' }),
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
