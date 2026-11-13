/**
 * `Pagination` 单测（T3-04）。
 *
 * 覆盖 `docs/08 §4.2` T3-04 验收列的三条：总页数变化时当前页收敛不越界、
 * 键盘可达 + axe 0 violation（键盘在单测里验原生控件可达性，axe 由 browser 用例覆盖）、
 * 组件自身 `onChange` 与 Table 集成互不冲突（本组件不感知 Table，事件是纯数据）。
 *
 * SSR 双渲确定性由 `spikes/shared/ssr-smoke.mjs` 的 T3-04 入口验；
 * jsdom 下 JSX 已被编成 `document.createElement`，这里做不了真 SSR。
 */
import { cleanup, fireEvent, render, waitFor } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Pagination } from './Pagination';
import { buildPageItems, clampPage, getPageCount, getPageRange } from './pagination-engine';
import type { PaginationChange } from './types';

afterEach(cleanup);

const pageButtons = (): NodeListOf<HTMLButtonElement> =>
  document.querySelectorAll<HTMLButtonElement>('[data-scui-role="pagination-page"]');

const pageButton = (page: number): HTMLButtonElement | null =>
  document.querySelector<HTMLButtonElement>(
    `[data-scui-role="pagination-page"][data-scui-page="${page}"]`,
  );

const prevButton = (): HTMLButtonElement | null =>
  document.querySelector<HTMLButtonElement>('[data-scui-role="pagination-prev"]');

const nextButton = (): HTMLButtonElement | null =>
  document.querySelector<HTMLButtonElement>('[data-scui-role="pagination-next"]');

const sizeSelect = (): HTMLSelectElement | null =>
  document.querySelector<HTMLSelectElement>('[data-scui-role="pagination-size"]');

const jumpInput = (): HTMLInputElement | null =>
  document.querySelector<HTMLInputElement>('[data-scui-role="pagination-jump"]');

const gaps = (): NodeListOf<HTMLElement> =>
  document.querySelectorAll<HTMLElement>('[data-scui-role="pagination-gap"]');

/** 当前页按钮的文本；没有 `aria-current` 时返回 undefined。 */
const currentPage = (): string | undefined =>
  document.querySelector<HTMLElement>('[aria-current="page"]')?.textContent?.trim() ?? undefined;

const clickNode = (node: Element | null | undefined, label: string): void => {
  if (node === null || node === undefined) throw new Error(`缺少交互元素：${label}`);
  fireEvent.click(node);
};

const lastChange = (spy: ReturnType<typeof vi.fn>): PaginationChange => {
  const call = spy.mock.calls.at(-1);
  if (call === undefined) throw new Error('onChange 未被调用');
  return call[0] as PaginationChange;
};

describe('Pagination：基础结构', () => {
  it('默认渲染：nav 语义、当前页 aria-current、首末页边界禁用', () => {
    render(() => <Pagination total={100} />);

    const nav = document.querySelector('nav');
    expect(nav).toHaveAttribute('aria-label', '分页');
    expect(nav).toHaveAttribute('data-scui-role', 'pagination');
    expect(nav).toHaveAttribute('data-scui-size', 'medium');

    // 10 页走 7 槽窗口：1 2 3 4 … 10，共 5 个页码按钮 + 1 个省略号
    expect(pageButtons()).toHaveLength(5);
    expect(gaps()).toHaveLength(1);
    expect(pageButton(10)).not.toBeNull();
    expect(currentPage()).toBe('1');
    expect(pageButton(1)).toHaveAttribute('data-scui-current', '');
    expect(pageButton(1)).toHaveAttribute('aria-current', 'page');
    expect(pageButton(2)).not.toHaveAttribute('data-scui-current');

    // 第 1 页：上一页禁用、下一页可用
    expect(prevButton()?.disabled).toBe(true);
    expect(nextButton()?.disabled).toBe(false);
  });

  it('total 为 0 时仍有一页结构，且上一页 / 下一页全禁用', () => {
    render(() => <Pagination total={0} />);

    expect(pageButtons()).toHaveLength(1);
    expect(currentPage()).toBe('1');
    expect(prevButton()?.disabled).toBe(true);
    expect(nextButton()?.disabled).toBe(true);
  });

  it('全部交互控件都是原生元素且没有 tabindex="-1"（键盘 Tab 可达）', () => {
    render(() => <Pagination total={100} showSizeChanger showQuickJumper />);

    expect(document.querySelectorAll('[tabindex="-1"]')).toHaveLength(0);
    expect(pageButton(2)?.tagName).toBe('BUTTON');
    expect(pageButton(2)?.getAttribute('type')).toBe('button');
    expect(sizeSelect()?.tagName).toBe('SELECT');
    expect(jumpInput()?.tagName).toBe('INPUT');
    expect(prevButton()?.getAttribute('aria-label')).toBe('上一页');
    expect(nextButton()?.getAttribute('aria-label')).toBe('下一页');
    expect(jumpInput()?.getAttribute('aria-label')).toBe('跳至页码');
  });
});

