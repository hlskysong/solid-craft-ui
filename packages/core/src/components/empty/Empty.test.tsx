/**
 * `Empty` 单测（T3-05）。
 *
 * 覆盖 `docs/08 §4.2` T3-05 验收列里与本组件相关的两条：各 ≥3 Demo（由
 * `check:ci` 判据 11 在产物层验）、空状态的可访问性与「不渲染空壳」。
 *
 * 这里刻意不验尺寸像素：jsdom 没有布局引擎，`block-size` 全部读成 0，
 * 插画尺寸与三档表现交给视觉基线 + browser 用例。
 */
import { cleanup, render } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vitest';

import { Empty } from './Empty';

afterEach(cleanup);

const root = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="empty"]');

describe('Empty', () => {
  it('默认文案是「暂无数据」，并输出内置插画', () => {
    render(() => <Empty />);
    expect(document.querySelector('[data-scui-role="empty-description"]')?.textContent).toBe(
      '暂无数据',
    );
    const image = document.querySelector('[data-scui-role="empty-image"]');
    expect(image?.querySelector('svg')).not.toBeNull();
  });

  it('内置插画是装饰性的：aria-hidden 到位', () => {
    render(() => <Empty />);
    const svg = root()?.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('自定义插画整体替换内置图形（不是叠加）', () => {
    render(() => (
      <Empty image={<span data-testid="custom-art">自定义</span>}>
        <span>子节点</span>
      </Empty>
    ));
    const image = document.querySelector('[data-scui-role="empty-image"]');
    expect(image?.querySelector('[data-testid="custom-art"]')).not.toBeNull();
    expect(root()?.querySelector('svg')).toBeNull();
  });

  it('image 传 null 时不渲染插画块（纯文字空状态）', () => {
    render(() => <Empty image={null} />);
    expect(document.querySelector('[data-scui-role="empty-image"]')).toBeNull();
  });

  it('不传 image 与传 null 是两种语义：前者仍出内置插画', () => {
    render(() => <Empty />);
    expect(document.querySelector('[data-scui-role="empty-image"]')).not.toBeNull();
  });

  it('description 接受节点而不是只接受字符串', () => {
    render(() => <Empty description={<strong data-testid="rich">还没有任何记录</strong>} />);
    expect(document.querySelector('[data-testid="rich"]')?.textContent).toBe('还没有任何记录');
  });

  it('不传 children 时不渲染操作区（DOM 里不留空壳）', () => {
    render(() => <Empty />);
    expect(document.querySelector('[data-scui-role="empty-footer"]')).toBeNull();
  });

  it('传 children 时渲染操作区', () => {
    render(() => (
      <Empty>
        <button type="button">新建</button>
      </Empty>
    ));
    expect(document.querySelector('[data-scui-role="empty-footer"] button')?.textContent).toBe(
      '新建',
    );
  });

  it('尺寸档落到属性上，默认 medium', () => {
    render(() => <Empty />);
    expect(root()?.getAttribute('data-scui-size')).toBe('medium');
    cleanup();

    render(() => <Empty size="small" />);
    expect(root()?.getAttribute('data-scui-size')).toBe('small');
  });

  it('透传原生属性与 class / style', () => {
    render(() => <Empty class="extra" style="margin: 8px" aria-label="空表格" />);
    expect(root()?.classList.contains('extra')).toBe(true);
    // jsdom 会把 style 规范化成带结尾分号的形态，这里只断言声明本身
    expect(root()?.getAttribute('style')).toContain('margin: 8px');
    expect(root()?.getAttribute('aria-label')).toBe('空表格');
  });
});
