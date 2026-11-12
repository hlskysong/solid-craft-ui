import { expect, test } from '@playwright/test';
import { CATALOG_DEMO_TOTAL, DEMO_CASES, demoCaseId } from '../demo-list';

/**
 * 覆盖守卫（不截图，只查清单本身）：
 * 1. `DEMO_CASES` 的条数必须等于 catalog 里的 Demo 总数 —— 两条独立路径各自算一遍，
 *    防止有人把清单截断成「每组件只取首 Demo」后，截图仍全绿而覆盖面悄悄缩水；
 * 2. `slug-demo` 组合必须唯一 —— 它同时是截图文件名，重名会让两张基线互相覆盖。
 */
test('清单覆盖守卫：DEMO_CASES 未被截断且 id 唯一', () => {
  expect(DEMO_CASES.length).toBe(CATALOG_DEMO_TOTAL);
  const ids = DEMO_CASES.map(demoCaseId);
  expect(new Set(ids).size).toBe(ids.length);
});

/**
 * 06 §5.3 的 MVP 分档：只跑 light / ltr / default，viewport 1280 + 768。
 * dark / compact / rtl 四套矩阵属于 v1.0（Phase 6），此处不越界实现。
 *
 * T2-13 扩面（docs/08 §30.31）：循环单元从「组件」改为「组件 × Demo」。
 * 基线文件名固定为 `light-ltr-default-<slug>-<demo>-<width>.png`，
 * `scripts/check-ci.mjs` 会按 catalog 反算这份名单，多一张 / 少一张都红灯。
 */
const VIEWPORTS = [1280, 768] as const;

for (const width of VIEWPORTS) {
  test.describe(`视觉基线 light/ltr/default @${width}`, () => {
    test.use({ viewport: { width, height: 800 } });

    for (const item of DEMO_CASES) {
      const id = demoCaseId(item);
      test(`${id} 截图基线`, async ({ page }) => {
        await page.goto(item.path);
        // §30.9 方案 B：固定 Web 字体（font-display:block）必须在截图前完成加载，
        // 否则 Chrome 会回退到系统字体，runner 字体集再次参与像素比对。
        await page.evaluate(() => document.fonts.ready.then(() => true));
        const root = page.getByTestId('demo-root');
        await expect(root).toBeVisible();
        await expect(root).toHaveAttribute('data-demo', item.slug);
        // 宿主在 Demo 名对不上时会回落到首 Demo；不断言这一项就会「截图成功、截错页面」。
        await expect(root).toHaveAttribute('data-demo-name', item.demo);
        await expect(page).toHaveScreenshot(`light-ltr-default-${id}-${width}.png`, {
          fullPage: true,
        });
      });
    }
  });
}
