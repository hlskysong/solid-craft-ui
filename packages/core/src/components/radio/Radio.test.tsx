/**
 * `Radio` / `RadioGroup` 客户端实证（T2-05）。
 *
 * 重点验「同组互斥且 name 同源」「独立 radio 自动隔离 name」「字段值 string 收窄」，
 * 以及三件套共用的 label 名称链路；方向键切换是浏览器原生行为，jsdom 不模拟。
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal, type JSX } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FieldProvider } from '../../form';
import { Radio } from './Radio';
import { RadioGroup } from './RadioGroup';

afterEach(cleanup);

const radios = (): HTMLInputElement[] =>
  screen.getAllByRole('radio').map((node) => {
    if (!(node instanceof HTMLInputElement)) throw new Error('radio 不是 HTMLInputElement');
    return node;
  });
const radio = (): HTMLInputElement => {
  const first = radios()[0];
  if (!first) throw new Error('未找到 radio');
  return first;
};
const shell = () => document.querySelector('[data-scui-role="radio"]');
const groupShell = () => document.querySelector('[data-scui-role="radio-group"]');

/** 按下标点击：顺带做存在性检查，避免 `as` / 可选链把结构错误藏起来。 */
function clickRadio(index: number): void {
  const input = radios()[index];
  if (!input) throw new Error(`未找到第 ${index} 个 radio`);
  fireEvent.click(input);
}

/** 字段宿主：字段值是 string，RadioGroup 负责收窄。 */
function GroupFieldHost(props: { initial: unknown }): JSX.Element {
  const [value, setValue] = createSignal<unknown>(props.initial);

  return (
    <>
      <FieldProvider name="plan" value={value} setValue={(next) => setValue(next)}>
        <RadioGroup aria-label="方案">
          <Radio value="a">甲方案</Radio>
          <Radio value="b">乙方案</Radio>
        </RadioGroup>
      </FieldProvider>
      <output data-testid="mirror">{JSON.stringify(value())}</output>
    </>
  );
}

const options = [
  { label: '甲', value: 'a' },
  { label: '乙', value: 'b' },
  { label: '丙', value: 'c', disabled: true },
];

describe('Radio：DOM 与独立使用', () => {
  it('默认输出 role / checked / size / invalid 契约', () => {
    render(() => <Radio aria-label="单独使用" />);

    expect(radio()).toHaveAttribute('type', 'radio');
    expect(radio()).toHaveAttribute('aria-checked', 'false');
    expect(radio()).toHaveAttribute('aria-invalid', 'false');
    expect(shell()).toHaveAttribute('data-scui-role', 'radio');
    expect(shell()).toHaveAttribute('data-scui-checked', 'false');
    expect(shell()).toHaveAttribute('data-scui-size', 'medium');
    expect(shell()).toHaveAttribute('data-scui-invalid', 'false');
  });

  it('文案由 label 包裹，aria-labelledby 指向真实文案节点', () => {
    render(() => <Radio>甲方案</Radio>);

    const input = screen.getByRole('radio', { name: '甲方案' });
    const labelledBy = input.getAttribute('aria-labelledby');
    expect(document.getElementById(labelledBy ?? '')?.textContent).toBe('甲方案');
  });

  it('两个独立 radio 自动生成不同 name，互不排斥', () => {
    render(() => (
      <>
        <Radio defaultChecked>第一组</Radio>
        <Radio>第二组</Radio>
      </>
    ));

    expect(radios()[0]?.name).toMatch(/^scui-radio-/);
    expect(radios()[1]?.name).toMatch(/^scui-radio-/);
    expect(radios()[0]?.name).not.toBe(radios()[1]?.name);

    clickRadio(1);
    expect(radios()[0]?.checked).toBe(true);
    expect(radios()[1]?.checked).toBe(true);
  });

  it('独立受控时外部不回写则保持原值，只上报用户意图', () => {
    const onChange = vi.fn();
    render(() => (
      <Radio checked={false} onChange={onChange}>
        受控
      </Radio>
    ));

    fireEvent.click(radio());
    expect(onChange.mock.calls[0]?.[0]).toBe(true);
    expect(radio().checked).toBe(false);
    expect(shell()).toHaveAttribute('data-scui-checked', 'false');
  });

  it('size / status / disabled 同时落 data 与原生属性', () => {
    render(() => (
      <Radio size="small" status="error" disabled>
        禁用
      </Radio>
    ));

    expect(radio()).toBeDisabled();
    expect(radio()).toHaveAttribute('aria-invalid', 'true');
    expect(shell()).toHaveAttribute('data-scui-size', 'small');
    expect(shell()).toHaveAttribute('data-scui-invalid', 'true');
    expect(shell()).toHaveAttribute('data-scui-disabled');
  });
});

