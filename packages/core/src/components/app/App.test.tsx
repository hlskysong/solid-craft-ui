/**
 * App / Message / Notification 客户端实证（T2-06）。
 *
 * 重点不是「弹了个 div」，而是三条验收：脱离树可调用、context 与全局队列互不串、
 * Promise 风格句柄在关闭时 resolve。SSR 那条由 `ssr-smoke` 的真实服务端编译覆盖
 * （jsdom 里 `isServer=false`，做不了服务端 no-op 的判定）。
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import type { JSX } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { useApp } from './app-context';
import { message, notification } from './notice-api';
import type { AppContextValue } from './types';

const globalHost = () => document.querySelector('.scui-app-host');
const notices = (root: ParentNode = document) => [
  ...root.querySelectorAll('[data-scui-role="message"], [data-scui-role="notification"]'),
];

afterEach(() => {
  message.destroy();
  notification.destroy();
  cleanup();
  vi.useRealTimers();
});

/** 用按钮触发，保证 props getter 的首次求值发生在 root 内。 */
function Trigger(props: { label: string; onClick: () => void }): JSX.Element {
  return (
    <button type="button" onClick={props.onClick}>
      {props.label}
    </button>
  );
}

describe('App：宿主与容器契约', () => {
  it('根节点带 data-scui-role=app，且内联渲染两个反馈容器', () => {
    render(() => <App>子树</App>);
    expect(document.querySelector('[data-scui-role="app"]')).not.toBeNull();
    expect(screen.getByText('子树')).toBeInTheDocument();
    const messageViewport = document.querySelector('[data-scui-role="message-viewport"]');
    const notificationViewport = document.querySelector('[data-scui-role="notification-viewport"]');
    expect(messageViewport?.getAttribute('aria-live')).toBe('polite');
    expect(messageViewport?.getAttribute('data-scui-placement')).toBe('top');
    expect(notificationViewport?.getAttribute('aria-live')).toBe('assertive');
    expect(notificationViewport?.getAttribute('data-scui-placement')).toBe('top-right');
    expect(globalHost()).toBeNull();
  });

  it('App 的 placement 配置只作用于通知容器', () => {
    render(() => <App notification={{ placement: 'bottom-left' }}>子树</App>);
    expect(
      document
        .querySelector('[data-scui-role="message-viewport"]')
        ?.getAttribute('data-scui-placement'),
    ).toBe('top');
    expect(
      document
        .querySelector('[data-scui-role="notification-viewport"]')
        ?.getAttribute('data-scui-placement'),
    ).toBe('bottom-left');
  });
});

describe('静态 API：脱离组件树', () => {
  it('message.success 在没有 App 时也能挂到 body 并显示', () => {
    message.success('保存成功', 0);
    expect(globalHost()).not.toBeNull();
    const item = document.querySelector('[data-scui-role="message"]');
    expect(item?.textContent).toContain('保存成功');
    expect(item?.getAttribute('data-scui-kind')).toBe('success');
    expect(item?.getAttribute('role')).toBe('status');
  });

  it('useApp() 没有 Provider 时回落到同一个全局通道', () => {
    let api: AppContextValue | undefined;
    function Grab(): JSX.Element {
      api = useApp();
      return <Trigger label="回落" onClick={() => api?.message.info('回落提示', 0)} />;
    }
    render(() => <Grab />);
    fireEvent.click(screen.getByRole('button', { name: '回落' }));
    expect(globalHost()).not.toBeNull();
    expect(document.querySelector('[data-scui-role="message"]')?.textContent).toContain('回落提示');
  });

  it('useApp() 在 App 内走局部队列，不创建全局宿主', () => {
    let api: AppContextValue | undefined;
    function Grab(): JSX.Element {
      api = useApp();
      return <Trigger label="局部" onClick={() => api?.message.info('局部提示', 0)} />;
    }
    render(() => (
      <App>
        <Grab />
      </App>
    ));
    fireEvent.click(screen.getByRole('button', { name: '局部' }));
    expect(globalHost()).toBeNull();
    const local = document.querySelector('[data-scui-role="app"]');
    expect(notices(local ?? document)).toHaveLength(1);
    expect(local?.querySelector('[data-scui-role="message"]')?.textContent).toContain('局部提示');
  });

  it('destroy() 清空队列并移除全局宿主', () => {
    message.info('一', 0);
    expect(globalHost()).not.toBeNull();
    message.destroy();
    expect(globalHost()).toBeNull();
    expect(notices()).toHaveLength(0);
  });
});

