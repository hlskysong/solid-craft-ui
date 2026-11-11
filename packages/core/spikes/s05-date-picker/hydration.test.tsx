/**
 * S-05 hydration 冒烟：把真实 SSR HTML 灌进容器后调用 hydrate()，验证
 * ① 0 mismatch warning；② 组件在已有 DOM 容器上挂载；③ 交互回调送达。
 *
 * ⚠️ 边界（Spike 实证结论，不得冒充严格 hydration）：
 * ssrLoadModule 默认 ssr:false 生成的是不带 data-hk 的纯 SSR 字符串，
 * 与客户端 hydratable 编译不配对，因此这里走 hydrate() 的 done=true 降级路径；
 * 严格「SSR HTML → hydrate → data-hk 复用」由 verify 第 25 阶段
 * pnpm smoke:start-real（真实 SolidStart + dist/source/*.jsx）验收。
 * Phase 0 只验可行性，完整 SSR 回归按 docs/07 §6 仍在 M4。
 */
import { hydrate } from 'solid-js/web';
import { describe, expect, it, vi } from 'vitest';
import { createServer } from 'vite';
import solid from 'vite-plugin-solid';

import { ScuiDatePicker } from './DatePicker';

describe('S-05 hydration 冒烟', () => {
  it('SSR HTML → hydrate 无 mismatch，点击可送达', async () => {
    const server = await createServer({
      configFile: false,
      root: process.cwd(),
      plugins: [solid()],
      server: { middlewareMode: true },
      logLevel: 'silent',
      appType: 'custom',
    });
    let html = '';
    try {
      const mod = await server.ssrLoadModule('/spikes/s05-date-picker/ssr.tsx');
      html = await mod.render();
    } finally {
      await server.close();
    }
    expect(html).toContain('data-scui-role="date-picker"');

    // 真实框架由 generateHydrationScript() 注入该全局；冒烟里显式构造最小等价状态
    Object.defineProperty(globalThis, '_$HY', {
      // done=true 触发 hydrate() 的降级渲染路径（纯 SSR 字符串无 hydration key）
      value: { done: true, completed: new WeakSet(), events: [], r: {} },
      configurable: true,
      writable: true,
    });

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);

    const warnings: string[] = [];
    const originalWarn = console.warn;
    const originalError = console.error;
    console.warn = (...args) => warnings.push(args.map(String).join(' '));
    console.error = (...args) => warnings.push(args.map(String).join(' '));

    const onChange = vi.fn();
    let dispose = () => {};
    try {
      dispose = hydrate(
        () => (
          <div>
            <ScuiDatePicker
              value="2026-11-10"
              label="日期"
              onChange={onChange}
              disabledDate={(date) => date.day === 13}
            />
          </div>
        ),
        container,
      );
    } finally {
      console.warn = originalWarn;
      console.error = originalError;
    }

    expect(warnings.filter((line) => /hydration|mismatch/i.test(line))).toEqual([]);
    const picker = container.querySelector('[data-scui-role="date-picker"]');
    expect(picker).toBeInTheDocument();
    expect(picker).toHaveAttribute('lang', 'zh-CN');

    const cell = container.querySelector('[data-scui-day="2026-11-12"]') as HTMLElement;
    cell.click();
    expect(onChange).toHaveBeenCalledWith('2026-11-12');

    dispose();
    container.remove();
  });
});
