/**
 * `Checkbox` / `CheckboxGroup` 客户端实证（T2-05）。
 *
 * 验的是控件自己负责的部分：`data-scui-*` 契约、三态（含 mixed）、
 * 受控 / 非受控 / 字段上下文三条值链路、Group 的整组值语义与 label 名称链路。
 * 像素与颜色归视觉基线，这里不测。
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal, type JSX } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FieldProvider } from '../../form';
import { Checkbox } from './Checkbox';
import { CheckboxGroup } from './CheckboxGroup';

afterEach(cleanup);

/** 取全部控件并收窄成 `HTMLInputElement`（不用 `as`，结构错了立刻失败）。 */
const boxes = (): HTMLInputElement[] =>
  screen.getAllByRole('checkbox').map((node) => {
    if (!(node instanceof HTMLInputElement)) throw new Error('checkbox 不是 HTMLInputElement');
    return node;
  });
const box = (): HTMLInputElement => {
  const first = boxes()[0];
  if (!first) throw new Error('未找到 checkbox');
  return first;
};
const shell = () => document.querySelector('[data-scui-role="checkbox"]');
const groupShell = () => document.querySelector('[data-scui-role="checkbox-group"]');

/** 按下标点击：顺带做存在性检查，避免可选链把结构错误藏起来。 */
function clickBox(index: number): void {
  const input = boxes()[index];
  if (!input) throw new Error(`未找到第 ${index} 个 checkbox`);
  fireEvent.click(input);
}

/** 字段宿主：值住在 `FieldProvider` 外，验证控件不持有重复状态。 */
function FieldHost(props: { initial: unknown; onValue?: (value: unknown) => void }): JSX.Element {
  const [value, setValue] = createSignal<unknown>(props.initial);

  return (
    <>
      <FieldProvider
        name="agree"
        value={value}
        setValue={(next) => {
          setValue(next);
          props.onValue?.(next);
        }}
      >
        <Checkbox>同意</Checkbox>
      </FieldProvider>
      <output data-testid="mirror">{JSON.stringify(value())}</output>
    </>
  );
}

/** 整组字段宿主：字段值是 `unknown`，由 Group 收窄成 string[]。 */
function GroupFieldHost(props: { initial: unknown }): JSX.Element {
  const [value, setValue] = createSignal<unknown>(props.initial);

  return (
    <>
      <FieldProvider name="cities" value={value} setValue={(next) => setValue(next)}>
        <CheckboxGroup>
          <Checkbox value="a">甲</Checkbox>
          <Checkbox value="b">乙</Checkbox>
        </CheckboxGroup>
      </FieldProvider>
      <output data-testid="mirror">{JSON.stringify(value())}</output>
    </>
  );
}

describe('Checkbox：DOM 与状态契约', () => {
  it('默认输出 role / checked / size / invalid 三件套，checked 恒为字符串两态', () => {
    render(() => <Checkbox aria-label="单独使用" />);

    expect(box()).toHaveAttribute('type', 'checkbox');
    expect(box()).toHaveAttribute('aria-checked', 'false');
    expect(box()).toHaveAttribute('aria-invalid', 'false');
    expect(shell()).toHaveAttribute('data-scui-role', 'checkbox');
    expect(shell()).toHaveAttribute('data-scui-checked', 'false');
    expect(shell()).toHaveAttribute('data-scui-size', 'medium');
    expect(shell()).toHaveAttribute('data-scui-invalid', 'false');
    expect(shell()).not.toHaveAttribute('data-scui-disabled');
  });

  it('文案由 label 包裹，可访问名称指向真实存在的文案节点', () => {
    render(() => <Checkbox>同意协议</Checkbox>);

    const input = screen.getByRole('checkbox', { name: '同意协议' });
    const labelledBy = input.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy ?? '')?.textContent).toBe('同意协议');
    expect(input.closest('label')).toHaveAttribute('for', input.id);
  });

  it('size / status / disabled 同时落 data 与原生属性', () => {
    render(() => (
      <Checkbox size="large" status="error" disabled>
        禁用项
      </Checkbox>
    ));

    expect(box()).toBeDisabled();
    expect(box()).toHaveAttribute('aria-invalid', 'true');
    expect(shell()).toHaveAttribute('data-scui-size', 'large');
    expect(shell()).toHaveAttribute('data-scui-invalid', 'true');
    expect(shell()).toHaveAttribute('data-scui-disabled');
  });

  it('indeterminate 输出 mixed 两处标记，并写入原生 DOM property', () => {
    render(() => (
      <Checkbox indeterminate checked>
        半选
      </Checkbox>
    ));

    expect(box()).toHaveAttribute('aria-checked', 'mixed');
    expect(shell()).toHaveAttribute('data-scui-checked', 'mixed');
    expect(box().indeterminate).toBe(true);
    // mixed 不改 checked 的值本身：读屏读混合态，业务侧仍按原值处理。
    expect(box().checked).toBe(true);
  });

  it('indeterminate 随 getter 变化同步到 DOM property', () => {
    const [mixed, setMixed] = createSignal(false);
    render(() => <Checkbox indeterminate={mixed}>动态半选</Checkbox>);

    expect(box().indeterminate).toBe(false);
    expect(box()).toHaveAttribute('aria-checked', 'false');
    setMixed(true);
    expect(box().indeterminate).toBe(true);
    expect(box()).toHaveAttribute('aria-checked', 'mixed');
  });
});

