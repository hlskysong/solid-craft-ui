/**
 * `RangePicker` 组件层单测（T2-11）。
 *
 * 区间语义（归一化 / 命中判定）已在 `calendar-range.ts` 里是纯函数，日期运算与中文格式化
 * 在 `date-picker/calendar.ts` 里也验过了，这里只验组件自己负责的事：
 *  1. `data-scui-*` 状态契约、三档尺寸、A11y 属性（两个 combobox + 一个 group）；
 *  2. `picking` 状态机：起点 → 终点两段落点、**只选起点不发值**、关闭即丢弃待定起点；
 *  3. hover 预览：选终点过程中跟随悬停高亮，反向悬停自动排序，移出即回到单点；
 *  4. 边界：同日 / 跨月 / 跨年、`min`·`max`·`disabledDate`、手输非法与越界回滚；
 *  5. 键盘与焦点管理：方向键漫游、Enter 两段落点、Tab 交回同级输入框、Esc 回焦；
 *  6. 值桥：非受控 / 受控回弹 / `<Form.Item>` 字段优先且两个输入框 id 不重复。
 *
 * SSR 双渲确定性由 `spikes/shared/ssr-smoke.mjs` 的 T2-11 入口验：jsdom 下 JSX 已被
 * 编成 `document.createElement`，这里做不了真 SSR。
 */
import { cleanup, fireEvent, render, waitFor } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Form } from '../form';
import { RangePicker } from './RangePicker';

afterEach(cleanup);

function element<T extends HTMLElement = HTMLElement>(selector: string): T {
  const node = document.querySelector(selector);
  if (!(node instanceof HTMLElement)) throw new Error(`未找到元素 ${selector}`);
  return node as T;
}

const root = () => element('[data-scui-role="range-picker"]');
const startInput = () => element<HTMLInputElement>('[data-scui-role="range-start-input"]');
const endInput = () => element<HTMLInputElement>('[data-scui-role="range-end-input"]');
const calendar = () => document.querySelector('[data-scui-role="range-calendar"]');
const summary = () => element('[data-scui-role="range-summary"]');
const dayCell = (iso: string) => element<HTMLButtonElement>(`button[data-scui-day="${iso}"]`);
const hasFlag = (iso: string, flag: string) => dayCell(iso).hasAttribute(flag);

const openFromStart = () => {
  fireEvent.click(startInput());
};

/** 点一次起点、点一次终点，返回 `onChange` 的 spy。 */
function pickRange(from: string, to: string) {
  const onChange = vi.fn();
  render(() => <RangePicker defaultValue={['2026-03-10', '2026-03-20']} onChange={onChange} />);
  openFromStart();
  fireEvent.click(dayCell(from));
  fireEvent.click(dayCell(to));
  return onChange;
}

