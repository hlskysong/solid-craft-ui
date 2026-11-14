import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { DEMO_CASES, DEMO_IDS, demoCaseId, demoPath } from '../demo-list';

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
    // T2-13：先等宿主挂载再按 Tab。Demo 模块从 39 涨到 53 个后首帧变慢，
    // 「goto 后立刻 Tab」会打在空文档上（activeElement 落 body），
    // 焦点就永远到不了第一个可聚焦元素 —— 这是用例的竞态，不是组件的键盘缺陷。
    await expect(page.getByTestId('demo-root')).toBeVisible();
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
    await expect(page.getByTestId('demo-root')).toBeVisible();
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

  // T2-13：按「组件 × Demo」逐页扫，窄屏溢出往往是某个 Demo 单独引入的
  //（例如多列栅格 / 双输入控件），只扫 basic 会整片漏掉。
  //
  // 2026-11-12（CI 首次红灯）：**每个 Demo 单独一条用例**，不再「一条用例循环 N 页」。
  // 单条用例的 30s 预算按「一页工作量」设计，53 次 goto 在 CI runner 上要 15.8s、
  // axe 那条直接 31.1s 超时炸掉（本机 M4 只要 1/3 时间，本地永远复现不了）。
  // 拆开后每条各自计 30s，组件数涨到 30+ 也不会再撞天花板，失败还直接指名是哪个 Demo。
  for (const item of DEMO_CASES) {
    test(`375px 不溢出：${demoCaseId(item)}`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto(item.path);
      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(metrics.scrollWidth, `${demoCaseId(item)} 出现横向溢出`).toBeLessThanOrEqual(
        metrics.clientWidth + 1,
      );
    });
  }

  // T3-05：`docs/08 §4.2` 给这批的验收原话是「骨架与真实内容同尺寸、切换不产生布局抖动」。
  // jsdom 没有布局引擎，单测只能验结构；「同高」必须用真实浏览器量 —— 而且是量
  // 骨架与文本各自的盒高，两侧列容器设了 `align-items: flex-start`，不允许 flex 拉伸凑出等高。
  test('Skeleton 骨架与真实文本同高：三行骨架 = 三行正文', async ({ page }) => {
    await page.goto('/components/skeleton/loading?standalone=1');
    const skeletonBox = await page.getByTestId('skeleton-column').boundingBox();
    const textBox = await page.getByTestId('text-column').boundingBox();
    expect(skeletonBox, '骨架列未渲染').not.toBeNull();
    expect(textBox, '文本列未渲染').not.toBeNull();
    const delta = Math.abs((skeletonBox?.height ?? 0) - (textBox?.height ?? 0));
    expect(delta, `骨架高 ${skeletonBox?.height} / 文本高 ${textBox?.height}`).toBeLessThanOrEqual(
      1,
    );
  });

  // T3-05：`docs/08 §4.2` 另一条验收是「Spin 延迟显示可测」。单测已用假定时器验过时序，
  // 这里用真实计时确认「假定时器里对、真实浏览器里也对」—— 两条路径的失败模式不同
  // （前者漏的是调度契约，后者漏的是 effect 没在真实渲染里跑）。
  test('Spin 延迟显示：400ms 内不闪、到点才出遮罩、取消后不再出现', async ({ page }) => {
    await page.goto('/components/spin/delay?standalone=1');
    const overlay = page.locator('[data-scui-role="spin-overlay"]');

    await page.getByRole('button', { name: '开始加载' }).click();
    // 点击后立刻读：延迟期内必须是 0，否则短请求会被遮罩闪一下
    await expect(overlay).toHaveCount(0);

    await expect(overlay).toHaveCount(1, { timeout: 2000 });

    await page.getByRole('button', { name: '立即结束' }).click();
    await expect(overlay).toHaveCount(0);
    // 再多等一个延迟周期：确认没有野定时器把遮罩重新打开
    await page.waitForTimeout(600);
    await expect(overlay).toHaveCount(0);
  });

  // T3-06：basic Demo 里第二张表是 `loading`。SSR 入口已验过遮罩首帧存在，
  // 这条专门确认真实浏览器（CSR / hydration 之后）也渲染出 Spin 且遮罩可见，
  // 避免「服务端有、客户端没有」的半截实现。
  test('Table 加载态在真实浏览器渲染 Spin 遮罩', async ({ page }) => {
    await page.goto('/components/table/basic?standalone=1');
    const overlay = page.locator('[data-scui-role="table-loading"]');
    await expect(overlay).toHaveCount(1);
    await expect(page.locator('[data-scui-role="spin"]')).toHaveCount(1);
    const metrics = await overlay.evaluate((element) => {
      const style = getComputedStyle(element);
      return { display: style.display, height: element.getBoundingClientRect().height };
    });
    expect(metrics.display).toBe('flex');
    expect(metrics.height).toBeGreaterThan(0);
  });

  // T3-06：jsdom 能验状态合流，但「footer 真的在 overflow-x 容器外」是布局事实，
  // 必须在真实浏览器里量。客户端分页还要确认翻页后 DOM 行集合与 onChange 文案同源。
  test('Table 客户端分页：翻页切行、三参文案同步、footer 不在滚动容器内', async ({ page }) => {
    await page.goto('/components/table/pagination-client?standalone=1');
    const rows = page.locator('[data-scui-row-key]');
    await expect(rows).toHaveCount(5);
    await expect(rows.first()).toHaveAttribute('data-scui-row-key', 'A01');

    await page.locator('[data-scui-page="2"]').click();
    await expect(rows.first()).toHaveAttribute('data-scui-row-key', 'A06');
    await expect(page.locator('output')).toContainText('第 2 页 / 每页 5 条 / 共 12 条');

    const layout = await page.evaluate(() => {
      const scroll = document.querySelector('[data-scui-role="table-scroll"]');
      const footer = document.querySelector('[data-scui-role="table-footer"]');
      return {
        footerInsideScroll: scroll?.contains(footer) ?? true,
        overflowX: scroll === null ? '' : getComputedStyle(scroll).overflowX,
      };
    });
    expect(layout.footerInsideScroll, '分页不能放进横向滚动容器').toBe(false);
    expect(layout.overflowX).toBe('auto');
  });

  // T3-06：server 模式表内一行都不切，业务侧拿 onChange.pagination 请求后回写 data。
  // 这条验的是「参数出口 → 回写 → 视图」整链，单测只验到参数出口为止。
  test('Table 服务端分页：请求参数直接驱动当前页数据', async ({ page }) => {
    await page.goto('/components/table/pagination-server?standalone=1');
    const rows = page.locator('[data-scui-row-key]');
    await expect(rows).toHaveCount(5);
    await expect(rows.first()).toHaveAttribute('data-scui-row-key', 'A01');

    await page.locator('[data-scui-page="2"]').click();
    await expect(page.locator('output')).toContainText('page=2&pageSize=5&total=12');
    await expect(rows.first()).toHaveAttribute('data-scui-row-key', 'A06');
  });

  // T3-06：空 / 加载占位切换。加载遮罩只挡鼠标，分页还必须收到 disabled，
  // 否则键盘 Tab 仍能在加载中翻页 —— 这条把两者一起验掉。
  test('Table 空态与加载态互斥切换，加载中分页禁用', async ({ page }) => {
    await page.goto('/components/table/empty-loading?standalone=1');
    const emptyRow = page.locator('[data-scui-role="table-empty-row"]');
    const loading = page.locator('[data-scui-role="table-loading"]');
    await expect(emptyRow).toHaveCount(1);
    await expect(loading).toHaveCount(0);

    await page.getByTestId('state-loading').click();
    await expect(loading).toHaveCount(1);
    await expect(page.locator('[data-scui-role="spin"]')).toHaveCount(1);
    await expect(emptyRow).toHaveCount(0);
    await expect(page.locator('[data-scui-role="pagination"]')).toHaveAttribute(
      'data-scui-disabled',
      '',
    );

    await page.getByTestId('state-ready').click();
    await expect(page.locator('[data-scui-row-key]')).toHaveCount(3);
    await expect(emptyRow).toHaveCount(0);
    await expect(loading).toHaveCount(0);
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

  // T2-10：日历只在 open 时挂载，basic 静态扫描看不到它，交互路径单独钉住。
  test('DatePicker 日历：点格取值、方向键移动、Esc 关闭', async ({ page }) => {
    await page.goto(demoPath('date-picker'));
    // input 的 role 是 combobox（可编辑 combobox + dialog 弹层），不是 textbox。
    const input = page.getByRole('combobox', { name: '入职日期（非受控）' });
    const calendar = page.locator('[data-scui-role="calendar"]');
    await expect(input).toHaveValue('2026-03-15');

    await input.click();
    await expect(calendar).toBeVisible();
    await expect(calendar.locator('button[data-scui-day]')).toHaveCount(42);

    await page.locator('button[data-scui-day="2026-03-20"]').click();
    await expect(input).toHaveValue('2026-03-20');
    await expect(calendar).toHaveCount(0);

    await input.click();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('2026-03-21');

    await input.click();
    await expect(calendar).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(calendar).toHaveCount(0);
  });

  // T2-11：区间控件的两段落点与 hover 预览只能在真实指针下验 —— jsdom 没有布局，
  // `pointerenter` 只能手动派发，这里补一条真实浏览器链路。
  test('RangePicker 区间：两段落点、悬停预览、Tab 交接焦点', async ({ page }) => {
    await page.goto(demoPath('range-picker'));
    const group = page.getByRole('group', { name: '出差日期范围' });
    const start = group.getByRole('combobox', { name: '开始日期' });
    const end = group.getByRole('combobox', { name: '结束日期' });
    const calendar = group.locator('[data-scui-role="range-calendar"]');

    await expect(start).toHaveValue('2026-03-10');
    await expect(end).toHaveValue('2026-03-20');

    await start.click();
    await expect(calendar).toBeVisible();
    await expect(calendar.locator('button[data-scui-day]')).toHaveCount(42);

    // 起点 → 悬停预览 → 终点：中间格必须出现区间标记，终点落点后弹层关闭
    await group.locator('button[data-scui-day="2026-03-12"]').click();
    await group.locator('button[data-scui-day="2026-03-18"]').hover();
    await expect(group.locator('button[data-scui-day="2026-03-15"]')).toHaveAttribute(
      'data-scui-in-range',
      '',
    );

    await group.locator('button[data-scui-day="2026-03-18"]').click();
    await expect(start).toHaveValue('2026-03-12');
    await expect(end).toHaveValue('2026-03-18');
    await expect(calendar).toHaveCount(0);

    // 焦点管理：弹层内 Tab 把焦点交给终点输入框，弹层保持展开；Esc 才关闭
    await start.click();
    await expect(calendar).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(end).toBeFocused();
    await expect(calendar).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(calendar).toHaveCount(0);
  });
});