describe('反馈条目：状态与交互', () => {
  it('五种语义类型分别落到 data-scui-kind', () => {
    // 全局默认 maxCount=3，连开 5 条会挤掉最旧两条；用局部 App 放开上限来验类型映射。
    let api: AppContextValue | undefined;
    function Grab(): JSX.Element {
      api = useApp();
      return <span />;
    }
    render(() => (
      <App message={{ maxCount: 5, duration: 0 }}>
        <Grab />
      </App>
    ));
    if (!api) throw new Error('useApp 未拿到局部通道');
    api.message.info('i');
    api.message.success('s');
    api.message.warning('w');
    api.message.error('e');
    api.message.loading('l');
    const local = document.querySelector('[data-scui-role="app"]');
    expect(notices(local ?? document).map((node) => node.getAttribute('data-scui-kind'))).toEqual([
      'info',
      'success',
      'warning',
      'error',
      'loading',
    ]);
  });

  it('notification 有描述与带可访问名称的关闭按钮', () => {
    notification.open({
      content: '同步完成',
      description: '共 12 条记录',
      duration: 0,
      kind: 'success',
    });
    const item = document.querySelector('[data-scui-role="notification"]');
    expect(item?.getAttribute('role')).toBe('alert');
    expect(item?.textContent).toContain('共 12 条记录');
    const close = screen.getByRole('button', { name: '关闭通知' });
    fireEvent.click(close);
    expect(document.querySelector('[data-scui-role="notification"]')).toBeNull();
  });

  it('handle.close() 让 Promise 风格句柄 resolve', async () => {
    const handle = message.info('等待关闭', 0);
    const settled = Promise.resolve(handle);
    handle.close();
    await expect(settled).resolves.toBeUndefined();
    expect(document.querySelector('[data-scui-role="message"]')).toBeNull();
  });

  it('handle.update() 就地改文案与类型，不新增条目', () => {
    const handle = message.loading('处理中', 0);
    handle.update({ content: '处理完成', kind: 'success' });
    expect(notices()).toHaveLength(1);
    const item = document.querySelector('[data-scui-role="message"]');
    expect(item?.textContent).toContain('处理完成');
    expect(item?.getAttribute('data-scui-kind')).toBe('success');
  });

  it('duration 到期自动关闭并触发 onClose', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    message.open({ content: '自动关闭', duration: 100, onClose });
    expect(notices()).toHaveLength(1);
    vi.advanceTimersByTime(100);
    expect(notices()).toHaveLength(0);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('duration=0 常驻，不创建定时器', () => {
    vi.useFakeTimers();
    message.open({ content: '常驻', duration: 0 });
    vi.advanceTimersByTime(100000);
    expect(notices()).toHaveLength(1);
  });

  it('maxCount 挤出最旧一条并让它的句柄 resolve', async () => {
    let api: AppContextValue | undefined;
    function Grab(): JSX.Element {
      api = useApp();
      return <span />;
    }
    render(() => (
      <App message={{ maxCount: 2, duration: 0 }}>
        <Grab />
      </App>
    ));
    if (!api) throw new Error('useApp 未拿到局部通道');
    const first = api.message.info('一');
    const settled = Promise.resolve(first);
    api.message.info('二');
    api.message.info('三');
    const local = document.querySelector('[data-scui-role="app"]');
    expect(notices(local ?? document)).toHaveLength(2);
    expect(local?.textContent).not.toContain('一');
    await expect(settled).resolves.toBeUndefined();
  });
});
