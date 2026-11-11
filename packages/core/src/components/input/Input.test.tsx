/**
 * `Input` / `Textarea` 客户端实证（T2-03）。
 *
 * 验的是控件自己负责的部分：`data-scui-*` 契约、受控 / 非受控值流转、
 * 子能力（清除 / 密码显隐 / 回车搜索 / 自动高度 / 字数统计）与字段上下文接入。
 * 样式与视觉基线归 `pnpm verify` 的截图阶段，这里不测颜色与尺寸像素。
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal, type JSX } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FieldProvider } from '../../form';
import { toFieldText } from '../../form/field-value';
import { Input } from './Input';
import { Textarea } from './Textarea';

afterEach(cleanup);

/** 取壳 / 控件；取不到直接失败，避免用 `as` 掩盖结构错误。 */
function query<T extends Element>(selector: string, ctor: new () => T): T {
  const node = document.querySelector(selector);
  if (!(node instanceof ctor)) throw new Error(`未找到元素 ${selector}`);
  return node;
}

const shell = () => query('[data-scui-role="input"]', HTMLElement);
const control = () => query<HTMLInputElement>('[data-scui-role="input"] input', HTMLInputElement);

/** 取 Textarea 控件与字数统计；同理不用 `as`，结构错了立刻失败。 */
const area = () =>
  query<HTMLTextAreaElement>('[data-scui-role="textarea"] textarea', HTMLTextAreaElement);
const countText = () => query('[data-scui-role="textarea-count"]', HTMLElement).textContent;

/** 字段上下文宿主：值住在 `FieldProvider` 外，验证控件不持有重复状态。 */
function FieldHost(props: { message?: string }): JSX.Element {
  const [value, setValue] = createSignal('张三');

  return (
    <>
      <FieldProvider
        name="name"
        value={value}
        setValue={(next) => setValue(toFieldText(next))}
        message={() => props.message}
      >
        <Input />
      </FieldProvider>
      <span data-testid="field-mirror">{value()}</span>
    </>
  );
}

/** 受控宿主：值住在组件外，验证「控件不持有重复状态」。 */
function ControlledInput(props: {
  initial: string;
  onValue?: (value: string) => void;
}): JSX.Element {
  const [value, setValue] = createSignal(props.initial);

  return (
    <>
      <Input
        value={value()}
        onChange={(next) => {
          setValue(next);
          props.onValue?.(next);
        }}
      />
      <span data-testid="mirror">{value()}</span>
    </>
  );
}

describe('Input：基础契约', () => {
  it('默认渲染 textbox，输出 role / size / invalid 三件套', () => {
    render(() => <Input placeholder="请输入" />);

    expect(control()).toHaveAttribute('type', 'text');
    expect(control()).toHaveAttribute('placeholder', '请输入');
    expect(control()).toHaveAttribute('aria-invalid', 'false');
    expect(shell()).toHaveAttribute('data-scui-role', 'input');
    expect(shell()).toHaveAttribute('data-scui-size', 'medium');
    expect(shell()).toHaveAttribute('data-scui-invalid', 'false');
    expect(shell()).not.toHaveAttribute('data-scui-disabled');
  });

  it('size 与 status 落到 data 属性，且 invalid 恒输出两态字符串', () => {
    render(() => <Input size="large" status="error" />);

    expect(shell()).toHaveAttribute('data-scui-size', 'large');
    expect(shell()).toHaveAttribute('data-scui-invalid', 'true');
    expect(control()).toHaveAttribute('aria-invalid', 'true');
  });

  it('disabled 同时落原生属性与 data 标记，并屏蔽清除按钮', () => {
    render(() => <Input disabled defaultValue="有值" allowClear />);

    expect(control()).toBeDisabled();
    expect(shell()).toHaveAttribute('data-scui-disabled');
    expect(screen.queryByRole('button', { name: '清除' })).toBeNull();
  });

  it('prefix / suffix 渲染在控件两侧', () => {
    render(() => <Input prefix={<span data-testid="pre">@</span>} suffix="元" />);

    expect(screen.getByTestId('pre')).toBeInTheDocument();
    expect(shell().textContent).toContain('元');
  });
});

describe('Input：值流转', () => {
  it('非受控时输入即更新视图并带出字符串值', () => {
    const onChange = vi.fn();
    render(() => <Input defaultValue="a" onChange={onChange} />);

    expect(control().value).toBe('a');
    fireEvent.input(control(), { target: { value: 'abc' } });

    expect(control().value).toBe('abc');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0]).toBe('abc');
  });

  it('受控时视图由外部值驱动，输入只上报不回写', () => {
    const onValue = vi.fn();
    render(() => <ControlledInput initial="外部值" onValue={onValue} />);

    expect(control().value).toBe('外部值');
    fireEvent.input(control(), { target: { value: '临时输入' } });

    expect(onValue).toHaveBeenCalledWith('临时输入');
    expect(screen.getByTestId('mirror').textContent).toBe('临时输入');
    expect(control().value).toBe('临时输入');
  });

  it('allowClear 只在有值时出现，点击后清空并回调 onClear', () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    render(() => <Input defaultValue="待清空" allowClear onChange={onChange} onClear={onClear} />);

    const clearButton = screen.getByRole('button', { name: '清除' });
    fireEvent.click(clearButton);

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('', undefined);
    expect(control().value).toBe('');
    expect(screen.queryByRole('button', { name: '清除' })).toBeNull();
  });
});