test.describe('A11y 链：axe 扫描', () => {
  // T2-13：扫描面从「每组件 basic」扩到「组件 × Demo」。真实表单页
  // （form/real-form）与各组件非首 Demo 都在这条循环里，不再单开用例 ——
  // 单开意味着每新增一个 Demo 就要人肉记得加一条，迟早漏。
  //
  // 2026-11-12（CI 首次红灯）：循环体改为生成**每 Demo 一条用例**。原实现是
  // 「一条用例内 for 循环 53 次 goto + axe」，CI 实测 31.1s > 30s 默认超时，
  // 卡在最后一页 form/layout 上（前 50 页全是 0 violations，不是 a11y 回归，
  // 纯粹是单条用例吃不下 53 页工作量）。生成式展开既保留「不需要人肉加用例」
  // 的性质，又让每条用例独立计时、独立报告失败。
  for (const item of DEMO_CASES) {
    const id = demoCaseId(item);
    test(`axe 扫描：${id} 无 serious / critical 违规`, async ({ page }) => {
      await page.goto(item.path);
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
      for (const violation of serious) {
        for (const node of violation.nodes.slice(0, 4)) {
          const reason = (node.failureSummary ?? '').replaceAll('\n', ' ').slice(0, 200);
          console.log(`[axe]   ${violation.id} ${JSON.stringify(node.target)} :: ${reason}`);
        }
      }
      expect(
        serious.map(
          (violation) => `${violation.id}(${violation.impact})×${violation.nodes.length}`,
        ),
        `${id} serious/critical 违规`,
      ).toEqual([]);
    });
  }

  // T2-10：日历弹层同样只在展开时存在，必须在 open 之后单独扫一次
  // （role=grid / gridcell / roving tabindex 的 ARIA 组合才第一次真正参与计算）。
  test('DatePicker 展开日历后无 serious / critical 违规', async ({ page }) => {
    await page.goto(demoPath('date-picker'));
    await page.getByRole('combobox', { name: '入职日期（非受控）' }).click();
    await expect(page.locator('[data-scui-role="calendar"]')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();
    const serious = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );
    console.log(
      `[axe] date-picker/open: ${results.violations.length} violations ${results.violations
        .map((violation) => `${violation.id}(${violation.impact})×${violation.nodes.length}`)
        .join(', ')}`,
    );
    for (const violation of serious) {
      for (const node of violation.nodes.slice(0, 4)) {
        const reason = (node.failureSummary ?? '').replaceAll('\n', ' ').slice(0, 200);
        console.log(`[axe]   ${violation.id} ${JSON.stringify(node.target)} :: ${reason}`);
      }
    }
    expect(
      serious.map((violation) => `${violation.id}(${violation.impact})×${violation.nodes.length}`),
    ).toEqual([]);
  });

  // T2-11：区间弹层里多了「两个 combobox 指向同一 dialog」与「区间三态格子」，
  // 单独在展开态扫一次（静态扫描时弹层根本不存在）。
  test('RangePicker 展开日历后无 serious / critical 违规', async ({ page }) => {
    await page.goto(demoPath('range-picker'));
    await page
      .getByRole('group', { name: '出差日期范围' })
      .getByRole('combobox', { name: '开始日期' })
      .click();
    await expect(page.locator('[data-scui-role="range-calendar"]')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();
    const serious = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );
    console.log(
      `[axe] range-picker/open: ${results.violations.length} violations ${results.violations
        .map((violation) => `${violation.id}(${violation.impact})×${violation.nodes.length}`)
        .join(', ')}`,
    );
    for (const violation of serious) {
      for (const node of violation.nodes.slice(0, 4)) {
        const reason = (node.failureSummary ?? '').replaceAll('\n', ' ').slice(0, 200);
        console.log(`[axe]   ${violation.id} ${JSON.stringify(node.target)} :: ${reason}`);
      }
    }
    expect(
      serious.map((violation) => `${violation.id}(${violation.impact})×${violation.nodes.length}`),
    ).toEqual([]);
  });
});
