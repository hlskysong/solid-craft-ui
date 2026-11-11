/**
 * `InputNumber` 客户端实证（T2-04）。
 *
 * 重点验三件在文本控件里不存在的事：
 *  1. **精度**：步进与输入都不产生浮点尾数（`0.1 × 3` 必须是 `0.3`，不是 `0.30000000000000004`）；
 *  2. **中间态**：`'-'` / `'1.'` / `'abc'` 不提交、也不清空，`''` 才提交 `null`；
 *  3. **范围时机**：输入中不夹取，失焦 / 步进才夹取。
 *
 * 样式与像素由视觉基线负责，这里不测颜色与尺寸。
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal, type JSX } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FieldProvider } from '../../form';
import { InputNumber } from './InputNumber';
import { decimalsOf, resolvePrecision, roundTo, stepValue } from './number-math';

afterEach(cleanup);

/** 取壳 / 控件 / 按钮；取不到直接失败，避免用 `as` 掩盖结构错误。 */
function query<T extends Element>(selector: string, ctor: new () => T): T {
  const node = document.querySelector(selector);
  if (!(node instanceof ctor)) throw new Error(`未找到元素 ${selector}`);
  return node;
}

const shell = () => query('[data-scui-role="input-number"]', HTMLElement);
const control = () =>
  query<HTMLInputElement>('[data-scui-role="input-number"] input', HTMLInputElement);
const upButton = () =>
  query<HTMLButtonElement>('[data-scui-role="input-number-up"]', HTMLButtonElement);
const downButton = () =>
  query<HTMLButtonElement>('[data-scui-role="input-number-down"]', HTMLButtonElement);

/** 输入原文并失焦，模拟一次完整的用户编辑。 */
function type(raw: string): void {
  fireEvent.input(control(), { target: { value: raw } });
}

function commit(raw: string): void {
  type(raw);
  fireEvent.blur(control());
}

describe('number-math：整数刻度运算', () => {
  it('小数位数能识别普通写法与科学计数法', () => {
    expect(decimalsOf(1)).toBe(0);
    expect(decimalsOf(0.1)).toBe(1);
    expect(decimalsOf(0.001)).toBe(3);
    expect(decimalsOf(1e-7)).toBe(7);
    expect(decimalsOf(1.5e-7)).toBe(8);
  });

  it('精度优先显式值，否则由 step 推导', () => {
    expect(resolvePrecision(undefined, 1)).toBe(0);
    expect(resolvePrecision(undefined, 0.1)).toBe(1);
    expect(resolvePrecision(undefined, 0.01)).toBe(2);
    expect(resolvePrecision(3, 0.1)).toBe(3);
  });

  it('roundTo 收掉乘法尾数，并对负数远离零舍入', () => {
    // 朴素写法 `Math.round(1.005 * 100) / 100` 会得到 1（100.49999999999999 被舍掉）。
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(-1.005, 2)).toBe(-1.01);
    expect(roundTo(0.145, 2)).toBe(0.15);
    expect(roundTo(2.5, 0)).toBe(3);
  });

  it('stepValue 只在整数刻度上加减，不产生浮点尾数', () => {
    expect(stepValue(0.1, 0.1, 1, 1)).toBe(0.2);
    expect(stepValue(0.2, 0.1, 1, 1)).toBe(0.3);
    expect(stepValue(0.3, 0.1, 1, -1)).toBe(0.2);
    // 21 次 0.1 累加：浮点会漂到 2.1000000000000005，刻度加法停在 2.1。
    let value = 0;
    for (let index = 0; index < 21; index += 1) value = stepValue(value, 0.1, 1, 1);
    expect(value).toBe(2.1);
  });

  it('step 比精度还细时至少走一个刻度', () => {
    expect(stepValue(0, 0.001, 1, 1)).toBe(0.1);
  });
});

