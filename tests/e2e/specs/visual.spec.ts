import { expect, test } from '@playwright/test';
import { DEMO_IDS, demoPath } from '../demo-list';

/**
 * 06 §5.3 的 MVP 分档：只跑 light / ltr / default，viewport 1280 + 768。
 * dark / compact / rtl 四套矩阵属于 v1.0（Phase 6），此处不越界实现。
 */
const VIEWPORTS = [1280, 768] as const;

for (const width of VIEWPORTS) {
  test.describe(`视觉基线 light/ltr/default @${width}`, () => {
    test.use({ viewport: { width, height: 800 } });

    for (const id of DEMO_IDS) {
      test(`${id} 截图基线`, async ({ page }) => {
        await page.goto(demoPath(id));
        // §30.9 方案 B：固定 Web 字体（font-display:block）必须在截图前完成加载，
        // 否则 Chrome 会回退到系统字体，runner 字体集再次参与像素比对。
        await page.evaluate(() => document.fonts.ready.then(() => true));
        const root = page.getByTestId('demo-root');
        await expect(root).toBeVisible();
        await expect(root).toHaveAttribute('data-demo', id);
        await expect(page).toHaveScreenshot(`light-ltr-default-${id}-${width}.png`, {
          fullPage: true,
        });
      });
    }
  });
}

// T2-09：真实表单页是 §4.1 的验收项，但 T2-13 扩面前 `demoPath()` 仍写死 basic，
// 因此这里单独给 `form/real-form` 补两张截图基线（不与 `form` 的 basic 基线混名）。
// T2-13 扩成 slug × demo 后可合并回统一循环，届时迁移文件名即可。
for (const width of VIEWPORTS) {
  test.describe(`真实表单页 light/ltr/default @${width}`, () => {
    test.use({ viewport: { width, height: 800 } });

    test('form/real-form 截图基线', async ({ page }) => {
      await page.goto('/components/form/real-form?standalone=1');
      await page.evaluate(() => document.fonts.ready.then(() => true));
      const root = page.getByTestId('demo-root');
      await expect(root).toBeVisible();
      await expect(root).toHaveAttribute('data-demo', 'form');
      await expect(page).toHaveScreenshot(`light-ltr-default-form-real-${width}.png`, {
        fullPage: true,
      });
    });
  });
}
