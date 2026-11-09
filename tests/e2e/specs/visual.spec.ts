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