describe('InputNumber：DOM 契约', () => {
  it('壳 / 控件 / 步进按钮的属性齐全', () => {
    render(() => <InputNumber aria-label="数量" defaultValue={3} />);

    expect(shell()).toHaveAttribute('data-scui-role', 'input-number');
    expect(shell()).toHaveAttribute('data-scui-size', 'medium');
    expect(shell()).toHaveAttribute('data-scui-invalid', 'false');
    expect(shell()).not.toHaveAttribute('data-scui-disabled');

    // 刻意不是 type="number"：原生数字框会吞中间态、无法展示千分位。
    expect(control()).toHaveAttribute('type', 'text');
    expect(control()).toHaveAttribute('inputmode', 'decimal');
    expect(control()).toHaveAttribute('aria-label', '数量');
    expect(control()).toHaveValue('3');

    expect(upButton()).toHaveAttribute('aria-label', '增加');
    expect(downButton()).toHaveAttribute('aria-label', '减少');
  });

  it('size / status / disabled 透传', () => {
    render(() => <InputNumber size="large" status="error" disabled defaultValue={1} />);

    expect(shell()).toHaveAttribute('data-scui-size', 'large');
    expect(shell()).toHaveAttribute('data-scui-invalid', 'true');
    expect(shell()).toHaveAttribute('data-scui-disabled', '');
    expect(control()).toBeDisabled();
    expect(control()).toHaveAttribute('aria-invalid', 'true');
    // 禁用时不渲染步进按钮：此时它们只会是「看得见点不动」的噪音。
    expect(document.querySelector('[data-scui-role="input-number-up"]')).toBeNull();
  });

  it('controls={false} 时不渲染按钮，但键盘仍可步进', () => {
    const onChange = vi.fn();
    render(() => <InputNumber controls={false} defaultValue={1} onChange={onChange} />);

    expect(document.querySelector('[data-scui-role="input-number-up"]')).toBeNull();

    fireEvent.keyDown(control(), { key: 'ArrowUp' });
    expect(onChange).toHaveBeenLastCalledWith(2, undefined);
  });
});

describe('InputNumber：输入与中间态', () => {
  it('输入合法数字即提交数值（不是字符串）', () => {
    const onChange = vi.fn();
    render(() => <InputNumber onChange={onChange} />);

    type('12');
    expect(onChange).toHaveBeenLastCalledWith(12, expect.anything());
    expect(control()).toHaveValue('12');
  });

  it('只打负号不提交，显示保留用户原文', () => {
    const onChange = vi.fn();
    render(() => <InputNumber onChange={onChange} />);

    type('-');
    // '-' 没有数值对应物：留在草稿里等下一个字符，绝不提交。
    expect(onChange).not.toHaveBeenCalled();
    expect(control()).toHaveValue('-');
  });

  it('半成品带得动：`1.` 提交 1 但显示保留原文，失焦才格式化', () => {
    const onChange = vi.fn();
    render(() => <InputNumber onChange={onChange} />);

    type('1.');
    // 数值已经是 1（可以提交），但显示不回写成 `1` —— 否则用户永远打不出小数。
    expect(onChange).toHaveBeenLastCalledWith(1, expect.anything());
    expect(control()).toHaveValue('1.');

    fireEvent.blur(control());
    expect(control()).toHaveValue('1');
  });

  it('非法输入不提交，失焦回退到上一个合法值', () => {
    const onChange = vi.fn();
    render(() => <InputNumber defaultValue={5} onChange={onChange} />);

    onChange.mockClear();
    commit('abc');

    expect(onChange).not.toHaveBeenCalled();
    expect(control()).toHaveValue('5');
  });

  it('清空提交 null，且不把空值当成 0', () => {
    const onChange = vi.fn();
    render(() => <InputNumber defaultValue={7} onChange={onChange} />);

    commit('');
    // 输入阶段就已提交（值从 7 变成 null），失焦时值未变，按不变式 3 不再回调 ——
    // 所以最后一次调用带的是输入事件，不是 undefined。
    expect(onChange).toHaveBeenLastCalledWith(null, expect.anything());
    expect(control()).toHaveValue('');
  });

  it('值未变化时失焦不再触发 onChange（避免重复提交）', () => {
    const onChange = vi.fn();
    render(() => <InputNumber defaultValue={7} onChange={onChange} />);

    onChange.mockClear();
    // '007' 归一化后仍是 7，数值没变就不该惊动业务侧。
    commit('007');

    expect(onChange).not.toHaveBeenCalled();
    expect(control()).toHaveValue('7');
  });

  it('十六进制与非十进制写法被拒绝，不静默变成别的数', () => {
    const onChange = vi.fn();
    render(() => <InputNumber defaultValue={2} onChange={onChange} />);

    onChange.mockClear();
    commit('0x10');

    expect(onChange).not.toHaveBeenCalled();
    expect(control()).toHaveValue('2');
  });
});

