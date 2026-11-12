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
    await expect(button).toHaveAttribute('data-scui-color', 'primary');
    await expect(button).toHaveAttribute('data-scui-variant', 'solid');
    await expect(button).toHaveAttribute('data-scui-size', 'medium');

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

  // T2-09：真实表单页（新增 / 编辑）是 §4.1 的验收项。`demoPath()` 在 T2-13
  // 扩面前只截每个 slug 的 basic，因此这条用例直接 goto 该 Demo 的独立页，
  // 用真实浏览器把「载入编辑 → 改值 → 提交校验 → 切回新增」整链跑一遍。
  test('真实表单页：新增 → 编辑 → 修改 → 提交 → 切回新增 端到端', async ({ page }) => {
    await page.goto('/components/form/real-form?standalone=1');
    const mode = page.getByTestId('real-form-mode');
    const name = page.getByTestId('real-form-name');
    const result = page.getByTestId('real-form-result');
    const cityTrigger = page.locator(
      '[data-scui-field="city"] [data-scui-primitive="select-trigger"]',
    );

    await expect(mode).toHaveText('新增');
    await expect(name).toHaveValue('');
    await expect(cityTrigger).toContainText('请选择城市');

    // 空表单提交：必填校验挂出错误文案，结果回显失败原因。
    await page.getByTestId('real-form-submit').click();
    await expect(
      page.locator('[data-scui-field="name"] [data-scui-role="field-error"]'),
    ).toHaveText('请输入姓名');
    await expect(result).toContainText('失败');

    // 载入既有记录：七类控件都由同一条 useForm 实例驱动出编辑值。
    await page.getByTestId('real-form-edit').click();
    await expect(mode).toHaveText('编辑');
    await expect(name).toHaveValue('张三');
    await expect(cityTrigger).toContainText('邯郸');
    await expect(page.locator('[data-scui-field="age"] input')).toHaveValue('32');
    await expect(page.locator('[data-scui-field="bio"] textarea')).toHaveValue(
      '负责设备维检计划的前端开发。',
    );
    await expect(page.locator('[data-scui-field="enabled"] input')).toBeChecked();
    await expect(page.locator('[data-scui-field="agree"] input')).toBeChecked();

    // 改名后提交：校验通过，快照回显新值。
    await name.fill('李四');
    await page.getByTestId('real-form-submit').click();
    await expect(result).toContainText('通过');
    await expect(result).toContainText('李四');
    await expect(
      page.locator('[data-scui-field="name"] [data-scui-role="field-error"]'),
    ).toHaveCount(0);

    // resetFields 回到底稿：控件与快照一起清空。
    await page.getByTestId('real-form-create').click();
    await expect(mode).toHaveText('新增');
    await expect(name).toHaveValue('');
    await expect(cityTrigger).toContainText('请选择城市');
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

  // T2-09：真实表单页不在 DEMO_IDS 的 basic 扫描面里，单独补一次 axe。
  // Group 字段的 id 三件套由 Group 根承担，这条用例同时守住「无重复 id」。
  test('真实表单页无 serious / critical 违规', async ({ page }) => {
    await page.goto('/components/form/real-form?standalone=1');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();
    const serious = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );
    console.log(
      `[axe] form/real-form: ${results.violations.length} violations ${results.violations
        .map((violation) => `${violation.id}(${violation.impact})×${violation.nodes.length}`)
        .join(', ')}`,
    );
    expect(
      serious.map((violation) => `${violation.id}(${violation.impact})×${violation.nodes.length}`),
    ).toEqual([]);
  });
});
