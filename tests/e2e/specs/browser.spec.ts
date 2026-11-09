import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { DEMO_IDS, demoPath } from '../demo-list';

test.describe('浏览器链：交互 / 键盘 / 焦点 / CSS', () => {
  test('Demo 清单同源：应用暴露的路由列表与 E2E 清单一致', async ({ page }) => {
    await page.goto(demoPath('overview'));
    const ids = await page.evaluate(() => document.documentElement.dataset.demoIds ?? '');
    expect(ids.split(',').filter(Boolean)).toEqual([...DEMO_IDS]);
  });

  test('Button 点击链：计数更新，禁用 / 加载态不可点击', async ({ page }) => {
    await page.goto(demoPath('button'));
    const count = page.getByTestId('click-count');
    await expect(count).toHaveText('0');
    await page.getByTestId('click-target').click();
    await expect(count).toHaveText('1');

    const disabled = page.getByRole('button', { name: 'disabled', exact: true });
    const loading = page.getByRole('button', { name: 'loading', exact: true });
    await expect(disabled).toBeDisabled();
    await expect(loading).toBeDisabled();
    await expect(loading).toHaveAttribute('aria-busy', 'true');
    await expect(count).toHaveText('1');
  });

  test('Button 键盘路径：Tab 进入 + 焦点环 + Enter / Space 触发', async ({ page }) => {
    await page.goto(demoPath('button'));
    await page.keyboard.press('Tab');
    const first = page.getByTestId('first-focusable');
    await expect(first).toBeFocused();

    const outline = await first.evaluate((element) => {
      const style = getComputedStyle(element);
      return [style.outlineStyle, style.outlineWidth, style.outlineColor].join('|');
    });
    expect(outline).toContain('solid');
    expect(outline).toContain('2px');
    expect(outline).toContain('rgb(45, 102, 245)');

    const target = page.getByTestId('keyboard-target');
    const count = page.getByTestId('keyboard-count');
    await target.focus();
    await expect(count).toHaveText('0');
    await page.keyboard.press('Enter');
    await expect(count).toHaveText('1');
    await page.keyboard.press('Space');
    await expect(count).toHaveText('2');
  });

  test('Link 键盘路径：Tab 进入 + Enter 激活锚点', async ({ page }) => {
    await page.goto(demoPath('typography'));
    const link = page.getByTestId('keyboard-link');
    await page.keyboard.press('Tab');
    await expect(link).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/typography-anchor/);
  });

  test('Sider 折叠触发器键盘可达且 aria-expanded 同步', async ({ page }) => {
    await page.goto(demoPath('layout'));
    const trigger = page.getByRole('button', { name: '切换侧边栏' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('CSS 产物生效：token 变量、默认色 primary、尺寸口径', async ({ page }) => {
    await page.goto(demoPath('button'));
    const button = page.getByTestId('default-primary');
    const background = await button.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    expect(background).toBe('rgb(45, 102, 245)');
    await expect(button).toHaveAttribute('data-color', 'primary');
    await expect(button).toHaveAttribute('data-variant', 'solid');
    await expect(button).toHaveAttribute('data-size', 'medium');

    const primary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--scui-color-primary').trim(),
    );
    expect(primary).toBe('#2d66f5');
  });

  test('375px 不溢出冒烟（仅冒烟，不作移动端适配验收）', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    for (const id of DEMO_IDS) {
      await page.goto(demoPath(id));
      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(metrics.scrollWidth, `${id} 出现横向溢出`).toBeLessThanOrEqual(
        metrics.clientWidth + 1,
      );
    }
  });
});

test.describe('A11y 链：axe 扫描', () => {
  test('全部 Demo 无 serious / critical 违规', async ({ page }) => {
    const blocking: string[] = [];
    for (const id of DEMO_IDS) {
      await page.goto(demoPath(id));
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
        .analyze();
      const serious = results.violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical',
      );
      const summary = results.violations
        .map((violation) => `${violation.id}(${violation.impact})×${violation.nodes.length}`)
        .join(', ');
      console.log(`[axe] ${id}: ${results.violations.length} violations ${summary}`);
      if (serious.length > 0) {
        for (const violation of serious) {
          for (const node of violation.nodes.slice(0, 4)) {
            const reason = (node.failureSummary ?? '').replaceAll('\n', ' ').slice(0, 200);
            console.log(`[axe]   ${violation.id} ${JSON.stringify(node.target)} :: ${reason}`);
          }
        }
        blocking.push(
          `${id}: ${serious
            .map((violation) => `${violation.id}(${violation.impact})×${violation.nodes.length}`)
            .join(', ')}`,
        );
      }
    }
    expect(blocking, `serious/critical 违规：\n${blocking.join('\n')}`).toEqual([]);
  });
});