describe('InputNumber：精度', () => {
  it('step=0.1 连点三次得到 0.3（无浮点尾数）', () => {
    const onChange = vi.fn();
    render(() => <InputNumber step={0.1} defaultValue={0} onChange={onChange} />);

    fireEvent.click(upButton());
    fireEvent.click(upButton());
    fireEvent.click(upButton());

    expect(onChange).toHaveBeenLastCalledWith(0.3, undefined);
    expect(control()).toHaveValue('0.3');
  });

  it('precision 裁剪输入与显示的小数位', () => {
    const onChange = vi.fn();
    render(() => <InputNumber precision={2} defaultValue={1.239} onChange={onChange} />);

    expect(control()).toHaveValue('1.24');

    commit('2.345');
    expect(onChange).toHaveBeenLastCalledWith(2.35, expect.anything());
    expect(control()).toHaveValue('2.35');
  });

  it('precision={0} 时只保留整数', () => {
    render(() => <InputNumber precision={0} defaultValue={2.6} />);
    expect(control()).toHaveValue('3');
  });
});

describe('InputNumber：范围与步进', () => {
  it('输入中不夹取，失焦才夹到上界', () => {
    const onChange = vi.fn();
    render(() => <InputNumber min={0} max={10} onChange={onChange} />);

    type('100');
    // 输入过程里不打断用户：先把 100 原样交出去。
    expect(onChange).toHaveBeenLastCalledWith(100, expect.anything());

    fireEvent.blur(control());
    expect(onChange).toHaveBeenLastCalledWith(10, undefined);
    expect(control()).toHaveValue('10');
  });

  it('步进结果被夹在范围内，到界后按钮禁用', () => {
    const onChange = vi.fn();
    render(() => <InputNumber min={0} max={2} defaultValue={1} onChange={onChange} />);

    fireEvent.click(upButton());
    expect(onChange).toHaveBeenLastCalledWith(2, undefined);
    expect(upButton()).toBeDisabled();
    expect(upButton()).toHaveAttribute('data-scui-disabled', '');

    // 到界后再点：值不变、也不再发回调。
    onChange.mockClear();
    fireEvent.click(upButton());
    expect(onChange).not.toHaveBeenCalled();
  });

  it('down 到界同理', () => {
    render(() => <InputNumber min={0} max={2} defaultValue={0} />);
    expect(downButton()).toBeDisabled();
  });

  it('空值点增加从 0 起算，并受 min 约束', () => {
    const onChange = vi.fn();
    render(() => <InputNumber step={5} min={3} onChange={onChange} />);

    fireEvent.click(upButton());
    // 0 + 5 = 5，夹进 [3, ∞) 仍是 5。
    expect(onChange).toHaveBeenLastCalledWith(5, undefined);
  });
});

