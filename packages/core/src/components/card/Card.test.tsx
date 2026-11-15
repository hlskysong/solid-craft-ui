/**
 * `Card` 单测（T3-10）。
 *
 * 覆盖 §4.2 验收列的四项：标题 / 操作区 / 封面 / 加载。加载态的验收重点不是
 * 「有个 loading 属性」，而是「真的组合了 T3-05 的 Skeleton、正文真的被换掉、
 * 表头与封面真的还在」——只断言属性会漏掉整块占位没接上的假绿。
 */
import { cleanup, render } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it } from 'vitest';

import { Card } from './Card';

afterEach(cleanup);

const root = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="card"]');
const role = (name: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`[data-scui-role="card-${name}"]`);

describe('Card：结构按内容缺席', () => {
  it('只传 children 时封面与表头整块缺席，正文照常输出', () => {
    render(() => <Card>纯内容卡片</Card>);
    expect(root()).not.toBeNull();
    expect(role('cover')).toBeNull();
    expect(role('header')).toBeNull();
    expect(role('body')?.textContent).toBe('纯内容卡片');
  });

  it('标题单独存在时表头出现，操作区块缺席', () => {
    render(() => <Card title="采购计划">正文</Card>);
    expect(role('header')).not.toBeNull();
    expect(role('title')?.textContent).toBe('采购计划');
    expect(role('extra')).toBeNull();
  });

  it('只有操作区时表头仍出现，标题块缺席', () => {
    render(() => <Card extra={<button type="button">编辑</button>}>正文</Card>);
    expect(role('header')).not.toBeNull();
    expect(role('title')).toBeNull();
    expect(role('extra')?.textContent).toContain('编辑');
  });

  it('标题与操作区同处一个表头，封面在表头之前', () => {
    render(() => (
      <Card title="设备清单" extra={<span>共 12 条</span>} cover={<img src="cover.png" alt="" />}>
        正文
      </Card>
    ));
    expect(role('title')?.textContent).toBe('设备清单');
    expect(role('extra')?.textContent).toBe('共 12 条');
    expect(role('cover')?.querySelector('img')).not.toBeNull();
    const html = root()?.innerHTML ?? '';
    expect(html.indexOf('card-cover')).toBeGreaterThan(-1);
    expect(html.indexOf('card-cover')).toBeLessThan(html.indexOf('card-header'));
  });

  it('class 合并且原生属性透传到根节点', () => {
    render(() => (
      <Card class="my-card" data-testid="card-root" title="标题">
        正文
      </Card>
    ));
    expect(root()?.classList.contains('scui-card')).toBe(true);
    expect(root()?.classList.contains('my-card')).toBe(true);
    expect(root()?.getAttribute('data-testid')).toBe('card-root');
  });
});

describe('Card：加载态复用 Skeleton', () => {
  it('默认不输出 data-scui-loading，也不渲染骨架', () => {
    render(() => <Card title="标题">正文</Card>);
    expect(root()?.hasAttribute('data-scui-loading')).toBe(false);
    expect(document.querySelector('[data-scui-role="skeleton"]')).toBeNull();
    expect(role('body')?.textContent).toBe('正文');
  });

  it('loading=true 输出存在即真的属性并换成三行文本骨架', () => {
    render(() => (
      <Card title="标题" loading>
        正文
      </Card>
    ));
    expect(root()?.getAttribute('data-scui-loading')).toBe('');
    expect(role('body')?.textContent).not.toContain('正文');
    const skeleton = document.querySelector<HTMLElement>('[data-scui-role="skeleton"]');
    expect(skeleton?.getAttribute('data-scui-variant')).toBe('text');
    expect(skeleton?.querySelectorAll('[data-scui-role="skeleton-line"]')).toHaveLength(3);
  });

  it('加载时表头、标题、操作区与封面都仍在，卡片不塌成一张空壳', () => {
    render(() => (
      <Card title="标题" extra={<span>操作</span>} cover={<span>封面</span>} loading>
        正文
      </Card>
    ));
    expect(role('header')).not.toBeNull();
    expect(role('title')?.textContent).toBe('标题');
    expect(role('extra')?.textContent).toBe('操作');
    expect(role('cover')?.textContent).toBe('封面');
  });

  it('loading 是响应式的：切回 false 后正文回来、骨架消失', () => {
    const [loading, setLoading] = createSignal(false);
    render(() => (
      <Card title="标题" loading={loading()}>
        正文
      </Card>
    ));
    expect(document.querySelector('[data-scui-role="skeleton"]')).toBeNull();

    setLoading(true);
    expect(root()?.getAttribute('data-scui-loading')).toBe('');
    expect(document.querySelector('[data-scui-role="skeleton"]')).not.toBeNull();

    setLoading(false);
    expect(root()?.hasAttribute('data-scui-loading')).toBe(false);
    expect(document.querySelector('[data-scui-role="skeleton"]')).toBeNull();
    expect(role('body')?.textContent).toBe('正文');
  });
});
