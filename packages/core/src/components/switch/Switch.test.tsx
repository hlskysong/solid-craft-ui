/**
 * `Switch` 客户端实证（T2-05）。
 *
 * 与 Checkbox 共用值桥和 label 壳，因此这里只验 Switch 独有的部分：
 * `role="switch"` + 恒输出的 `aria-checked`、无文案时靠 `aria-label` 命名，
 * 以及三档尺寸 / 校验 / 禁用契约。
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal, type JSX } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FieldProvider } from '../../form';
import { Switch } from './Switch';

afterEach(cleanup);

const control = (): HTMLInputElement => {
  const node = screen.getByRole('switch');
  if (!(node instanceof HTMLInputElement)) throw new Error('switch 不是 HTMLInputElement');
  return node;
};
const shell = () => document.querySelector('[data-scui-role="switch"]');

/** 字段宿主：字段值是 boolean，控件用 `=== true` 收窄。 */
function FieldHost(props: { initial: unknown }): JSX.Element {
  const [value, setValue] = createSignal<unknown>(props.initial);

  return (
    <>
      <FieldProvider name="enabled" value={value} setValue={(next) => setValue(next)}>
        <Switch>启用通知</Switch>
      </FieldProvider>
      <output data-testid="mirror">{JSON.stringify(value())}</output>
    </>
  );
}

describe('Switch：DOM 与状态契约', () => {
  it('role=switch 且 aria-checked / data-scui-checked 恒输出两态', () => {
    render(() => <Switch aria-label="单独开关" />);

    expect(control()).toHaveAttribute('type', 'checkbox');
    expect(control()).toHaveAttribute('role', 'switch');
    expect(control()).toHaveAttribute('aria-checked', 'false');
    expect(control()).toHaveAttribute('aria-invalid', 'false');
    expect(shell()).toHaveAttribute('data-scui-role', 'switch');
    expect(shell()).toHaveAttribute('data-scui-checked', 'false');
    expect(shell()).toHaveAttribute('data-scui-size', 'medium');
    expect(shell()).toHaveAttribute('data-scui-invalid', 'false');
  });

  it('无文案时使用方给的 aria-label 成为可访问名称', () => {
    render(() => <Switch aria-label="消息推送" />);

    expect(screen.getByRole('switch', { name: '消息推送' })).toBeInTheDocument();
    expect(control()).not.toHaveAttribute('aria-labelledby');
  });

  it('有文案时走共享 label 链路，aria-labelledby 指向真实节点', () => {
    render(() => <Switch>启用通知</Switch>);

    const labelledBy = control().getAttribute('aria-labelledby');
    expect(document.getElementById(labelledBy ?? '')?.textContent).toBe('启用通知');
    expect(screen.getByRole('switch', { name: '启用通知' })).toBeInTheDocument();
  });

  it('size / status / disabled 同时落 data 与原生属性', () => {
    render(() => (
      <Switch size="small" status="error" disabled>
        禁用开关
      </Switch>
    ));

    expect(control()).toBeDisabled();
    expect(control()).toHaveAttribute('aria-invalid', 'true');
    expect(shell()).toHaveAttribute('data-scui-size', 'small');
    expect(shell()).toHaveAttribute('data-scui-invalid', 'true');
    expect(shell()).toHaveAttribute('data-scui-disabled');
  });
});

describe('Switch：值流转', () => {
  it('非受控时点击切换并上报布尔值', () => {
    const onChange = vi.fn();
    render(() => (
      <Switch defaultChecked onChange={onChange}>
        默认开启
      </Switch>
    ));

    expect(control().checked).toBe(true);
    fireEvent.click(control());

    expect(control().checked).toBe(false);
    expect(shell()).toHaveAttribute('data-scui-checked', 'false');
    expect(onChange.mock.calls[0]?.[0]).toBe(false);
  });

  it('受控时外部不回写则保持原值（标准回弹）', () => {
    const onChange = vi.fn();
    render(() => (
      <Switch checked onChange={onChange}>
        受控开关
      </Switch>
    ));

    fireEvent.click(control());
    expect(onChange.mock.calls[0]?.[0]).toBe(false);
    expect(control().checked).toBe(true);
    expect(control()).toHaveAttribute('aria-checked', 'true');
  });

  it('字段上下文是唯一数据源，写值直接回写字段', () => {
    render(() => <FieldHost initial={true} />);

    expect(control().checked).toBe(true);
    fireEvent.click(control());
    expect(screen.getByTestId('mirror').textContent).toBe('false');
  });

  it('字段值不是布尔 true 时按关闭处理', () => {
    render(() => <FieldHost initial="true" />);

    expect(control().checked).toBe(false);
    expect(control()).toHaveAttribute('aria-checked', 'false');
  });
});