describe('Checkbox：值流转', () => {
  it('非受控时点击切换并上报布尔值', () => {
    const onChange = vi.fn();
    render(() => (
      <Checkbox defaultChecked onChange={onChange}>
        订阅
      </Checkbox>
    ));

    expect(box().checked).toBe(true);
    fireEvent.click(box());

    expect(box().checked).toBe(false);
    expect(shell()).toHaveAttribute('data-scui-checked', 'false');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0]).toBe(false);
  });

  it('受控时外部不回写则保持原值（标准回弹），只上报用户意图', () => {
    const onChange = vi.fn();
    render(() => (
      <Checkbox checked onChange={onChange}>
        受控
      </Checkbox>
    ));

    fireEvent.click(box());

    expect(onChange.mock.calls[0]?.[0]).toBe(false);
    expect(box().checked).toBe(true);
    expect(shell()).toHaveAttribute('data-scui-checked', 'true');
  });

  it('字段上下文是唯一数据源，写值直接回写字段并注入 aria', () => {
    const onValue = vi.fn();
    render(() => <FieldHost initial={true} onValue={onValue} />);

    expect(box().checked).toBe(true);
    expect(box()).toHaveAttribute('aria-invalid', 'false');
    fireEvent.click(box());

    expect(onValue).toHaveBeenCalledWith(false);
    expect(screen.getByTestId('mirror').textContent).toBe('false');
  });

  it('字段值是非法类型时按未选中处理，不把对象渲染成文本', () => {
    render(() => <FieldHost initial={{ unexpected: true }} />);

    expect(box().checked).toBe(false);
    expect(shell()).toHaveAttribute('data-scui-checked', 'false');
  });
});

describe('CheckboxGroup：整组值语义', () => {
  const options = [
    { label: '甲', value: 'a' },
    { label: '乙', value: 'b' },
    { label: '丙', value: 'c', disabled: true },
  ];

  it('options 写法按 value 累加 / 移除，重复点击不产生重复项', () => {
    const onChange = vi.fn();
    render(() => <CheckboxGroup options={options} onChange={onChange} aria-label="城市" />);

    expect(boxes()).toHaveLength(3);
    expect(boxes()[2]).toBeDisabled();
    expect(groupShell()).toHaveAttribute('data-scui-orientation', 'horizontal');

    clickBox(1);
    expect(onChange.mock.calls[0]?.[0]).toEqual(['b']);
    clickBox(0);
    expect(onChange.mock.calls[1]?.[0]).toEqual(['b', 'a']);
    clickBox(1);
    expect(onChange.mock.calls[2]?.[0]).toEqual(['a']);
  });

  it('子项尺寸继承 Group，整组禁用落到每个 input', () => {
    render(() => (
      <CheckboxGroup
        size="large"
        orientation="vertical"
        disabled
        options={options}
        aria-label="城市"
      />
    ));

    expect(groupShell()).toHaveAttribute('data-scui-orientation', 'vertical');
    expect(groupShell()).toHaveAttribute('data-scui-size', 'large');
    expect(groupShell()).toHaveAttribute('data-scui-disabled');
    for (const input of boxes()) {
      expect(input).toBeDisabled();
      expect(input.closest('label')).toHaveAttribute('data-scui-size', 'large');
      expect(input.closest('label')).toHaveAttribute('data-scui-disabled');
    }
  });

  it('手写 children 的全选场景：半选 → 全选 → 全不选', () => {
    const all = ['a', 'b', 'c'];
    // 信号与 effect 都建在 render 的 root 内，避免 jsdom 里出现
    // 「computations created outside a createRoot」的 owner 警告。
    function AllCheckDemo(): JSX.Element {
      const [selected, setSelected] = createSignal<string[]>(['a']);

      return (
        <>
          <Checkbox
            checked={selected().length === all.length}
            indeterminate={selected().length > 0 && selected().length < all.length}
            onChange={(next) => setSelected(next ? [...all] : [])}
          >
            全选
          </Checkbox>
          <CheckboxGroup value={selected()} onChange={setSelected} aria-label="全部">
            <Checkbox value="a">甲</Checkbox>
            <Checkbox value="b">乙</Checkbox>
            <Checkbox value="c">丙</Checkbox>
          </CheckboxGroup>
        </>
      );
    }

    render(() => <AllCheckDemo />);

    expect(boxes()[0]).toHaveAttribute('aria-checked', 'mixed');
    expect(boxes()[1]).toBeChecked();
    expect(boxes()[2]).not.toBeChecked();

    // 全选控件（index 0）点击后整组选中
    clickBox(0);
    expect(
      boxes()
        .slice(1)
        .every((input) => input.checked),
    ).toBe(true);
    expect(boxes()[0]).toHaveAttribute('aria-checked', 'true');

    clickBox(0);
    expect(
      boxes()
        .slice(1)
        .every((input) => !input.checked),
    ).toBe(true);
  });

  it('字段值是字符串数组时驱动整组，点击子项回写整组值', () => {
    render(() => <GroupFieldHost initial={['a']} />);

    expect(boxes()[0]).toBeChecked();
    expect(boxes()[1]).not.toBeChecked();
    clickBox(1);

    expect(screen.getByTestId('mirror').textContent).toBe('["a","b"]');
  });

  it('字段值不是数组时按空组处理', () => {
    render(() => <GroupFieldHost initial="a" />);

    expect(boxes().every((input) => !input.checked)).toBe(true);
  });
});
