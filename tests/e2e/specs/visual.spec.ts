import { expect, test } from '@playwright/test';
import { CATALOG_DEMO_TOTAL, DEMO_CASES, E2E_FILTERED, demoCaseId } from '../demo-list';

/**
 * 覆盖守卫（不截图，只查清单本身）：
 * 1. `DEMO_CASES` 的条数必须等于 catalog 里的 Demo 总数 —— 两条独立路径各自算一遍，
 *    防止有人把清单截断成「每组件只取首 Demo」后，截图仍全绿而覆盖面悄悄缩水；
 * 2. `slug-demo` 组合必须唯一 —— 它同时是截图文件名，重名会让两张基线互相覆盖。
 *
 * §30.33 增量模式下 `DEMO_CASES` 本来就只有受影响组件的子集，两条断言都不成立，
 * 因此整条用例跳过；全量覆盖由 main 的夜间 / tag 全量 run 与本机 `pnpm verify` 保证。
 */
test('清单覆盖守卫：DEMO_CASES 未被截断且 id 唯一', () => {
  test.skip(E2E_FILTERED, '增量模式只跑受影响组件，全量比对留给全量 run（§30.33）');
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

/**
 * 浮层打开态的受控容差（docs/08 §30.50，Aming 2026-11-16 裁决）。
 *
 * 背景：跨平台 / 跨 macOS 大版本的文字栅格化差异属于环境噪声，工程上应当接受；
 * 但「接受」必须是**有界**且**不能顺带放过真实回归**，所以这里只做两件事：
 * 1. 只对首屏即打开的浮层 Demo（用例 id 以 `-open-state` 结尾）放开绝对像素上限，
 *    其余 200+ 张基线仍走 `playwright.config.ts` 的全局 `maxDiffPixelRatio: 0.002`；
 * 2. 用下方的「浮层排版结构断言」把文案 / 字体族 / 字号 / 字重 / 颜色逐项钉死，
 *    容差只吸收抗锯齿与笔画粗细，文字消失、换字体、字号变化都过不去。
 *
 * 上限取绝对值而非比例：实测三个浮层的差异像素与视口无关（1280 / 768 都是
 * 2496 / 2170 / 2618 px，占比 0.0021~0.0026），绝对上限才对得上这个物理量；
 * 4000 约为实测最坏值的 1.5 倍，再大就该按真实回归查，而不是继续放水。
 */
const OVERLAY_MAX_DIFF_PIXELS = 4000;

/**
 * 浮层用例还要显式给出比例上限，否则绝对上限不生效：
 * Playwright 的比对逻辑是 `maxDiffPixels = Math.min(maxDiffPixels, ratio × 总面积)`
 * （playwright-core `coreBundle.js` 的 compareImages），全局 0.002 在 1280×800 上折算
 * 2048 px，会把 4000 压回 2048 —— 等于容差根本没放开。0.01 在 1280×800 折 10240 px、
 * 768×800 折 6144 px，两档都高于 4000，于是**真正生效的是 4000 这个绝对上限**。
 */
const OVERLAY_MAX_DIFF_PIXEL_RATIO = 0.01;

/** 首屏即打开的浮层 Demo：Portal 到 body，天然带一层浮层合成。 */
const isOverlayOpenState = (id: string): boolean => id.endsWith('-open-state');

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
          // 只有浮层打开态拿到有界容差；其余用例保持全局 0.002 不放宽。
          ...(isOverlayOpenState(id)
            ? {
                maxDiffPixels: OVERLAY_MAX_DIFF_PIXELS,
                maxDiffPixelRatio: OVERLAY_MAX_DIFF_PIXEL_RATIO,
              }
            : {}),
        });
      });
    }
  });
}

/**
 * 浮层排版结构断言（docs/08 §30.50）：有界容差必须配结构证据，否则「文字被换掉 /
 * 字号变了 / 颜色变了」只要像素量在 4000 以内就会被容差悄悄放过。
 *
 * 这里逐项钉住四类事实：
 * 1. 浮层确实 Portal 到 `.demo-root` 之外 —— 这正是「不钉字体就落回系统 PingFang」的成因；
 * 2. 文案逐字比对 —— 文字消失 / 被替换 / 少字都红灯；
 * 3. 字体族必须命中仓库内固定字体 `SCUI Visual` —— 有人删掉 base.css 的浮层字体补丁时，
 *    这条比像素更早、更准地报错（像素只会「变了一点点」）；
 * 4. 字号 / 字重 / 颜色精确比对 —— 排版 token 变化不允许藏在容差里。
 */