describe('InputNumber：键盘', () => {
  it('↑/↓ 步进并阻止光标移动的默认行为', () => {
    const onChange = vi.fn();
    render(() => <InputNumber step={2} defaultValue={4} onChange={onChange} />);

    const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true });
    control().dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith(6, undefined);

    fireEvent.keyDown(control(), { key: 'ArrowDown' });
    expect(onChange).toHaveBeenLastCalledWith(4, undefined);
  });

  it('回车等价失焦：提交并归一化', () => {
    const onChange = vi.fn();
    render(() => <InputNumber max={10} onChange={onChange} />);

    type('99');
    fireEvent.keyDown(control(), { key: 'Enter' });

    expect(onChange).toHaveBeenLastCalledWith(10, undefined);
    expect(control()).toHaveValue('10');
  });

  it('输入法组合态下的按键不步进', () => {
    const onChange = vi.fn();
    render(() => <InputNumber defaultValue={1} onChange={onChange} />);

    onChange.mockClear();
    fireEvent.keyDown(control(), { key: 'ArrowUp', isComposing: true });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('InputNumber：千分位与前后缀', () => {
  it('thousands 只影响展示，输入时带逗号也能解析', () => {
    const onChange = vi.fn();
    render(() => <InputNumber thousands defaultValue={1234567} onChange={onChange} />);

    expect(control()).toHaveValue('1,234,567');

    commit('2,345');
    expect(onChange).toHaveBeenLastCalledWith(2345, expect.anything());
    expect(control()).toHaveValue('2,345');
  });

  it('前缀与后缀渲染在壳内、不参与取值', () => {
    render(() => <InputNumber prefix="¥" suffix="元" defaultValue={9} />);

    expect(shell().textContent).toContain('¥');
    expect(shell().textContent).toContain('元');
    expect(control()).toHaveValue('9');
    // 控件本身的 value 不含前后缀。
    commit('11');
    expect(control()).toHaveValue('11');
  });
});

describe('InputNumber：受控与字段上下文', () => {
  it('受控：外部回写驱动显示', () => {
    function Host(): JSX.Element {
      const [value, setValue] = createSignal<number | null>(1);
      return (
        <>
          <InputNumber value={value} onChange={(next) => setValue(next)} />
          <button type="button" onClick={() => setValue(42)}>
            外部置值
          </button>
        </>
      );
    }

    render(() => <Host />);
    expect(control()).toHaveValue('1');

    fireEvent.click(screen.getByRole('button', { name: '外部置值' }));
    expect(control()).toHaveValue('42');
  });

  it('受控但不回写：编辑中是用户原文，失焦回弹到外部值', () => {
    const onChange = vi.fn();
    render(() => <InputNumber value={3} onChange={onChange} />);

    type('9');
    expect(onChange).toHaveBeenLastCalledWith(9, expect.anything());
    // 编辑中必须显示用户打的字，否则 `1.` 这种中间态无法输入。
    expect(control()).toHaveValue('9');

    fireEvent.blur(control());
    // 外部没有回写 ⇒ 失焦后回弹到外部值；控件不偷偷接管状态。
    expect(control()).toHaveValue('3');
  });

  it('字段上下文：值写进字段而不是控件内部', () => {
    function Host(): JSX.Element {
      const [value, setValue] = createSignal<unknown>(null);
      return (
        <>
          <FieldProvider name="count" value={value} setValue={setValue}>
            <InputNumber step={1} />
          </FieldProvider>
          <span data-testid="mirror">{String(value())}</span>
        </>
      );
    }

    render(() => <Host />);
    fireEvent.click(upButton());

    expect(screen.getByTestId('mirror')).toHaveTextContent('1');
    expect(control()).toHaveValue('1');
  });

  it('字段值是字符串时也能接（后端回填常见）', () => {
    function Host(): JSX.Element {
      return (
        <FieldProvider name="count" value={() => '12.5'} setValue={() => undefined}>
          <InputNumber precision={1} />
        </FieldProvider>
      );
    }

    render(() => <Host />);
    expect(control()).toHaveValue('12.5');
  });
});
