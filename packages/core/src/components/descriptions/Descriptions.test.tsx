/**
 * `Descriptions` 单测（T3-11）。
 *
 * 覆盖 §4.2「详情页键值展示」：标题 / 操作区按内容缺席、原生 dl/dt/dd 语义、
 * 三档列数与跨列恒输出、边框复用存在即真。范围按冻结面收口，不做
 * 紧凑档 / 可编辑 / 虚拟滚动。
 */
import { cleanup, render } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it } from 'vitest';

import { Descriptions } from './Descriptions';
import type { DescriptionsItem } from './types';

afterEach(cleanup);

const root = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-scui-role="descriptions"]');
const role = (name: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`[data-scui-role="descriptions-${name}"]`);

const items: DescriptionsItem[] = [
  { key: 'no', label: '项目编号', children: 'WJ-2026-012' },
  { key: 'name', label: '项目名称', children: '主通风机更新改造' },
  { key: 'amount', label: '本次采购金额', children: '148 万元' },
  { key: 'note', label: '备注', children: '含安装与调试', span: 2 },
];

describe('Descriptions：表头按内容缺席', () => {
  it('只传 items 时表头整块缺席，列表照常输出', () => {
    render(() => <Descriptions items={items} />);
    expect(root()).not.toBeNull();
    expect(role('header')).toBeNull();
    expect(role('list')?.tagName).toBe('DL');
    expect(role('title')).toBeNull();
    expect(role('extra')).toBeNull();
  });

  it('标题单独存在时表头出现，操作区块缺席', () => {
    render(() => <Descriptions items={items} title="采购计划详情" />);
    expect(role('header')).not.toBeNull();
    expect(role('title')?.textContent).toBe('采购计划详情');
    expect(role('extra')).toBeNull();
  });

  it('只有操作区时表头仍出现，标题块缺席', () => {
    render(() => <Descriptions items={items} extra={<button type="button">编辑</button>} />);
    expect(role('header')).not.toBeNull();
    expect(role('title')).toBeNull();
    expect(role('extra')?.textContent).toContain('编辑');
  });

  it('class 合并且原生属性透传到根节点', () => {
    render(() => <Descriptions items={items} class="my-desc" data-testid="desc-root" />);
    expect(root()?.classList.contains('scui-descriptions')).toBe(true);
    expect(root()?.classList.contains('my-desc')).toBe(true);
    expect(root()?.getAttribute('data-testid')).toBe('desc-root');
    expect(root()?.className).not.toMatch(/scui-descriptions--/);
  });
});

describe('Descriptions：dl 语义与键值成对', () => {
  it('每个 item 用 dt + dd 成对输出，顺序与 items 一致', () => {
    render(() => <Descriptions items={items} />);
    const labels = [
      ...document.querySelectorAll<HTMLElement>('[data-scui-role="descriptions-label"]'),
    ];
    const contents = [
      ...document.querySelectorAll<HTMLElement>('[data-scui-role="descriptions-content"]'),
    ];
    expect(labels).toHaveLength(4);
    expect(contents).toHaveLength(4);
    expect(labels[0]!.tagName).toBe('DT');
    expect(contents[0]!.tagName).toBe('DD');
    expect(labels[0]!.textContent).toBe('项目编号');
    expect(contents[0]!.textContent).toBe('WJ-2026-012');
  });

  it('children 缺席时仍渲染空 dd，不留塌陷', () => {
    render(() => <Descriptions items={[{ key: 'empty', label: '待补充' }]} />);
    const content = role('content');
    expect(content?.tagName).toBe('DD');
    expect(content?.textContent).toBe('');
  });

  it('items 是响应式的：增减后 DOM 跟着变', () => {
    const [list, setList] = createSignal<DescriptionsItem[]>([items[0]!]);
    render(() => <Descriptions items={list()} />);
    expect(document.querySelectorAll('[data-scui-role="descriptions-item"]')).toHaveLength(1);
    setList(items.slice(0, 3));
    expect(document.querySelectorAll('[data-scui-role="descriptions-item"]')).toHaveLength(3);
  });
});

describe('Descriptions：列数 / 跨列 / 边框三层', () => {
  it('默认两列，根节点恒输出 data-scui-column', () => {
    render(() => <Descriptions items={items} />);
    expect(root()?.getAttribute('data-scui-column')).toBe('2');
    expect(root()?.hasAttribute('data-scui-bordered')).toBe(false);
  });

  it('column 三档都落到属性上', () => {
    const [column, setColumn] = createSignal<1 | 2 | 3>(1);
    render(() => <Descriptions items={items} column={column()} />);
    expect(root()?.getAttribute('data-scui-column')).toBe('1');
    setColumn(3);
    expect(root()?.getAttribute('data-scui-column')).toBe('3');
    setColumn(2);
    expect(root()?.getAttribute('data-scui-column')).toBe('2');
  });

  it('span 缺省为 1，显式跨列按 item 恒输出', () => {
    render(() => <Descriptions items={items} />);
    const spans = [
      ...document.querySelectorAll<HTMLElement>('[data-scui-role="descriptions-item"]'),
    ].map((element) => element.getAttribute('data-scui-span'));
    expect(spans).toEqual(['1', '1', '1', '2']);
  });

  it('span=3 也照常输出，不混用 -layout / -type', () => {
    render(() => (
      <Descriptions
        items={[{ key: 'wide', label: '整行', children: '内容', span: 3 }]}
        column={3}
      />
    ));
    const item = document.querySelector<HTMLElement>('[data-scui-role="descriptions-item"]');
    expect(item?.getAttribute('data-scui-span')).toBe('3');
    expect(item?.hasAttribute('data-scui-layout')).toBe(false);
    expect(item?.hasAttribute('data-scui-type')).toBe(false);
  });

  it('bordered 走存在即真口径，且是响应式的', () => {
    const [bordered, setBordered] = createSignal(false);
    render(() => <Descriptions items={items} bordered={bordered()} />);
    expect(root()?.hasAttribute('data-scui-bordered')).toBe(false);
    setBordered(true);
    expect(root()?.getAttribute('data-scui-bordered')).toBe('');
  });
});
