import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { DEMO_IDS, demoPath } from '../demo-list';

type CatalogShape = {
  slugs: string[];
  components: { slug: string; title: string; demos: { name: string; path: string }[] }[];
  designPages: { slug: string; title: string }[];
};
type DemoSourceShape = { path: string; source: string; html: string };
type ApiShape = { source: string; interfaces: { props: { name: string }[] }[] };

const readSource = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8').trimEnd();

/** 生成物是外部 JSON，用运行时类型守卫收敛，不做类型断言。 */
const readGenerated = (path: string): unknown =>
  JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isCatalogShape = (value: unknown): value is CatalogShape =>
  isRecord(value) &&
  Array.isArray(value.slugs) &&
  Array.isArray(value.components) &&
  Array.isArray(value.designPages);

const isDemoSourceShape = (value: unknown): value is DemoSourceShape =>
  isRecord(value) &&
  typeof value.path === 'string' &&
  typeof value.source === 'string' &&
  typeof value.html === 'string';

const isApiShape = (value: unknown): value is ApiShape =>
  isRecord(value) && typeof value.source === 'string' && Array.isArray(value.interfaces);

const catalogValue = readGenerated('apps/docs/src/generated/catalog.json');
if (!isCatalogShape(catalogValue)) throw new Error('[docs.spec] catalog.json 结构异常');
const catalog: CatalogShape = catalogValue;

test.describe('T1-06 文档站：路由可访问', () => {
  test('02 §12.1 全量路由 + 404 兜底', async ({ page }) => {
    const routes: [string, string][] = [
      ['/', 'page-home'],
      ['/docs/getting-started', 'page-getting-started'],
      ['/changelog', 'page-changelog'],
      ['/components/button', 'page-component'],
      ['/components/button/basic', 'page-demo'],
      ['/no-such-page', 'page-not-found'],
    ];
    for (const pageMeta of catalog.designPages) {
      routes.push([`/docs/design/${pageMeta.slug}`, 'page-design']);
    }
    for (const component of catalog.components) {
      routes.push([`/components/${component.slug}`, 'page-component']);
    }

    for (const [path, testId] of routes) {
      const response = await page.goto(path);
      expect(response?.status(), `${path} HTTP 状态`).toBe(200);
      await expect(page.getByTestId(testId), `${path} 页面挂载`).toBeVisible();
      await expect(page.getByTestId('docs-app'), `${path} 站点布局`).toBeVisible();
    }
  });

  test('独立 Demo 页无站点 chrome，且与 E2E 清单同源', async ({ page }) => {
    for (const id of DEMO_IDS) {
      await page.goto(demoPath(id));
      await expect(page.getByTestId('demo-root')).toHaveAttribute('data-demo', id);
      await expect(page.getByTestId('docs-app')).toHaveCount(0);
    }
  });
});

test.describe('T1-06 文档站：Demo 与源码同源', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('展示的源码 / 复制的 ?raw 源码 / 磁盘文件三者一致', async ({ page }) => {
    const button = catalog.components.find((item) => item.slug === 'button');
    const basic = button?.demos.find((item) => item.name === 'basic');
    if (!basic) throw new Error('[docs.spec] catalog 必须有 button/basic');
    const disk = readSource(basic.path);
    const key = 'button/basic';

    await page.goto('/components/button');
    await page.getByTestId(`source-toggle-${key}`).click();

    // ① 页面展示的 Shiki 高亮文本 = 磁盘源码（生成脚本读同一文件）。
    const shown =
      (await page.getByTestId(`source-html-${key}`).locator('code').textContent()) ?? '';
    expect(shown.trimEnd(), '展示源码与磁盘文件不一致').toBe(disk);

    // ② 生成物里的 source 字段也来自同一文件。
    const generatedValue = readGenerated('apps/docs/src/generated/demos/button-basic.json');
    if (!isDemoSourceShape(generatedValue)) {
      throw new Error('[docs.spec] button-basic.json 结构异常');
    }
    const generated: DemoSourceShape = generatedValue;
    expect(generated.source.trimEnd()).toBe(disk);
    expect(generated.path).toBe(basic.path);
    expect(generated.html).toContain('shiki');

    // ③ 复制按钮复制的是 Vite ?raw 读到的同一份源码。
    await page.getByTestId(`source-copy-${key}`).click();
    await expect(page.getByTestId(`source-copy-${key}`)).toHaveAttribute('data-copied', '1');
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard.trimEnd(), '?raw 源码与磁盘文件不一致').toBe(disk);
  });

  test('每个 Demo 都有独立页链接且可打开', async ({ page }) => {
    await page.goto('/components/button');
    const button = catalog.components.find((item) => item.slug === 'button');
    expect(button?.demos.length).toBeGreaterThanOrEqual(3);
    for (const demo of button?.demos ?? []) {
      const key = `button/${demo.name}`;
      await expect(page.getByTestId(`demo-card-${key}`)).toBeVisible();
      const href = await page.getByTestId(`standalone-link-${key}`).getAttribute('href');
      expect(href).toContain(`/components/button/${demo.name}?standalone=1`);
    }
  });
});

