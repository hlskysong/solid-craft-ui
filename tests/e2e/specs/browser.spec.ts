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

  // T3-07：焦点陷阱与「ESC 后焦点归还触发元素」都是真实浏览器行为，
  // jsdom 没有 focus scope，单测替代不了。这里用连续 Tab 验证焦点不越界，
  // 并在 ESC 后直接断言 activeElement 回到了当初的触发按钮 —— Kobalte 默认
  // 只 focus triggerRef，受控打开（外部按钮驱动）没有 Trigger，必须由原语接管。
  test('Modal 焦点陷阱与 ESC 后焦点归还触发元素', async ({ page }) => {
    await page.goto('/components/modal/focus?standalone=1');
    const trigger = page.getByTestId('modal-focus-trigger');
    const dialog = page.getByRole('dialog', { name: '设备信息登记' });

    await trigger.click();
    await expect(dialog).toBeVisible();

    const focusInside = (): Promise<boolean> =>
      page.evaluate(() => {
        const content = document.querySelector('[role="dialog"]');
        return content?.contains(document.activeElement) ?? false;
      });
    // Kobalte 的 focus scope 在 Content 挂载后的下一个 effect 才把焦点移入，
    // `toBeVisible()` 不等于「焦点已就位」。单独跑这条用例时时序恰好够，
    // 全量 178 条连跑时会撞上竞态（T2-13 的「goto 后立刻 Tab」同源）。
    await page.waitForFunction(
      () => {
        const content = document.querySelector('[role="dialog"]');
        return content?.contains(document.activeElement) ?? false;
      },
      null,
      { timeout: 3000 },
    );
    expect(await focusInside(), '打开后焦点应落在弹层内').toBe(true);

    for (let index = 0; index < 8; index += 1) {
      await page.keyboard.press('Tab');
      expect(await focusInside(), `第 ${index + 1} 次 Tab 后焦点跑出了弹层`).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  // T3-07：异步关闭期间「防重复提交」不能只靠按钮 disabled（业务侧可以换自定义
  // footer），引擎必须在 pending 时早退，且 ESC / 遮罩 / 取消 / 右上关闭四条
  // 关闭入口全部失效。这里按真实 900ms 计时跑完整链。
  test('Modal 异步确认：pending 期间防重复提交且全部关闭入口失效', async ({ page }) => {
    await page.goto('/components/modal/async-close?standalone=1');
    await page.getByRole('button', { name: '打开并提交' }).click();
    const dialog = page.getByRole('dialog', { name: '确认提交采购计划' });
    await expect(dialog).toBeVisible();

    const ok = page.getByRole('button', { name: '提交审批' });
    const count = page.getByTestId('modal-submit-count');
    await ok.click();
    await expect(page.locator('[data-scui-role="modal"]')).toHaveAttribute('data-scui-pending', '');
    await expect(count).toHaveText('请求次数：1');
    await expect(ok).toBeDisabled();

    // 绕过 Playwright 的可点击性检查直接派发 click：disabled 元素不会触发事件，
    // 真正兜底的是 handleOk 里的 isPending() 早退（自定义 footer 时同样成立）。
    await page.evaluate(() => {
      const button = [...document.querySelectorAll('button')].find((item) =>
        item.textContent?.includes('提交审批'),
      );
      button?.click();
    });
    await page.keyboard.press('Escape');
    await page.locator('[data-scui-role="modal-overlay"]').click({
      position: { x: 6, y: 6 },
      force: true,
    });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('button', { name: '取消' })).toBeDisabled();
    await expect(page.locator('[data-scui-role="modal-close"]')).toBeDisabled();
    await expect(count).toHaveText('请求次数：1');

    await expect(dialog).toHaveCount(0, { timeout: 4000 });
    await expect(page.getByTestId('modal-submit-log')).toHaveText('提交完成');
  });

  // T3-07：遮罩点击是独立于 ESC 的关闭路径；关掉后还要能再次打开，
  // 否则受控状态会在第一次关闭后卡死。
  test('Modal 遮罩关闭后可再次打开', async ({ page }) => {
    await page.goto('/components/modal/basic?standalone=1');
    const openSmall = page.getByRole('button', { name: '打开 small' });
    const dialog = page.getByRole('dialog', { name: '新增设备采购计划' });

    await openSmall.click();
    await expect(dialog).toBeVisible();
    await expect(page.locator('[data-scui-role="modal"]')).toHaveAttribute(
      'data-scui-size',
      'small',
    );

    await page.locator('[data-scui-role="modal-overlay"]').click({
      position: { x: 6, y: 6 },
      force: true,
    });
    await expect(dialog).toHaveCount(0);

    await openSmall.click();
    await expect(dialog).toBeVisible();
  });

  // T3-08：四方向不是靠 modifier class 而是靠 data-scui-side 驱动的贴边规则。
  // 只断言属性会漏掉「样式没生效」的假绿，所以直接用 boundingBox 量贴边位置；
  // 收尾再验遮罩关闭后能再次打开，避免受控状态第一次关闭就卡死。
  test('Drawer 四方向贴边定位，遮罩关闭后可再次打开', async ({ page }) => {
    await page.goto('/components/drawer/open-state?standalone=1');
    const dialog = page.getByRole('dialog', { name: '打开态视觉基线' });
    await expect(dialog).toBeVisible();

    const viewport = page.viewportSize();
    const width = viewport?.width ?? 1280;
    const height = viewport?.height ?? 720;
    const near = (actual: number, expected: number, label: string) => {
      expect(Math.abs(actual - expected), label).toBeLessThanOrEqual(2);
    };
    const measure = async () => {
      const box = await dialog.boundingBox();
      if (!box) throw new Error('Drawer boundingBox 为空');
      return box;
    };

    await expect(dialog).toHaveAttribute('data-scui-side', 'right');
    const right = await measure();
    near(right.x + right.width, width, 'right 应贴视口右边缘');

    await dialog.getByRole('button', { name: 'left', exact: true }).click();
    await expect(dialog).toHaveAttribute('data-scui-side', 'left');
    const left = await measure();
    near(left.x, 0, 'left 应贴视口左边缘');

    await dialog.getByRole('button', { name: 'top', exact: true }).click();
    await expect(dialog).toHaveAttribute('data-scui-side', 'top');
    const top = await measure();
    near(top.y, 0, 'top 应贴视口上边缘');
    near(top.width, width, 'top 应铺满视口宽度');

    await dialog.getByRole('button', { name: 'bottom', exact: true }).click();
    await expect(dialog).toHaveAttribute('data-scui-side', 'bottom');
    const bottom = await measure();
    near(bottom.y + bottom.height, height, 'bottom 应贴视口下边缘');
    near(bottom.width, width, 'bottom 应铺满视口宽度');

    await page.locator('[data-scui-role="drawer-overlay"]').click({
      position: { x: 6, y: 6 },
      force: true,
    });
    await expect(dialog).toHaveCount(0);
    await page.getByRole('button', { name: '重新打开' }).click();
    await expect(dialog).toBeVisible();
  });

  // T3-08：左右方向读 width、上下方向读 height，两者归一到同一个
  // --scui-drawer-size。这里故意在 bottom 方向同时传 width=999 与 height='42vh'，
  // 若归一写反，抽屉会被撑成 999px 而不是铺满视口。
  test('Drawer bottom 方向只认 height，不认 width', async ({ page }) => {
    await page.goto('/components/drawer/size?standalone=1');
    await page.getByRole('button', { name: '打开自定义尺寸' }).click();
    const dialog = page.getByRole('dialog', { name: '自定义高度' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('data-scui-side', 'bottom');
    await expect(dialog).toHaveAttribute('style', /--scui-drawer-size: 42vh/);

    const box = await dialog.boundingBox();
    const viewportWidth = page.viewportSize()?.width ?? 1280;
    expect(box).not.toBeNull();
    expect(box?.width ?? 0, 'bottom 应铺满视口宽度，而不是被 width=999 限死').toBeGreaterThan(
      viewportWidth - 4,
    );
  });

  // T3-08：焦点陷阱与归还由 primitives/overlay 统一实现，Drawer 不得自己再写
  // 一份。与 Modal 同型回归，确认复用后行为没有退化。
  test('Drawer 焦点陷阱与 ESC 后焦点归还触发元素', async ({ page }) => {
    await page.goto('/components/drawer/focus?standalone=1');
    const trigger = page.getByTestId('drawer-focus-trigger');
    const dialog = page.getByRole('dialog', { name: '设备信息登记' });

    await trigger.click();
    await expect(dialog).toBeVisible();
    const focusInside = (): Promise<boolean> =>
      page.evaluate(() => {
        const content = document.querySelector('[role="dialog"]');
        return content?.contains(document.activeElement) ?? false;
      });
    // toBeVisible() 不等于 focus scope 已把焦点移入；全量连跑会放大时序差。
    await page.waitForFunction(
      () => {
        const content = document.querySelector('[role="dialog"]');
        return content?.contains(document.activeElement) ?? false;
      },
      null,
      { timeout: 3000 },
    );
    expect(await focusInside(), '打开后焦点应落在抽屉内').toBe(true);

    for (let index = 0; index < 8; index += 1) {
      await page.keyboard.press('Tab');
      expect(await focusInside(), `第 ${index + 1} 次 Tab 后焦点跑出了抽屉`).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  // T3-09：Alert 是内联反馈，四种 kind 必须真的输出（不是注释里的枚举）；
  // 关闭按钮要移除自身，操作区要能驱动 T2-06 挂在 body 上的全局宿主。
  test('Alert 四种类型、关闭回调与操作区的全局反馈接入', async ({ page }) => {
    await page.goto('/components/alert/basic?standalone=1');
    const kinds = page.locator('[data-scui-role="alert"]');
    await expect(kinds).toHaveCount(4);
    for (const kind of ['info', 'success', 'warning', 'error']) {
      await expect(page.locator(`[data-scui-role="alert"][data-scui-kind="${kind}"]`)).toHaveCount(
        1,
      );
    }

    await page.goto('/components/alert/closable?standalone=1');
    await page.locator('[data-scui-role="alert-close"]').first().click();
    await expect(page.getByTestId('alert-close-count')).toHaveText('累计关闭 1 次');
    // 页面共 4 条：三个示例 + 第二个示例区里由 Show 控制的一条；关掉首条后剩 3 条。
    await expect(page.locator('[data-scui-role="alert"]')).toHaveCount(3);

    await page.goto('/components/alert/action?standalone=1');
    await page.getByRole('button', { name: '提交复核' }).click();
    await expect(
      page.locator('[data-scui-role="message"]').filter({ hasText: '已提交复核' }),
    ).toHaveCount(1);
    await expect(page.locator('[data-scui-role="app-host"]')).toHaveCount(1);
  });

  // T3-09：定位由 Floating UI 负责，只断言属性会漏掉「浮层被视口裁剪」；
  // 用 boundingBox 实测打开态面板完全落在视口内，同时验箭头开关真的生效。
  test('Tooltip 打开态不被视口裁剪，箭头可关闭', async ({ page }) => {
    await page.goto('/components/tooltip/open-state?standalone=1');
    const tip = page.getByRole('tooltip');
    await expect(tip).toBeVisible();
    await expect(tip).toHaveAttribute('data-scui-anchor', 'bottom');

    const box = await tip.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(box?.x ?? -1).toBeGreaterThanOrEqual(-1);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual((viewport?.width ?? 1280) + 2);

    await expect(page.locator('[data-scui-role="tooltip-arrow"]')).toHaveCount(1);
    await page.getByRole('button', { name: '隐藏箭头' }).click();
    await expect(page.locator('[data-scui-role="tooltip-arrow"]')).toHaveCount(0);
  });

  // T3-09：「延迟」必须有时序实证。600ms 的那条在 450ms 前不得出现，
  // 0ms 的那条必须立刻出现；二者共用同一个锚定原语，只是参数不同。
  test('Tooltip openDelay 快慢两条路径都生效', async ({ page }) => {
    await page.goto('/components/tooltip/delay?standalone=1');
    const slowStart = Date.now();
    await page.getByText('延迟 600ms').hover();
    await expect(page.getByRole('tooltip')).toBeVisible({ timeout: 3000 });
    expect(Date.now() - slowStart, '600ms 的 openDelay 未生效').toBeGreaterThanOrEqual(450);
    await expect(page.getByTestId('tooltip-delay-log')).toHaveText('延迟提示打开');

    await page.goto('/components/tooltip/delay?standalone=1');
    const fastStart = Date.now();
    await page.getByText('立即显示').hover();
    await expect(page.getByRole('tooltip')).toBeVisible({ timeout: 1500 });
    expect(Date.now() - fastStart, '0ms 的 openDelay 不应等待').toBeLessThan(450);
  });

  // T3-09：Popconfirm 的异步协议与 Modal 同形。pending 期间确定按钮禁用、
  // ESC 被原语闸门拦住、重复点击不增加提交次数；resolve 后关闭并调用
  // 静态 message（全局宿主挂在 body，证明「脱离树亦可调用」）。
  test('Popconfirm 异步确认 pending 防重复提交，resolve 后触发全局反馈', async ({ page }) => {
    await page.goto('/components/popconfirm/basic?standalone=1');
    await page.getByRole('button', { name: '删除明细' }).click();
    const bubble = page.locator('[data-scui-role="popconfirm"]');
    await expect(bubble).toBeVisible();

    await page.getByRole('button', { name: '确定' }).click();
    await expect(bubble).toHaveAttribute('data-scui-pending', '');
    await expect(page.getByRole('button', { name: '确定' })).toBeDisabled();
    await expect(page.getByRole('button', { name: '取消' })).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(bubble).toBeVisible();
    await expect(page.getByTestId('popconfirm-submit-count')).toHaveText('累计提交 0 次');

    await expect(page.getByTestId('popconfirm-submit-log')).toHaveText('当前状态：提交完成', {
      timeout: 4000,
    });
    await expect(bubble).toHaveCount(0);
    await expect(page.getByTestId('popconfirm-submit-count')).toHaveText('累计提交 1 次');
    await expect(
      page.locator('[data-scui-role="message"]').filter({ hasText: '已删除采购明细' }),
    ).toHaveCount(1);
  });

  // T3-09：锚定浮层有 Trigger，焦点归还由 Kobalte 的 ButtonRoot 默认行为负责；
  // 这里不自建第二套 focus 逻辑，所以用「ESC 关闭 -> 焦点回到触发按钮」反证。
  test('Popconfirm ESC 关闭后焦点归还触发元素', async ({ page }) => {
    await page.goto('/components/popconfirm/placement?standalone=1');
    const trigger = page.getByRole('button', { name: '归档计划' });
    const bubble = page.locator('[data-scui-role="popconfirm"]');
    await trigger.click();
    await expect(bubble).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(bubble).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  // T3-09：十二向里的四向切换必须同时改属性与真实位置；只改属性而样式 /
  // 定位引擎没接上会让 flip 失效，面板被裁到视口外。
  test('Popconfirm 四向切换与 flip 不越界', async ({ page }) => {
    await page.goto('/components/popconfirm/placement?standalone=1');
    const trigger = page.getByRole('button', { name: '归档计划' });
    const bubble = page.locator('[data-scui-role="popconfirm"]');

    for (const side of ['top', 'bottom', 'left', 'right']) {
      await page.getByRole('button', { name: side, exact: true }).click();
      await trigger.click();
      await expect(bubble).toBeVisible();
      await expect(bubble).toHaveAttribute('data-scui-anchor', side);
      const box = await bubble.boundingBox();
      const viewport = page.viewportSize();
      expect(box).not.toBeNull();
      expect(box?.x ?? -1, `${side} 不应越出左边缘`).toBeGreaterThanOrEqual(-1);
      expect(box?.y ?? -1, `${side} 不应越出上边缘`).toBeGreaterThanOrEqual(-1);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual((viewport?.width ?? 1280) + 2);
      await page.keyboard.press('Escape');
      await expect(bubble).toHaveCount(0);
    }
  });

  // T3-10：Card 的四块结构 + 加载态。只断言 data-scui-loading 会漏掉「骨架没接上」，
  // 所以同时验 Skeleton 角色真的出现在 body 里、children 真的被换掉；再用
  // boundingBox 量切换前后的卡片高度差 ≤ 2px，把「加载不抖动」变成实测而非文案。
  test('Card 结构缺席规则与加载态组合 Skeleton 不抖动', async ({ page }) => {
    await page.goto('/components/card/basic?standalone=1');
    await expect(page.locator('[data-scui-role="card"]')).toHaveCount(3);
    await expect(page.locator('[data-scui-role="card-cover"]')).toHaveCount(0);
    await expect(page.locator('[data-scui-role="card-header"]')).toHaveCount(2);
    await expect(page.locator('[data-scui-role="card-extra"]')).toHaveCount(1);

    await page.goto('/components/card/cover?standalone=1');
    await expect(page.locator('[data-scui-role="card-cover"]')).toHaveCount(2);
    await expect(page.locator('[data-scui-role="card-header"]')).toHaveCount(1);

    await page.goto('/components/card/loading?standalone=1');
    const card = page.getByTestId('card-loading-target');
    await expect(card).toHaveAttribute('data-scui-loading', '');
    await expect(card.locator('[data-scui-role="skeleton"]')).toHaveCount(1);
    await expect(card.locator('[data-scui-role="skeleton-line"]')).toHaveCount(3);
    const loadingBox = await card.boundingBox();

    await page.getByRole('button', { name: '切换加载状态' }).click();
    await expect(page.getByTestId('card-loading-log')).toHaveText('当前状态：已加载');
    expect(await card.getAttribute('data-scui-loading')).toBeNull();
    await expect(card.locator('[data-scui-role="skeleton"]')).toHaveCount(0);
    await expect(card).toContainText('第一行：主通风机 2 台');
    const loadedBox = await card.boundingBox();
    expect(
      Math.abs((loadingBox?.height ?? 0) - (loadedBox?.height ?? 0)),
      '加载态与正文态卡片高度应一致',
    ).toBeLessThanOrEqual(2);
  });

  // T3-10：375px 只做「不溢出、不截断关键信息」冒烟（docs/06 §5.3）。
  test('Card 封面与操作区在 375px 不横向溢出', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/components/card/cover?standalone=1');
    const cards = page.locator('[data-scui-role="card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      const box = await cards.nth(index).boundingBox();
      expect(box?.x ?? -1).toBeGreaterThanOrEqual(-1);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(376);
    }
  });

  // T3-10：五档颜色必须同时改属性与真实配色；只改属性而样式没接上是死代码。
  // bordered 用 computed style 验「开=accent 实色、关=transparent」，并验恒占 1px。
  test('Tag 五档配色与边框开关在真实样式上生效', async ({ page }) => {
    await page.goto('/components/tag/bordered?standalone=1');
    const colors = ['primary', 'neutral', 'success', 'warning', 'danger'];
    const backgrounds: string[] = [];
    for (const color of colors) {
      const on = page.getByTestId(`tag-on-${color}`);
      const off = page.getByTestId(`tag-off-${color}`);
      await expect(on).toHaveAttribute('data-scui-color', color);
      await expect(on).toHaveAttribute('data-scui-bordered', '');
      await expect(off).toHaveAttribute('data-scui-color', color);
      expect(await off.getAttribute('data-scui-bordered')).toBeNull();
      backgrounds.push(await off.evaluate((element) => getComputedStyle(element).backgroundColor));
    }
    expect(new Set(backgrounds).size, '五档配色应产生不同的浅色背景').toBeGreaterThanOrEqual(4);

    const onBorder = await page
      .getByTestId('tag-on-primary')
      .evaluate((element) => getComputedStyle(element).borderTopColor);
    const offBorder = await page
      .getByTestId('tag-off-primary')
      .evaluate((element) => getComputedStyle(element).borderTopColor);
    expect(onBorder).not.toBe(offBorder);
    expect(offBorder).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    const width = await page
      .getByTestId('tag-off-primary')
      .evaluate((element) => getComputedStyle(element).borderTopWidth);
    expect(width).toBe('1px');
  });

  // T3-10：可关闭既要点击路径也要键盘路径，并且关闭按钮恒带可读名称。
  test('Tag 可关闭：点击与 Enter 两条路径都只计一次', async ({ page }) => {
    await page.goto('/components/tag/closable?standalone=1');
    await expect(page.locator('[data-scui-role="tag"]')).toHaveCount(4);
    await expect(page.locator('[data-scui-role="tag-close"]')).toHaveCount(3);

    await page.locator('[data-scui-role="tag-close"]').first().click();
    await expect(page.getByTestId('tag-close-count')).toHaveText('累计关闭 1 次');
    await expect(page.locator('[data-scui-role="tag"]')).toHaveCount(3);

    const keyboardTarget = page.getByRole('button', { name: '移除已通过标签' });
    await keyboardTarget.focus();
    await expect(keyboardTarget).toBeFocused();
    expect(await keyboardTarget.getAttribute('aria-label')).toBe('移除已通过标签');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('tag-close-count')).toHaveText('累计关闭 2 次');
    await expect(page.locator('[data-scui-role="tag"]')).toHaveCount(2);
  });

  // T3-11：线型 / 卡片不能只验属性，要量真实样式；切换按钮再验属性与外观同步。
  test('Tabs 线型与卡片两档在真实样式上生效', async ({ page }) => {
    await page.goto('/components/tabs/variant?standalone=1');
    const line = page.getByTestId('tabs-line');
    const card = page.getByTestId('tabs-card');
    await expect(line).toHaveAttribute('data-scui-variant', 'line');
    await expect(card).toHaveAttribute('data-scui-variant', 'card');

    const lineTab = line.locator('[data-scui-role="tabs-tab"]').first();
    const cardTab = card.locator('[data-scui-role="tabs-tab"]').first();
    expect(await lineTab.evaluate((element) => getComputedStyle(element).borderBlockEndWidth)).toBe(
      '2px',
    );
    const cardBackground = await cardTab.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    expect(cardBackground).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    const activeColor = await lineTab.evaluate((element) => getComputedStyle(element).color);
    const inactiveColor = await line
      .locator('[data-scui-role="tabs-tab"]')
      .nth(1)
      .evaluate((element) => getComputedStyle(element).color);
    expect(activeColor).not.toBe(inactiveColor);
    // 线型的激活态不能只是蓝字：底部 2px 实色条必须真的换色。
    const activeBorder = await lineTab.evaluate(
      (element) => getComputedStyle(element).borderBlockEndColor,
    );
    const inactiveBorder = await line
      .locator('[data-scui-role="tabs-tab"]')
      .nth(1)
      .evaluate((element) => getComputedStyle(element).borderBlockEndColor);
    expect(activeBorder).not.toBe(inactiveBorder);
    expect(inactiveBorder).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);

    await page.getByRole('button', { name: '切换样式' }).click();
    await expect(page.getByTestId('tabs-variant-log')).toHaveText('当前样式：卡片');
    await expect(page.locator('[data-testid="tabs-line"]')).toHaveAttribute(
      'data-scui-variant',
      'line',
    );
  });

  // T3-11：方向键 / Home / End 全部由 Kobalte 原语处理，组件层零键盘代码。
  test('Tabs 键盘导航：方向键与 Home / End 切换激活项', async ({ page }) => {
    await page.goto('/components/tabs/basic?standalone=1');
    const root = page.getByTestId('tabs-basic-root');
    const first = root.getByRole('tab').first();
    await first.focus();
    await expect(first).toBeFocused();
    expect(await first.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe(
      'none',
    );

    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('tabs-active-log')).toHaveText('当前标签：detail');
    await expect(root.getByRole('tab').nth(1)).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('End');
    await expect(page.getByTestId('tabs-active-log')).toHaveText('当前标签：audit');
    await expect(root.getByRole('tab').nth(3)).toBeDisabled();

    await page.keyboard.press('Home');
    await expect(page.getByTestId('tabs-active-log')).toHaveText('当前标签：plan');
  });

  // T3-11：懒加载要验「未激活 panel 的内容节点根本没进 DOM」，不是只验属性。
  test('Tabs 懒加载：默认只挂载激活 panel，lazy=false 全挂载且 hidden', async ({ page }) => {
    await page.goto('/components/tabs/lazy?standalone=1');
    const lazy = page.getByTestId('tabs-lazy-on');
    const eager = page.getByTestId('tabs-lazy-off');

    await expect(lazy.locator('[data-testid="tabs-lazy-lazy-first"]')).toHaveCount(1);
    await expect(lazy.locator('[data-testid="tabs-lazy-lazy-second"]')).toHaveCount(0);
    await expect(lazy.locator('[data-testid="tabs-lazy-lazy-third"]')).toHaveCount(0);

    await lazy.getByRole('tab', { name: '第二页' }).click();
    await expect(lazy.locator('[data-testid="tabs-lazy-lazy-second"]')).toHaveCount(1);
    await expect(lazy.locator('[data-testid="tabs-lazy-lazy-first"]')).toHaveCount(0);

    await expect(eager.locator('[data-scui-role="tabs-panel"]')).toHaveCount(3);
    await expect(eager.locator('[data-scui-role="tabs-panel"][hidden]')).toHaveCount(2);
    await expect(eager.locator('[data-testid="tabs-lazy-eager-third"]')).toBeHidden();
  });

  // T3-11：受控 value 锁定时点击只发 onChange，DOM 必须由调用方回弹。
  test('Tabs 受控 value：点击只通知、激活态不自行回弹', async ({ page }) => {
    await page.goto('/components/tabs/basic?standalone=1');
    const locked = page.getByTestId('tabs-locked');
    const first = locked.getByRole('tab').first();
    const second = locked.getByRole('tab', { name: '明细清单' });
    await expect(first).toHaveAttribute('data-scui-current', '');
    await second.click();
    await expect(page.getByTestId('tabs-controlled-log')).toHaveText('收到 detail，DOM 不回弹');
    await expect(first).toHaveAttribute('data-scui-current', '');
    expect(await second.getAttribute('data-scui-current')).toBeNull();
    await expect(locked.locator('[data-testid="tabs-panel-plan"]')).toHaveCount(1);
  });

  // T3-11：column / span / bordered 都要量真实布局，避免「属性改了样式没接上」。
  test('Descriptions 三档列数、跨列与边框在真实样式上生效', async ({ page }) => {
    await page.goto('/components/descriptions/column?standalone=1');
    const target = page.getByTestId('descriptions-column-target');
    const list = target.locator('[data-scui-role="descriptions-list"]');
    await expect(target).toHaveAttribute('data-scui-column', '2');
    const twoColumns = await list.evaluate(
      (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
    );
    expect(twoColumns).toBe(2);

    await page.getByRole('button', { name: '三列' }).click();
    await expect(page.getByTestId('descriptions-column-log')).toHaveText('当前列数：3');
    await expect(target).toHaveAttribute('data-scui-column', '3');
    const threeColumns = await list.evaluate(
      (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
    );
    expect(threeColumns).toBe(3);
    await expect(target.locator('[data-scui-role="descriptions-label"]').first()).toBeVisible();

    await page.goto('/components/descriptions/basic?standalone=1');
    await expect(
      page.getByTestId('descriptions-basic').locator('[data-scui-span="2"]'),
    ).toHaveCount(1);

    await page.goto('/components/descriptions/bordered?standalone=1');
    const bordered = page.getByTestId('descriptions-bordered-target');
    await expect(bordered).toHaveAttribute('data-scui-bordered', '');
    const item = bordered.locator('[data-scui-role="descriptions-item"]').first();
    expect(await item.evaluate((element) => getComputedStyle(element).borderTopWidth)).toBe('1px');
    await page.getByRole('button', { name: '切换边框' }).click();
    expect(await bordered.getAttribute('data-scui-bordered')).toBeNull();
  });

  // T3-11：375px 只做「不溢出、不截断关键信息」冒烟（docs/06 §5.3）。
  test('Tabs 与 Descriptions 在 375px 不横向溢出', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    for (const path of [
      '/components/tabs/variant?standalone=1',
      '/components/descriptions/column?standalone=1',
    ]) {
      await page.goto(path);
      const roots = page.locator('[data-scui-role="tabs"], [data-scui-role="descriptions"]');
      // count() 不等待挂载：goto 刚返回时 Solid 可能还没把组件插进 DOM。
      await expect(roots.first()).toBeVisible();
      const count = await roots.count();
      expect(count).toBeGreaterThan(0);
      for (let index = 0; index < count; index += 1) {
        const box = await roots.nth(index).boundingBox();
        expect(box?.x ?? -1).toBeGreaterThanOrEqual(-1);
        expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(376);
      }
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth, `${path} 不应出现横向滚动`).toBeLessThanOrEqual(376);
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
  // T3-07：弹层是 Portal 到 body 的，普通 Demo 页面在关闭态扫不到它。
  // open-state Demo 首屏即打开，这条单独点名记录「弹层态 axe 0」这一验收项，
  // 同时覆盖 aria-modal / aria-labelledby / 焦点陷阱里的控件组合。
  test('Modal 打开态无 serious / critical 违规', async ({ page }) => {
    await page.goto('/components/modal/open-state?standalone=1');
    await expect(page.getByRole('dialog', { name: '打开态视觉基线' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();
    const serious = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );
    console.log(
      `[axe] modal/open: ${results.violations.length} violations ${results.violations
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

  // T3-08：Drawer 弹层同样 Portal 到 body，关闭态的 Demo 扫不到它。
  // open-state Demo 首屏即打开，这条单独点名「贴边弹层态 axe 0」验收项，
  // 同时覆盖 aria-modal / aria-labelledby / 焦点陷阱里的控件组合。
  test('Drawer 打开态无 serious / critical 违规', async ({ page }) => {
    await page.goto('/components/drawer/open-state?standalone=1');
    await expect(page.getByRole('dialog', { name: '打开态视觉基线' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();
    const serious = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );
    console.log(
      `[axe] drawer/open: ${results.violations.length} violations ${results.violations
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

  // T3-09：Alert 是内联反馈，四色边框 + 图标 + 关闭按钮同处一页，
  // 单独点名「静态页内反馈 axe 0 serious / critical」。
  test('Alert 四种类型无 serious / critical 违规', async ({ page }) => {
    await page.goto('/components/alert/basic?standalone=1');
    await expect(page.locator('[data-scui-role="alert"]')).toHaveCount(4);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();
    const serious = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );
    console.log(
      `[axe] alert/basic: ${results.violations.length} violations ${results.violations
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

  // T3-09：Tooltip 打开态是 Portal 到 body 的 role="tooltip"，关闭态扫不到它。
  test('Tooltip 打开态无 serious / critical 违规', async ({ page }) => {
    await page.goto('/components/tooltip/open-state?standalone=1');
    await expect(page.getByRole('tooltip')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();
    const serious = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );
    console.log(
      `[axe] tooltip/open: ${results.violations.length} violations ${results.violations
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

  // T3-09：Popconfirm 打开态是 role="dialog" 的气泡，标题 / 描述 / 操作区
  // 都要满足 aria-labelledby / describedby 与按钮对比度。
  test('Popconfirm 打开态无 serious / critical 违规', async ({ page }) => {
    await page.goto('/components/popconfirm/open-state?standalone=1');
    await expect(page.locator('[data-scui-role="popconfirm"]')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();
    const serious = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );
    console.log(
      `[axe] popconfirm/open: ${results.violations.length} violations ${results.violations
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

  // T3-10：Card 加载态里骨架是 aria-busy 的装饰块，封面是无 alt 的装饰渐变，
  // 单独点名验「加载 + 封面同页」不出现 serious / critical。
  test('Card 加载态与封面无 serious / critical 违规', async ({ page }) => {
    await page.goto('/components/card/loading?standalone=1');
    await expect(page.locator('[data-scui-role="skeleton"]')).toHaveCount(1);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();
    const serious = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );
    console.log(
      `[axe] card/loading: ${results.violations.length} violations ${results.violations
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

  // T3-10：五档浅色背景 + 深色文本必须满足对比度；可关闭按钮要有可读名称。
  test('Tag 五档配色与可关闭按钮无 serious / critical 违规', async ({ page }) => {
    await page.goto('/components/tag/closable?standalone=1');
    await expect(page.locator('[data-scui-role="tag-close"]')).toHaveCount(3);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();
    const serious = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );
    console.log(
      `[axe] tag/closable: ${results.violations.length} violations ${results.violations
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

  // T3-11：tablist / tab / tabpanel 与 dl / dt / dd 语义要过 axe；两个组件分开扫，
  // 任一 serious / critical 都直接判红（§4.2「各 ≥3 Demo + axe 0」）。
  test('Tabs 与 Descriptions 无 serious / critical 违规', async ({ page }) => {
    for (const [path, anchor] of [
      ['/components/tabs/basic?standalone=1', 'tabs-basic-root'],
      ['/components/descriptions/basic?standalone=1', 'descriptions-basic'],
    ] as const) {
      await page.goto(path);
      await expect(page.getByTestId(anchor)).toHaveCount(1);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
        .analyze();
      const serious = results.violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical',
      );
      console.log(
        `[axe] ${path}: ${results.violations.length} violations ${results.violations
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
        serious.map(
          (violation) => `${violation.id}(${violation.impact})×${violation.nodes.length}`,
        ),
      ).toEqual([]);
    }
  });

  // T3-12：CRUD 列表页组合 Demo 的四条端到端链（§4.2 验收列）。四条都断言
  // 「业务结果 + 操作日志」两处，避免只靠浮层出现/消失的假绿。
  test('CRUD 查询：关键字过滤生效，重置恢复全量', async ({ page }) => {
    await page.goto('/components/table/crud-list?standalone=1');
    const count = page.getByTestId('crud-count');
    const log = page.getByTestId('crud-log');
    await expect(count).toContainText('8 条');
    await page.getByTestId('crud-query-keyword').fill('通风');
    await page.getByTestId('crud-query-submit').click();
    await expect(count).toContainText('1 条');
    await expect(log).toContainText('查询 通风');
    await page.getByTestId('crud-query-reset').click();
    await expect(count).toContainText('8 条');
    await expect(log).toContainText('已重置查询');
  });

  test('CRUD 新增：Modal 校验不通过保持打开，写入后计数与反馈都更新', async ({ page }) => {
    await page.goto('/components/table/crud-list?standalone=1');
    await page.getByTestId('crud-create').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const save = dialog.getByRole('button', { name: '保存计划' });
    await save.click();
    await expect(page.getByTestId('crud-modal-body')).toContainText('请输入计划名称');
    await expect(dialog).toBeVisible();
    await expect(save).toBeEnabled();
    await page.getByTestId('crud-modal-name').fill('新增测试计划');
    await save.click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId('crud-count')).toContainText('9 条');
    await expect(page.getByTestId('crud-log')).toContainText('新增 PLAN-09');
  });

  test('CRUD 编辑：回填既有值，保存后表格行同步更新', async ({ page }) => {
    await page.goto('/components/table/crud-list?standalone=1');
    await page.getByTestId('crud-edit-PLAN-01').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId('crud-modal-name')).toHaveValue('主井提升机变频改造');
    await page.getByTestId('crud-modal-name').fill('主井提升机变频改造二期');
    await dialog.getByRole('button', { name: '保存计划' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId('crud-log')).toContainText('编辑 PLAN-01');
    await expect(page.getByTestId('crud-table')).toContainText('主井提升机变频改造二期');
  });

  test('CRUD 删除：Popconfirm 确认后移除行、计数与反馈同步', async ({ page }) => {
    await page.goto('/components/table/crud-list?standalone=1');
    await page
      .getByTestId('crud-actions-PLAN-02')
      .getByRole('button', { name: '删除', exact: true })
      .click();
    const popover = page.locator('[data-scui-role="popconfirm"]');
    await expect(popover).toBeVisible();
    await popover.getByRole('button', { name: '确认删除' }).click();
    await expect(popover).toHaveCount(0);
    await expect(page.getByTestId('crud-count')).toContainText('7 条');
    await expect(page.getByTestId('crud-log')).toContainText('删除 PLAN-02');
    await expect(page.getByTestId('crud-actions-PLAN-02')).toHaveCount(0);
  });

  // 组合页的 axe 要扫两态：列表初始态 + Modal 打开态（弹层里的表单 label / 焦点）。
  test('CRUD 列表页无 serious / critical 违规', async ({ page }) => {
    const seriousOf = async () => {
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
        .analyze();
      return results.violations
        .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
        .map((violation) => `${violation.id}(${violation.impact})×${violation.nodes.length}`);
    };
    await page.goto('/components/table/crud-list?standalone=1');
    await expect(page.getByTestId('crud-table')).toBeVisible();
    expect(await seriousOf()).toEqual([]);
    await page.getByTestId('crud-create').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await seriousOf()).toEqual([]);
  });
});