describe('Pagination：页码与边界', () => {
  it('点击页码发 onChange，携带 current / pageSize / total 三参', async () => {
    const onChange = vi.fn();
    render(() => <Pagination total={100} onChange={onChange} />);

    clickNode(pageButton(3), '第 3 页');
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(lastChange(onChange)).toEqual({ current: 3, pageSize: 10, total: 100 });
    expect(currentPage()).toBe('3');
  });

  it('点击当前页不重复发事件', async () => {
    const onChange = vi.fn();
    render(() => <Pagination total={100} defaultCurrent={2} onChange={onChange} />);

    clickNode(pageButton(2), '已是当前页');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('上一页 / 下一页按一步移动，末页时下一页禁用', async () => {
    const onChange = vi.fn();
    render(() => <Pagination total={100} onChange={onChange} />);

    clickNode(nextButton(), '下一页');
    await waitFor(() => expect(currentPage()).toBe('2'));
    expect(lastChange(onChange)).toEqual({ current: 2, pageSize: 10, total: 100 });

    clickNode(pageButton(10), '第 10 页');
    await waitFor(() => expect(currentPage()).toBe('10'));
    expect(nextButton()?.disabled).toBe(true);

    clickNode(prevButton(), '上一页');
    await waitFor(() => expect(currentPage()).toBe('9'));
  });

  it('省略号：总页数多时固定 7 槽，页码不重复、不越界', () => {
    render(() => <Pagination total={100} defaultCurrent={5} />);

    const pages = [...pageButtons()].map((node) => Number(node.dataset.scuiPage));
    expect(pages).toEqual([1, 4, 5, 6, 10]);
    expect(gaps()).toHaveLength(2);
    // 省略号只是占位，不接受点击
    for (const gap of gaps()) {
      expect(gap.getAttribute('aria-hidden')).toBe('true');
      expect(gap.tagName).not.toBe('BUTTON');
    }
  });
});

describe('Pagination：收敛与受控', () => {
  it('非受控：总条数缩小后当前页收敛不越界', async () => {
    const [total, setTotal] = createSignal(100);
    render(() => <Pagination total={total()} />);

    clickNode(pageButton(10), '第 10 页');
    await waitFor(() => expect(currentPage()).toBe('10'));

    setTotal(20);
    await waitFor(() => expect(currentPage()).toBe('2'));
    expect(pageButtons()).toHaveLength(2);
    expect(nextButton()?.disabled).toBe(true);
  });

  it('受控：点击只发 onChange，视图停留（DOM 回弹）', async () => {
    const onChange = vi.fn();
    render(() => <Pagination total={100} current={1} onChange={onChange} />);

    clickNode(pageButton(3), '第 3 页');
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(lastChange(onChange).current).toBe(3);
    // 受控值没变：当前页仍是第 1 页
    expect(currentPage()).toBe('1');
  });

  it('受控越界值在渲染时收敛，不输出越界页码', () => {
    render(() => <Pagination total={100} current={99} />);

    expect(currentPage()).toBe('10');
    expect(pageButtons()).toHaveLength(5);
    expect(pageButton(99)).toBeNull();
  });

  it('受控 + 外部回写：形成正常翻页闭环', async () => {
    const [page, setPage] = createSignal(1);
    render(() => (
      <Pagination total={100} current={page()} onChange={(change) => setPage(change.current)} />
    ));

    clickNode(nextButton(), '下一页');
    await waitFor(() => expect(currentPage()).toBe('2'));
    clickNode(prevButton(), '上一页');
    await waitFor(() => expect(currentPage()).toBe('1'));
  });
});

describe('Pagination：每页条数', () => {
  it('默认不显示切换器；开启后切换会改页码数量并发事件', async () => {
    const onChange = vi.fn();
    render(() => <Pagination total={100} defaultCurrent={5} showSizeChanger onChange={onChange} />);

    expect(sizeSelect()).not.toBeNull();
    // 10 页 → 第 10 页在窗口里（末页恒显示）
    expect(pageButton(10)).not.toBeNull();

    fireEvent.change(sizeSelect()!, { target: { value: '20' } });
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(lastChange(onChange)).toEqual({ current: 5, pageSize: 20, total: 100 });
    // 改成 20 条/页后只有 5 页，全量输出且不再有省略号
    expect(pageButtons()).toHaveLength(5);
    expect(pageButton(10)).toBeNull();
    expect(gaps()).toHaveLength(0);
  });

  it('切换每页条数后当前页按新的总页数收敛', async () => {
    render(() => <Pagination total={100} defaultCurrent={10} showSizeChanger />);

    expect(currentPage()).toBe('10');

    fireEvent.change(sizeSelect()!, { target: { value: '50' } });
    await waitFor(() => expect(currentPage()).toBe('2'));
    expect(pageButtons()).toHaveLength(2);
  });

  it('当前 pageSize 不在候选里时补进选项，select 不会显示成第一项', () => {
    render(() => (
      <Pagination total={100} defaultPageSize={30} pageSizeOptions={[10, 20]} showSizeChanger />
    ));

    expect(sizeSelect()?.selectedOptions[0]?.value).toBe('30');
  });

  it('关闭切换器时不渲染 select', () => {
    render(() => <Pagination total={100} />);
    expect(sizeSelect()).toBeNull();
  });
});

describe('Pagination：快速跳转', () => {
  it('Enter 提交合法页码并清空草稿', async () => {
    const onChange = vi.fn();
    render(() => <Pagination total={100} showQuickJumper onChange={onChange} />);

    fireEvent.input(jumpInput()!, { target: { value: '7' } });
    fireEvent.keyDown(jumpInput()!, { key: 'Enter' });

    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(lastChange(onChange)).toEqual({ current: 7, pageSize: 10, total: 100 });
    expect(jumpInput()?.value).toBe('');
  });

  it('越界输入收敛到末页', async () => {
    render(() => <Pagination total={100} showQuickJumper />);

    fireEvent.input(jumpInput()!, { target: { value: '999' } });
    fireEvent.keyDown(jumpInput()!, { key: 'Enter' });

    await waitFor(() => expect(currentPage()).toBe('10'));
  });

  it('非法输入只清空不跳页', async () => {
    const onChange = vi.fn();
    render(() => <Pagination total={100} showQuickJumper onChange={onChange} />);

    fireEvent.input(jumpInput()!, { target: { value: 'abc' } });
    fireEvent.keyDown(jumpInput()!, { key: 'Enter' });

    expect(onChange).not.toHaveBeenCalled();
    expect(currentPage()).toBe('1');
    expect(jumpInput()?.value).toBe('');
  });

  it('非 Enter 按键不提交', async () => {
    const onChange = vi.fn();
    render(() => <Pagination total={100} showQuickJumper onChange={onChange} />);

    fireEvent.input(jumpInput()!, { target: { value: '7' } });
    fireEvent.keyDown(jumpInput()!, { key: 'a' });

    expect(onChange).not.toHaveBeenCalled();
    expect(currentPage()).toBe('1');
  });
});

describe('Pagination：禁用', () => {
  it('禁用时全部控件原生 disabled 且点击不触发事件', () => {
    const onChange = vi.fn();
    render(() => (
      <Pagination total={100} disabled showSizeChanger showQuickJumper onChange={onChange} />
    ));

    expect(document.querySelector('nav')).toHaveAttribute('data-scui-disabled', '');
    expect(prevButton()?.disabled).toBe(true);
    expect(nextButton()?.disabled).toBe(true);
    expect(pageButton(2)?.disabled).toBe(true);
    expect(sizeSelect()?.disabled).toBe(true);
    expect(jumpInput()?.disabled).toBe(true);

    clickNode(nextButton(), '禁用的下一页');
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Pagination：总数文案', () => {
  it('showTotal 拿到总条数与当前区间，随页码更新', async () => {
    render(() => (
      <Pagination
        total={95}
        defaultCurrent={10}
        showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条 / 共 ${total} 条`}
      />
    ));

    expect(document.querySelector('[data-scui-role="pagination-total"]')?.textContent).toBe(
      '第 91-95 条 / 共 95 条',
    );
  });
});

describe('Pagination 引擎：纯函数', () => {
  it('getPageCount：至少一页，向上取整', () => {
    expect(getPageCount(0, 10)).toBe(1);
    expect(getPageCount(10, 10)).toBe(1);
    expect(getPageCount(11, 10)).toBe(2);
    expect(getPageCount(100, 10)).toBe(10);
    // 非法 pageSize 兜底为 1，不产生 Infinity / NaN
    expect(getPageCount(5, 0)).toBe(5);
  });

  it('clampPage：截断小数、夹在 [1, pageCount]、非有限数回落到 1', () => {
    expect(clampPage(0, 10)).toBe(1);
    expect(clampPage(-3, 10)).toBe(1);
    expect(clampPage(3.9, 10)).toBe(3);
    expect(clampPage(99, 10)).toBe(10);
    expect(clampPage(Number.NaN, 10)).toBe(1);
    expect(clampPage(3, 0)).toBe(1);
  });

  it('buildPageItems：7 槽窗口、贴边补位、页码不重复', () => {
    const middle = buildPageItems(5, 10);
    expect(middle.map((item) => item.type)).toEqual([
      'page',
      'gap',
      'page',
      'page',
      'page',
      'gap',
      'page',
    ]);
    expect(middle.filter((item) => item.type === 'page').map((item) => item.page)).toEqual([
      1, 4, 5, 6, 10,
    ]);

    const head = buildPageItems(1, 10);
    expect(head.filter((item) => item.type === 'page').map((item) => item.page)).toEqual([
      1, 2, 3, 4, 10,
    ]);

    const tail = buildPageItems(10, 10);
    expect(tail.filter((item) => item.type === 'page').map((item) => item.page)).toEqual([
      1, 7, 8, 9, 10,
    ]);

    // 少于 7 页时全量输出，没有省略号
    expect(buildPageItems(2, 5).map((item) => item.page)).toEqual([1, 2, 3, 4, 5]);

    // key 唯一，供 <For> 做 keyed diff
    const keys = middle.map((item) => item.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('getPageRange：首页 / 末页 / 空数据', () => {
    expect(getPageRange(1, 10, 95)).toEqual([1, 10]);
    expect(getPageRange(10, 10, 95)).toEqual([91, 95]);
    expect(getPageRange(1, 10, 0)).toEqual([0, 0]);
    // 越界页码先收敛再算区间
    expect(getPageRange(99, 10, 95)).toEqual([91, 95]);
  });
});