test.describe('T1-06 文档站：API 表 / 搜索 / 全局设置', () => {
  test('API 表由 types.ts 生成，默认值来自 JSDoc @default', async ({ page }) => {
    await page.goto('/components/button');
    const table = page.getByTestId('api-table');
    await expect(table).toHaveAttribute('data-api', 'button');
    await expect(table.locator('[data-prop="variant"]')).toContainText("'solid'");
    await expect(table.locator('[data-prop="color"]')).toContainText("'primary'");
    await expect(table.locator('[data-prop="loading"]')).toContainText('false');

    const apiValue = readGenerated('apps/docs/src/generated/api/button.json');
    if (!isApiShape(apiValue)) throw new Error('[docs.spec] api/button.json 结构异常');
    const api: ApiShape = apiValue;
    expect(api.source).toContain('components/button/types.ts');
    await expect(table.locator('[data-prop]')).toHaveCount(api.interfaces[0]?.props.length ?? 0);
  });

  test('Fuse.js 搜索命中组件并跳转', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('search-input').fill('栅格');
    await expect(page.getByTestId('search-result').first()).toBeVisible();
    const href = await page.getByTestId('search-result').first().getAttribute('href');
    expect(href).toMatch(/\/(components|docs)\//);
    await page.getByTestId('search-result').first().click();
    await expect(page.getByTestId('search-input')).toHaveValue('');
    await expect(page).toHaveURL(/components|docs/);
  });

  test('主题 / 密度 / 方向切换真实写入 data-scui-* 契约', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('setting-theme').selectOption('dark');
    await page.getByTestId('setting-density').selectOption('compact');
    await page.getByTestId('setting-direction').selectOption('rtl');
    const attributes = await page.evaluate(() => ({
      theme: document.documentElement.getAttribute('data-scui-theme'),
      density: document.documentElement.getAttribute('data-scui-density'),
      direction: document.documentElement.getAttribute('data-scui-direction'),
    }));
    expect(attributes).toEqual({ theme: 'dark', density: 'compact', direction: 'rtl' });
    await expect(page.getByTestId('docs-version')).toBeVisible();
  });
});

test.describe('T1-06 文档站：A11y', () => {
  test('站点主页面无 serious / critical 违规', async ({ page }) => {
    const blocking: string[] = [];
    for (const path of [
      '/',
      '/docs/getting-started',
      '/docs/design/tokens',
      '/components/button',
      '/components/overview',
      '/changelog',
    ]) {
      await page.goto(path);
      // SPA 的动态 chunk 可能晚于 goto 返回；等站点根节点挂载后再扫，避免扫到空 DOM 假报。
      await expect(page.getByTestId('docs-app')).toBeVisible();
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
        .analyze();
      const serious = results.violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical',
      );
      console.log(
        `[axe:docs] ${path}: ${results.violations.length} violations ${results.violations.map((v) => `${v.id}(${v.impact})×${v.nodes.length}`).join(', ')}`,
      );
      for (const violation of results.violations) {
        for (const node of violation.nodes.slice(0, 2)) {
          const reason = (node.failureSummary ?? '').replaceAll('\n', ' ').slice(0, 160);
          console.log(
            `[axe:docs]   ${path} ${violation.id} ${JSON.stringify(node.target)} :: ${reason}`,
          );
        }
      }
      for (const violation of serious) {
        blocking.push(`${path}: ${violation.id}×${violation.nodes.length}`);
      }
    }
    expect(blocking, `serious/critical 违规：\n${blocking.join('\n')}`).toEqual([]);
  });
});