describe('RangePicker 状态契约与 A11y', () => {
  it('默认输出 medium / invalid=false / picking=start，且未展开时不渲染日历', () => {
    render(() => <RangePicker />);

    expect(root().getAttribute('data-scui-size')).toBe('medium');
    expect(root().getAttribute('data-scui-invalid')).toBe('false');
    expect(root().getAttribute('data-scui-picking')).toBe('start');
    expect(root().getAttribute('lang')).toBe('zh-CN');
    // 根是 <fieldset>（隐含 group 语义）：给 div 硬挂 role="group" 会被 Biome 判错，
    // 不挂角色又会让 aria-label 落到 generic 上，所以语义靠原生元素而不是 role 字符串。
    expect(root().tagName).toBe('FIELDSET');
    expect(root().hasAttribute('data-scui-open')).toBe(false);
    expect(calendar()).toBeNull();
    // 两个可编辑 combobox + dialog 弹层：与 DatePicker 同一取舍（裸 aria-expanded 会被
    // axe 判 aria-allowed-attr critical）。
    for (const input of [startInput(), endInput()]) {
      expect(input.getAttribute('role')).toBe('combobox');
      expect(input.getAttribute('aria-haspopup')).toBe('dialog');
      expect(input.getAttribute('aria-expanded')).toBe('false');
    }
    expect(startInput().getAttribute('aria-label')).toBe('开始日期');
    expect(endInput().getAttribute('aria-label')).toBe('结束日期');
    expect(startInput().placeholder).toBe('开始日期');
    expect(endInput().placeholder).toBe('结束日期');
  });

  it('三档尺寸与 error / disabled 状态', () => {
    render(() => (
      <>
        <RangePicker size="small" />
        <RangePicker size="large" status="error" />
        <RangePicker disabled />
      </>
    ));

    const roots = document.querySelectorAll('[data-scui-role="range-picker"]');
    expect(roots[0]?.getAttribute('data-scui-size')).toBe('small');
    expect(roots[1]?.getAttribute('data-scui-size')).toBe('large');
    expect(roots[1]?.getAttribute('data-scui-invalid')).toBe('true');
    const disabledRoot = roots[2];
    expect(disabledRoot?.hasAttribute('data-scui-disabled')).toBe(true);
    const inputs = disabledRoot?.querySelectorAll('input') ?? [];
    expect([...inputs].every((input) => input.disabled)).toBe(true);
    // 禁用时点开也无弹层（点的是那个禁用实例自己的输入框）
    const disabledStart = inputs[0];
    if (!(disabledStart instanceof HTMLInputElement)) throw new Error('未找到禁用态起点输入框');
    fireEvent.click(disabledStart);
    expect(calendar()).toBeNull();
  });

  it('展开后输出中文月标题、42 格，且两个输入框指向同一个日历 id', () => {
    render(() => <RangePicker defaultValue={['2026-03-10', '2026-03-20']} />);
    openFromStart();

    expect(root().hasAttribute('data-scui-open')).toBe(true);
    expect(startInput().getAttribute('aria-expanded')).toBe('true');
    expect(calendar()).not.toBeNull();
    expect(element('[data-scui-role="month-label"]').textContent).toBe('2026年3月');
    expect(document.querySelectorAll('button[data-scui-day]')).toHaveLength(42);

    const calendarId = calendar()?.id ?? '';
    expect(calendarId).not.toBe('');
    expect(startInput().getAttribute('aria-controls')).toBe(calendarId);
    expect(endInput().getAttribute('aria-controls')).toBe(calendarId);

    const weekdays = [...document.querySelectorAll('[data-scui-role="weekdays"] th')].map(
      (node) => node.textContent,
    );
    expect(weekdays).toEqual(['周一', '周二', '周三', '周四', '周五', '周六', '周日']);
  });

  it('周首日可切到周日', () => {
    render(() => <RangePicker weekStartsOn="sun" />);
    openFromStart();

    const weekdays = [...document.querySelectorAll('[data-scui-role="weekdays"] th')].map(
      (node) => node.textContent,
    );
    expect(weekdays[0]).toBe('周日');
  });
});

