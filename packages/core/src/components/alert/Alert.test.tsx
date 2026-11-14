/**
 * `Alert` 单测（T3-09）。
 *
 * 覆盖 §4.2 验收列里的「类型 / 可关闭 / 描述 / 操作」四条：kind 恒输出、
 * 关闭按钮整块缺席、操作区不留空盒子、关闭回调只发一次。
 * 视觉（四种配色）交给视觉基线，对比度交给 browser 的 axe 巡检。
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Alert } from './Alert';

afterEach(cleanup);

const root = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="alert"]');
const role = (name: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`[data-scui-role="alert-${name}"]`);

describe('Alert：类型与内容', () => {
  it('默认 kind=info 且恒输出 data-scui-kind', () => {
    render(() => <Alert title="提示" description="请填写必填项" />);
    expect(root()?.getAttribute('data-scui-kind')).toBe('info');
    expect(role('title')?.textContent).toBe('提示');
    expect(role('description')?.textContent).toBe('请填写必填项');
  });

  for (const kind of ['success', 'warning', 'error'] as const) {
    it(`${kind} 走同一个 data-scui-kind 属性`, () => {
      render(() => <Alert kind={kind} title="标题" />);
      expect(root()?.getAttribute('data-scui-kind')).toBe(kind);
    });
  }

  it('不传 description / action / children 时只输出必要块，不留空盒子', () => {
    render(() => <Alert title="标题" closable={false} />);
    expect(role('description')).toBeNull();
    expect(role('action')).toBeNull();
    expect(role('close')).toBeNull();
  });

  it('icon=null 时图标块整块缺席', () => {
    render(() => <Alert title="标题" icon={null} />);
    expect(role('icon')).toBeNull();
  });

  it('自定义 icon 与 action 原样渲染，children 作为补充正文', () => {
    render(() => (
      <Alert
        title="标题"
        icon={<span data-testid="my-icon">图形</span>}
        action={<button type="button">去处理</button>}
      >
        <p>补充正文</p>
      </Alert>
    ));
    expect(screen.getByTestId('my-icon')).toBeInTheDocument();
    expect(role('action')?.textContent).toContain('去处理');
    expect(root()?.textContent).toContain('补充正文');
  });
});

describe('Alert：可关闭', () => {
  it('默认有关闭按钮；点击移除自身并只发一次 onClose', () => {
    const onClose = vi.fn();
    render(() => <Alert title="提示" onClose={onClose} />);
    const button = role('close');
    expect(button).not.toBeNull();
    expect(button?.getAttribute('aria-label')).toBe('关闭');

    if (button) fireEvent.click(button);
    expect(root()).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closeLabel 覆盖无障碍文案', () => {
    render(() => <Alert title="提示" closeLabel="收起这条提示" />);
    expect(role('close')?.getAttribute('aria-label')).toBe('收起这条提示');
  });

  it('closable=false 时零输出关闭按钮，onClose 不会被触发', () => {
    const onClose = vi.fn();
    render(() => <Alert title="提示" closable={false} onClose={onClose} />);
    expect(role('close')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });
});