describe('RadioGroup：互斥与字段', () => {
  it('options 写法共享 name，选中互斥并上报 value', () => {
    const onChange = vi.fn();
    render(() => <RadioGroup options={options} onChange={onChange} aria-label="方案" />);

    expect(radios()).toHaveLength(3);
    expect(new Set(radios().map((input) => input.name)).size).toBe(1);
    expect(radios()[2]).toBeDisabled();
    expect(groupShell()?.tagName).toBe('FIELDSET');
    expect(groupShell()).toHaveAttribute('data-scui-orientation', 'horizontal');

    clickRadio(1);
    expect(onChange.mock.calls[0]?.[0]).toBe('b');
    expect(radios()[1]?.checked).toBe(true);

    clickRadio(0);
    expect(onChange.mock.calls[1]?.[0]).toBe('a');
    expect(radios()[0]?.checked).toBe(true);
    expect(radios()[1]?.checked).toBe(false);
  });

  it('defaultValue 与 children 写法生效，尺寸与禁用整组下发', () => {
    render(() => (
      <RadioGroup defaultValue="b" size="large" orientation="vertical" disabled aria-label="方案">
        <Radio value="a">甲</Radio>
        <Radio value="b">乙</Radio>
      </RadioGroup>
    ));

    expect(radios()[1]?.checked).toBe(true);
    expect(groupShell()).toHaveAttribute('data-scui-orientation', 'vertical');
    expect(groupShell()).toHaveAttribute('data-scui-disabled');
    for (const input of radios()) {
      expect(input).toBeDisabled();
      expect(input.closest('label')).toHaveAttribute('data-scui-size', 'large');
    }
  });

  it('受控 Group 未回写时整组 DOM 回弹（原生互斥会改到其他 input）', () => {
    const onChange = vi.fn();
    render(() => (
      <RadioGroup value="a" onChange={onChange} aria-label="方案">
        <Radio value="a">甲</Radio>
        <Radio value="b">乙</Radio>
      </RadioGroup>
    ));

    expect(radios()[0]?.checked).toBe(true);
    clickRadio(1);

    expect(onChange.mock.calls[0]?.[0]).toBe('b');
    // 浏览器点 B 时会把 A 一起取消；只同步被点击的那个会留下「两个都不选」。
    expect(radios()[0]?.checked).toBe(true);
    expect(radios()[1]?.checked).toBe(false);
  });

  it('字段值 string 驱动整组，点击子项回写字段', () => {
    render(() => <GroupFieldHost initial="a" />);

    expect(radios()[0]?.checked).toBe(true);
    expect(radios()[1]?.checked).toBe(false);
    clickRadio(1);

    expect(screen.getByTestId('mirror').textContent).toBe('"b"');
  });

  it('字段值不是字符串时按「都未选」处理', () => {
    render(() => <GroupFieldHost initial={42} />);

    expect(radios().every((input) => !input.checked)).toBe(true);
  });

  it('aria-checked 与 data-scui-checked 恒同步为两态', () => {
    render(() => <RadioGroup options={options} defaultValue="a" aria-label="方案" />);

    for (const input of radios()) {
      const expected = input.checked ? 'true' : 'false';
      expect(input).toHaveAttribute('aria-checked', expected);
      expect(input.closest('label')).toHaveAttribute('data-scui-checked', expected);
    }
  });
});
