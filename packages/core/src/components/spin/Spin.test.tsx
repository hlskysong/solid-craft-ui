/**
 * `Spin` 单测（T3-05）。
 *
 * `docs/08 §4.2` T3-05 验收列要求「Spin 延迟显示可测」，所以这里的重点是
 * `delay` 的三条时序行为，而不是「有没有渲染出一个圈」：
 * ① 延迟未到不显示；② 到点显示；③ 延迟期内取消，之后一次都不出现。
 *
 * fake timers 只伪造 `setTimeout` / `clearTimeout`，**不伪造 queueMicrotask** ——
 * Solid 靠微任务批量刷新 DOM，把微任务也伪造掉会让 `setVisible` 之后的 DOM
 * 永远不更新，用例会得到「定时器跑了但界面没变」的假失败。
 */
import { cleanup, render } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Spin } from './Spin';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const indicator = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="spin"]');

const container = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="spin-container"]');

describe('Spin / 基础形态', () => {
  it('默认 spinning 为 true，直接出转圈', () => {
    render(() => <Spin />);
    expect(indicator()).not.toBeNull();
  });

  it('spinning=false 时不渲染转圈', () => {
    render(() => <Spin spinning={false} />);
    expect(indicator()).toBeNull();
  });

  it('转圈带 role="status"，且无 tip 时有视觉隐藏文案', () => {
    render(() => <Spin />);
    expect(indicator()?.getAttribute('role')).toBe('status');
    expect(indicator()?.querySelector('.scui-spin__sr')?.textContent).toBe('加载中');
  });

  it('传 tip 时显示 tip 且不再输出隐藏文案', () => {
    render(() => <Spin tip="正在加载设备清单" />);
    expect(document.querySelector('[data-scui-role="spin-tip"]')?.textContent).toBe(
      '正在加载设备清单',
    );
    expect(document.querySelector('.scui-spin__sr')).toBeNull();
  });

  it('尺寸档落到属性上，默认 medium', () => {
    render(() => <Spin />);
    expect(indicator()?.getAttribute('data-scui-size')).toBe('medium');
    cleanup();

    render(() => <Spin size="large" />);
    expect(indicator()?.getAttribute('data-scui-size')).toBe('large');
  });
});

describe('Spin / 延迟显示', () => {
  it('delay 未到时不出转圈', () => {
    render(() => <Spin delay={200} />);
    expect(indicator()).toBeNull();
  });

  it('到点后出转圈', async () => {
    render(() => <Spin delay={200} />);
    expect(indicator()).toBeNull();

    await vi.advanceTimersByTimeAsync(199);
    expect(indicator()).toBeNull();

    await vi.advanceTimersByTimeAsync(1);
    expect(indicator()).not.toBeNull();
  });

  it('延迟期内取消，之后再等也不会出现', async () => {
    const [spinning, setSpinning] = createSignal(true);
    render(() => <Spin delay={300} spinning={spinning()} />);

    await vi.advanceTimersByTimeAsync(100);
    setSpinning(false);
    expect(indicator()).toBeNull();

    // 超过原定延迟时间：旧定时器必须已被 cleanup 清掉
    await vi.advanceTimersByTimeAsync(500);
    expect(indicator()).toBeNull();
  });

  it('delay 为 0 时立即显示（同步首帧，不等 effect）', () => {
    render(() => <Spin delay={0} />);
    expect(indicator()).not.toBeNull();
  });

  it('delay 为负数按 0 处理', () => {
    render(() => <Spin delay={-50} />);
    expect(indicator()).not.toBeNull();
  });

  it('spinning 从 false 切到 true 时重新计延迟', async () => {
    const [spinning, setSpinning] = createSignal(false);
    render(() => <Spin delay={150} spinning={spinning()} />);
    expect(indicator()).toBeNull();

    setSpinning(true);
    expect(indicator()).toBeNull();

    await vi.advanceTimersByTimeAsync(150);
    expect(indicator()).not.toBeNull();
  });
});

describe('Spin / 包裹模式', () => {
  it('包裹内容并盖上遮罩，容器声明 aria-busy', () => {
    render(() => (
      <Spin>
        <p data-testid="content">设备清单</p>
      </Spin>
    ));
    expect(document.querySelector('[data-testid="content"]')).not.toBeNull();
    expect(document.querySelector('[data-scui-role="spin-overlay"]')).not.toBeNull();
    expect(container()?.getAttribute('aria-busy')).toBe('true');
    expect(container()?.hasAttribute('data-scui-spinning')).toBe(true);
  });

  it('spinning=false 时内容仍在、遮罩与 aria-busy 都消失', () => {
    render(() => (
      <Spin spinning={false}>
        <p data-testid="content">设备清单</p>
      </Spin>
    ));
    expect(document.querySelector('[data-testid="content"]')).not.toBeNull();
    expect(document.querySelector('[data-scui-role="spin-overlay"]')).toBeNull();
    expect(container()?.hasAttribute('aria-busy')).toBe(false);
  });

  it('包裹模式下 class / style / 原生属性落在容器上，内层转圈不带', () => {
    render(() => (
      <Spin class="extra" style="min-height: 120px" data-testid="sc">
        <p>内容</p>
      </Spin>
    ));
    expect(container()?.classList.contains('extra')).toBe(true);
    expect(container()?.getAttribute('style')).toContain('min-height: 120px');
    expect(container()?.getAttribute('data-testid')).toBe('sc');
    expect(indicator()?.classList.contains('extra')).toBe(false);
  });
});