describe('RangePicker 区间选择（点选）', () => {
  it('同日：同一格点两次，两端合一且同时标记起终', () => {
    const onChange = pickRange('2026-03-15', '2026-03-15');

    expect(onChange).toHaveBeenCalledWith(['2026-03-15', '2026-03-15']);
    expect(startInput().value).toBe('2026-03-15');
    expect(endInput().value).toBe('2026-03-15');
    // 两端齐备即关闭
    expect(calendar()).toBeNull();

    openFromStart();
    expect(hasFlag('2026-03-15', 'data-scui-range-start')).toBe(true);
    expect(hasFlag('2026-03-15', 'data-scui-range-end')).toBe(true);
    expect(dayCell('2026-03-16').getAttribute('data-scui-in-range')).toBeNull();
  });

  it('跨月：起点在本月、翻页后在次月落终点', () => {
    const onChange = vi.fn();
    render(() => <RangePicker defaultValue={['2026-03-01', '2026-03-05']} onChange={onChange} />);
    openFromStart();
    fireEvent.click(dayCell('2026-03-28'));

    fireEvent.keyDown(startInput(), { key: 'PageDown' });
    expect(element('[data-scui-role="month-label"]').textContent).toBe('2026年4月');

    fireEvent.click(dayCell('2026-04-02'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(['2026-03-28', '2026-04-02']);
  });

  it('跨年：起点在 12 月、翻页后落在次年 1 月', () => {
    const onChange = vi.fn();
    render(() => <RangePicker defaultValue={['2026-11-30', '2026-12-01']} onChange={onChange} />);
    openFromStart();

    fireEvent.keyDown(startInput(), { key: 'PageDown' });
    expect(element('[data-scui-role="month-label"]').textContent).toBe('2026年12月');
    fireEvent.click(dayCell('2026-12-30'));
    fireEvent.keyDown(startInput(), { key: 'PageDown' });
    expect(element('[data-scui-role="month-label"]').textContent).toBe('2027年1月');

    fireEvent.click(dayCell('2027-01-02'));
    expect(onChange).toHaveBeenCalledWith(['2026-12-30', '2027-01-02']);
    expect(startInput().value).toBe('2026-12-30');
    expect(endInput().value).toBe('2027-01-02');
  });

  it('反向点击自动归一化成有序区间', () => {
    const onChange = vi.fn();
    render(() => <RangePicker defaultValue={['2026-03-01', '2026-03-28']} onChange={onChange} />);
    openFromStart();

    fireEvent.click(dayCell('2026-03-20'));
    fireEvent.click(dayCell('2026-03-10'));

    expect(onChange).toHaveBeenCalledWith(['2026-03-10', '2026-03-20']);
    expect(startInput().value).toBe('2026-03-10');
    expect(endInput().value).toBe('2026-03-20');
  });

  it('重新选中同一区间不重复发 onChange（写值去重）', () => {
    const onChange = vi.fn();
    render(() => <RangePicker defaultValue={['2026-03-10', '2026-03-20']} onChange={onChange} />);
    openFromStart();

    fireEvent.click(dayCell('2026-03-10'));
    fireEvent.click(dayCell('2026-03-20'));

    expect(onChange).not.toHaveBeenCalled();
    expect(calendar()).toBeNull();
  });

  it('只点起点不发值：摘要提示选终点，关闭后待定起点丢弃', () => {
    const onChange = vi.fn();
    render(() => <RangePicker min="2026-03-01" onChange={onChange} />);
    openFromStart();

    fireEvent.click(dayCell('2026-03-10'));

    expect(onChange).not.toHaveBeenCalled();
    expect(root().getAttribute('data-scui-picking')).toBe('end');
    expect(summary().textContent).toBe('请选择结束日期');
    expect(calendar()).not.toBeNull();

    fireEvent.keyDown(element('[data-scui-role="range-popup"]'), { key: 'Escape' });

    expect(calendar()).toBeNull();
    expect(startInput().value).toBe('');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('受控：外部不回写时两个输入框都回弹到外部值', () => {
    const onChange = vi.fn();
    render(() => <RangePicker value={['2026-03-10', '2026-03-14']} onChange={onChange} />);
    openFromStart();

    fireEvent.click(dayCell('2026-03-20'));
    fireEvent.click(dayCell('2026-03-25'));

    expect(onChange).toHaveBeenCalledWith(['2026-03-20', '2026-03-25']);
    expect(startInput().value).toBe('2026-03-10');
    expect(endInput().value).toBe('2026-03-14');
  });
});

describe('RangePicker hover 预览', () => {
  it('选终点时悬停即时高亮区间，移出日历回到单点', () => {
    render(() => <RangePicker defaultValue={['2026-03-10', '2026-03-20']} />);
    openFromStart();
    // 重新定义起点，进入 picking = 'end'
    fireEvent.click(dayCell('2026-03-11'));

    fireEvent.pointerEnter(dayCell('2026-03-14'));

    expect(hasFlag('2026-03-11', 'data-scui-range-start')).toBe(true);
    expect(hasFlag('2026-03-12', 'data-scui-in-range')).toBe(true);
    expect(hasFlag('2026-03-13', 'data-scui-in-range')).toBe(true);
    expect(hasFlag('2026-03-14', 'data-scui-range-end')).toBe(true);
    expect(hasFlag('2026-03-15', 'data-scui-in-range')).toBe(false);

    fireEvent.pointerLeave(element('[data-scui-role="range-calendar"]'));

    expect(hasFlag('2026-03-11', 'data-scui-range-start')).toBe(true);
    expect(hasFlag('2026-03-11', 'data-scui-range-end')).toBe(true);
    expect(hasFlag('2026-03-12', 'data-scui-in-range')).toBe(false);
  });

  it('反向悬停（早于起点）预览自动排序', () => {
    render(() => <RangePicker defaultValue={['2026-03-10', '2026-03-20']} />);
    openFromStart();
    fireEvent.click(dayCell('2026-03-18'));

    fireEvent.pointerEnter(dayCell('2026-03-15'));

    // 区间被归一成 [03-15, 03-18]：悬停日成了视觉起点
    expect(hasFlag('2026-03-15', 'data-scui-range-start')).toBe(true);
    expect(hasFlag('2026-03-18', 'data-scui-range-end')).toBe(true);
    expect(hasFlag('2026-03-16', 'data-scui-in-range')).toBe(true);
  });
});

describe('RangePicker 边界与禁用', () => {
  it('min / max 同时约束两端，越界格点不动', () => {
    const onChange = vi.fn();
    render(() => <RangePicker min="2026-03-10" max="2026-03-20" onChange={onChange} />);
    openFromStart();

    expect(dayCell('2026-03-09').disabled).toBe(true);
    expect(dayCell('2026-03-21').disabled).toBe(true);
    expect(dayCell('2026-03-10').disabled).toBe(false);
    expect(dayCell('2026-03-20').disabled).toBe(false);

    fireEvent.click(dayCell('2026-03-09'));
    expect(onChange).not.toHaveBeenCalled();
    expect(root().getAttribute('data-scui-picking')).toBe('start');
  });

  it('disabledDate 与 min / max 叠加生效', () => {
    const onChange = vi.fn();
    render(() => (
      <RangePicker
        disabledDate={(date) => date.day % 2 === 0}
        min="2026-03-01"
        max="2026-03-28"
        onChange={onChange}
      />
    ));
    openFromStart();

    expect(dayCell('2026-03-16').disabled).toBe(true);
    expect(dayCell('2026-03-17').disabled).toBe(false);
    fireEvent.click(dayCell('2026-03-16'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('手输非法日期失焦后回滚，不触发 onChange', () => {
    const onChange = vi.fn();
    render(() => <RangePicker defaultValue={['2026-03-10', '2026-03-20']} onChange={onChange} />);

    fireEvent.input(startInput(), { target: { value: '2026-02-31' } });
    expect(startInput().value).toBe('2026-02-31');
    fireEvent.blur(startInput());

    expect(startInput().value).toBe('2026-03-10');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('手输越界（早于 min）回滚', () => {
    const onChange = vi.fn();
    render(() => (
      <RangePicker
        defaultValue={['2026-03-10', '2026-03-20']}
        min="2026-03-05"
        onChange={onChange}
      />
    ));

    fireEvent.input(startInput(), { target: { value: '2026-03-01' } });
    fireEvent.blur(startInput());

    expect(startInput().value).toBe('2026-03-10');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('手输起点晚于已有终点时回滚（不做静默交换）', () => {
    const onChange = vi.fn();
    render(() => <RangePicker defaultValue={['2026-03-10', '2026-03-20']} onChange={onChange} />);

    fireEvent.input(startInput(), { target: { value: '2026-03-25' } });
    fireEvent.blur(startInput());

    expect(startInput().value).toBe('2026-03-10');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('手输两端：起点先回车只留在控件内，终点回车才发完整区间', () => {
    const onChange = vi.fn();
    render(() => <RangePicker onChange={onChange} />);

    fireEvent.input(startInput(), { target: { value: '2026-05-01' } });
    fireEvent.keyDown(startInput(), { key: 'Enter' });

    expect(onChange).not.toHaveBeenCalled();
    expect(startInput().value).toBe('2026-05-01');

    fireEvent.input(endInput(), { target: { value: '2026-05-06' } });
    fireEvent.keyDown(endInput(), { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(['2026-05-01', '2026-05-06']);
    expect(startInput().value).toBe('2026-05-01');
    expect(endInput().value).toBe('2026-05-06');
  });
});

describe('RangePicker 键盘与焦点管理', () => {
  it('方向键漫游 + Enter 两段落点，完成后焦点交给终点输入框', async () => {
    const onChange = vi.fn();
    render(() => <RangePicker defaultValue={['2026-03-16', '2026-03-17']} onChange={onChange} />);
    openFromStart();

    fireEvent.keyDown(startInput(), { key: 'ArrowRight' });
    await waitFor(() => expect(dayCell('2026-03-17').getAttribute('tabindex')).toBe('0'));

    fireEvent.keyDown(startInput(), { key: 'Enter' });
    expect(root().getAttribute('data-scui-picking')).toBe('end');
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.keyDown(startInput(), { key: 'ArrowRight' });
    fireEvent.keyDown(startInput(), { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(['2026-03-17', '2026-03-18']);
    expect(calendar()).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(endInput()));
  });

  it('弹层内 Tab 把焦点交给同级输入框，且弹层不关闭', async () => {
    render(() => <RangePicker defaultValue={['2026-03-10', '2026-03-20']} />);
    openFromStart();

    fireEvent.keyDown(element('[data-scui-role="range-popup"]'), { key: 'Tab' });

    await waitFor(() => expect(document.activeElement).toBe(endInput()));
    expect(calendar()).not.toBeNull();
    expect(root().hasAttribute('data-scui-open')).toBe(true);
  });

  it('Esc 关闭并把焦点交回起点输入框', async () => {
    render(() => <RangePicker defaultValue={['2026-03-10', '2026-03-20']} />);
    openFromStart();
    expect(calendar()).not.toBeNull();

    fireEvent.keyDown(element('[data-scui-role="range-popup"]'), { key: 'Escape' });

    expect(calendar()).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(startInput()));
  });
});

describe('RangePicker 值桥与清除', () => {
  it('被 <Form.Item> 包裹时以字段值为唯一数据源，两个输入框 id 不重复', () => {
    render(() => (
      <Form initialValues={{ contractRange: ['2026-03-01', '2026-03-10'] }}>
        <Form.Item name="contractRange" label="合同期限">
          <RangePicker />
        </Form.Item>
      </Form>
    ));

    expect(startInput().value).toBe('2026-03-01');
    expect(endInput().value).toBe('2026-03-10');
    expect(startInput().id).not.toBe(endInput().id);
    // 两个输入框共享字段 label 作为名字来源
    expect(startInput().getAttribute('aria-labelledby')).toBeTruthy();
    expect(endInput().getAttribute('aria-labelledby')).toBe(
      startInput().getAttribute('aria-labelledby'),
    );

    openFromStart();
    fireEvent.click(dayCell('2026-03-05'));
    fireEvent.click(dayCell('2026-03-08'));

    expect(startInput().value).toBe('2026-03-05');
    expect(endInput().value).toBe('2026-03-08');

    const ids = [...document.querySelectorAll('[id]')].map((node) => node.id);
    expect(ids).toHaveLength(new Set(ids).size);
  });

  it('allowClear：有值时清除两端并回空串，无值或禁用时不渲染', () => {
    const onChange = vi.fn();
    render(() => (
      <RangePicker defaultValue={['2026-03-10', '2026-03-20']} allowClear onChange={onChange} />
    ));

    fireEvent.click(element('[data-scui-role="range-clear"]'));

    expect(onChange).toHaveBeenCalledWith(['', '']);
    expect(startInput().value).toBe('');
    expect(endInput().value).toBe('');
    expect(document.querySelector('[data-scui-role="range-clear"]')).toBeNull();
  });

  it('无值或禁用时不渲染清除按钮', () => {
    render(() => (
      <>
        <RangePicker allowClear />
        <RangePicker defaultValue={['2026-03-10', '2026-03-20']} allowClear disabled />
      </>
    ));

    expect(document.querySelectorAll('[data-scui-role="range-clear"]')).toHaveLength(0);
  });

  it('format 只改显示不改值', () => {
    const onChange = vi.fn();
    render(() => (
      <RangePicker
        defaultValue={['2026-03-10', '2026-03-20']}
        format="YYYY年M月D日"
        onChange={onChange}
      />
    ));

    expect(startInput().value).toBe('2026年3月10日');
    expect(endInput().value).toBe('2026年3月20日');
    expect(onChange).not.toHaveBeenCalled();
  });
});