describe('Input：密码与搜索', () => {
  it('密码切换按钮改变 type 与 aria-pressed，但值不变', () => {
    render(() => <Input type="password" defaultValue="s3cret" />);

    const toggle = screen.getByRole('button', { name: '显示密码' });
    expect(control()).toHaveAttribute('type', 'password');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(toggle);

    expect(control()).toHaveAttribute('type', 'text');
    expect(control().value).toBe('s3cret');
    expect(screen.getByRole('button', { name: '隐藏密码' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('visibilityToggle=false 时不渲染切换按钮', () => {
    render(() => <Input type="password" visibilityToggle={false} />);

    expect(screen.queryByRole('button', { name: '显示密码' })).toBeNull();
  });

  it('type=search 时回车触发 onSearch，输入法组合态下的回车不触发', () => {
    const onSearch = vi.fn();
    render(() => <Input type="search" defaultValue="关键字" onSearch={onSearch} />);

    fireEvent.keyDown(control(), { key: 'Enter', isComposing: true });
    expect(onSearch).not.toHaveBeenCalled();

    fireEvent.keyDown(control(), { key: 'Enter' });
    expect(onSearch).toHaveBeenCalledWith('关键字');
  });

  it('search 但没传 onSearch 时不报错，也不渲染搜索按钮', () => {
    render(() => <Input type="search" />);

    expect(() => fireEvent.keyDown(control(), { key: 'Enter' })).not.toThrow();
    expect(screen.queryByRole('button', { name: '搜索' })).toBeNull();
  });

  it('enterButton 渲染搜索按钮，点击等于提交当前值', () => {
    const onSearch = vi.fn();
    render(() => <Input type="search" defaultValue="邯郸" onSearch={onSearch} enterButton />);

    fireEvent.click(screen.getByRole('button', { name: '搜索' }));

    expect(onSearch).toHaveBeenCalledWith('邯郸');
  });
});

describe('Input：字段上下文接入', () => {
  it('值从字段来、写回字段，id 与 aria 由上下文注入', () => {
    render(() => <FieldHost message="姓名不能为空" />);

    expect(control().value).toBe('张三');
    expect(control().value).not.toBe('');
    expect(control()).toHaveAttribute('aria-invalid', 'true');
    expect(control().getAttribute('aria-describedby')).toBeTruthy();
    expect(control().getAttribute('aria-labelledby')).toBeTruthy();

    fireEvent.input(control(), { target: { value: '李四' } });

    expect(screen.getByTestId('field-mirror').textContent).toBe('李四');
    expect(control().value).toBe('李四');
  });

  it('无错误文案时 aria-describedby 不输出，aria-invalid 为 false', () => {
    render(() => <FieldHost />);

    expect(control()).toHaveAttribute('aria-invalid', 'false');
    expect(control()).not.toHaveAttribute('aria-describedby');
  });
});

describe('Textarea', () => {
  it('默认渲染 textarea，输出 role / size / invalid', () => {
    render(() => <Textarea placeholder="请输入说明" />);

    expect(area().tagName).toBe('TEXTAREA');
    expect(query('[data-scui-role="textarea"]', HTMLElement)).toHaveAttribute(
      'data-scui-size',
      'medium',
    );
    expect(area()).toHaveAttribute('aria-invalid', 'false');
  });

  it('非受控输入更新值', () => {
    const onChange = vi.fn();
    render(() => <Textarea onChange={onChange} />);

    fireEvent.input(area(), { target: { value: '第一行\n第二行' } });

    expect(area().value).toBe('第一行\n第二行');
    expect(onChange).toHaveBeenCalledWith('第一行\n第二行', expect.anything());
  });

  it('autoSize 用 minRows 决定初始行数并打上标记', () => {
    render(() => <Textarea autoSize={{ minRows: 4, maxRows: 8 }} />);

    expect(area()).toHaveAttribute('rows', '4');
    expect(query('[data-scui-role="textarea"]', HTMLElement)).toHaveAttribute(
      'data-scui-auto-size',
    );
  });

  it('autoSize=true 时按默认两行起步', () => {
    render(() => <Textarea autoSize />);

    expect(area()).toHaveAttribute('rows', '2');
  });

  it('showCount 显示「已输入 / 上限」，并随输入变化', () => {
    render(() => <Textarea showCount maxLength={10} defaultValue="abc" />);

    expect(countText()).toContain('3');
    expect(countText()).toContain('10');

    fireEvent.input(area(), { target: { value: 'abcdef' } });
    expect(countText()).toContain('6');
  });

  it('allowClear 清空内容并回焦', () => {
    const onChange = vi.fn();
    render(() => <Textarea allowClear defaultValue="待清空" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: '清除' }));

    expect(onChange).toHaveBeenCalledWith('', undefined);
    expect(area().value).toBe('');
    expect(document.activeElement).toBe(area());
  });

  it('disabled 时控件与壳同时标记', () => {
    render(() => <Textarea disabled />);

    expect(area()).toBeDisabled();
    expect(query('[data-scui-role="textarea"]', HTMLElement)).toHaveAttribute('data-scui-disabled');
  });
});