interface OverlayTypography {
  /** 组件 slug，同时决定 `/components/<slug>/open-state?standalone=1` 路径。 */
  readonly slug: string;
  /** 浮层根节点的 `data-scui-role`。 */
  readonly rootRole: string;
  /** 承载标题文字的 `data-scui-role`。 */
  readonly headingRole: string;
  /** 标题文案（逐字比对）。 */
  readonly heading: string;
  /** 正文关键句（`toContainText`，覆盖标题之外的正文）。 */
  readonly body: string;
  readonly fontSize: string;
  readonly fontWeight: string;
  readonly color: string;
}

const OVERLAY_TYPOGRAPHY: readonly OverlayTypography[] = [
  {
    slug: 'modal',
    rootRole: 'modal',
    headingRole: 'modal-title',
    heading: '打开态视觉基线',
    body: '遮罩、内容、标题、正文与默认底部操作区在这一页同时参与基线截图。',
    fontSize: '16px',
    fontWeight: '700',
    color: 'rgba(0, 0, 0, 0.88)',
  },
  {
    slug: 'drawer',
    rootRole: 'drawer',
    headingRole: 'drawer-title',
    heading: '打开态视觉基线',
    body: '遮罩、贴边容器、标题、正文与底部操作区在这一页同时参与基线截图。',
    fontSize: '16px',
    fontWeight: '700',
    color: 'rgba(0, 0, 0, 0.88)',
  },
  {
    slug: 'popconfirm',
    rootRole: 'popconfirm',
    headingRole: 'popconfirm-title',
    heading: '确认删除这条采购明细？',
    body: '删除后不可恢复，请确认本次采购数量与本次采购单价。',
    fontSize: '21px',
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.88)',
  },
  {
    slug: 'tooltip',
    rootRole: 'tooltip',
    headingRole: 'tooltip',
    heading: '本次采购数量按年度维简计划填写，提交后进入审批流。',
    body: '本次采购数量按年度维简计划填写，提交后进入审批流。',
    fontSize: '13px',
    fontWeight: '400',
    color: 'rgba(0, 0, 0, 0.88)',
  },
];

test.describe('浮层打开态：排版结构断言（容差的结构证据）', () => {
  for (const item of OVERLAY_TYPOGRAPHY) {
    test(`${item.slug} 打开态文案与排版未回归`, async ({ page }) => {
      await page.goto(`/components/${item.slug}/open-state?standalone=1`);
      await page.evaluate(() => document.fonts.ready.then(() => true));

      const overlay = page.locator(`[data-scui-role="${item.rootRole}"]`);
      await expect(overlay).toBeVisible();
      await expect(overlay).toContainText(item.body);

      // 1. Portal 到宿主根之外，是本节所有字体约束的前提
      const insideDemoRoot = await overlay.evaluate(
        (element) => document.querySelector('.demo-root')?.contains(element) ?? false,
      );
      expect(insideDemoRoot).toBe(false);

      // 2. 文案逐字比对
      const heading = page.locator(`[data-scui-role="${item.headingRole}"]`);
      await expect(heading).toHaveText(item.heading);

      // 3. 字体族必须命中仓库内固定字体；4. 字号 / 字重 / 颜色精确比对
      const metrics = await heading.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          color: style.color,
        };
      });
      expect(metrics.fontFamily).toContain('SCUI Visual');
      expect(metrics.fontSize).toBe(item.fontSize);
      expect(metrics.fontWeight).toBe(item.fontWeight);
      expect(metrics.color).toBe(item.color);

      // 固定字体必须真的加载完成：`sans-serif` 兜底会让像素与字体族断言同时失真
      const fontLoaded = await page.evaluate(() => document.fonts.check('16px "SCUI Visual"'));
      expect(fontLoaded).toBe(true);
    });
  }
});
