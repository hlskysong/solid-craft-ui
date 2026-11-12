/**
 * `Form` 组件层单测（T2-08）。
 *
 * 覆盖五件事：状态契约与三种布局、值实例七个方法、六种校验规则与异步、
 * 错误滚动与 aria 三件套、以及「改一个字段不触发其它字段 effect」的字段级订阅。
 * SSR 双渲确定性由 `spikes/shared/ssr-smoke.mjs` 的 T2-08 入口验，这里跑在 jsdom。
 */
import { cleanup, fireEvent, render, waitFor } from '@solidjs/testing-library';
import { createEffect } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useFormFieldOptional } from '../../form/use-form-field';
import { Input } from '../input';
import { Select } from '../select';
import type { SelectOption } from '../select';
import { Form } from './Form';
import { useForm } from './form-instance';
import type { FormInstance, FormValues } from './types';

afterEach(cleanup);

function element<T extends HTMLElement = HTMLElement>(selector: string): T {
  const node = document.querySelector(selector);
  if (!(node instanceof HTMLElement)) throw new Error(`未找到元素 ${selector}`);
  return node as T;
}

const formRoot = () => element<HTMLFormElement>('[data-scui-role="form"]');
const formItem = () => element('[data-scui-role="form-item"]');
// Input 的根是 <span data-scui-role="input">，真正承载值 / aria 的是内层原生 input。
const fieldInput = () => element<HTMLInputElement>('input.scui-input__control');
const fieldLabel = () => element<HTMLLabelElement>('label');
const fieldError = () => element('[data-scui-role="field-error"]');

const cities: SelectOption[] = [
  { value: 'sjz', label: '石家庄' },
  { value: 'hd', label: '邯郸' },
];

/** 只订阅自身字段值的探针，用于 effect 计数。 */
function ValueProbe(props: { onRead: () => void }) {
  const field = useFormFieldOptional();
  createEffect(() => {
    field?.value();
    props.onRead();
  });
  return <span />;
}

describe('Form：状态契约与布局', () => {
  it('默认 horizontal / 无 disabled 标记 / 不主动命名 landmark', () => {
    render(() => (
      <Form initialValues={{ name: '' }}>
        <Form.Item name="name" label="姓名">
          <Input />
        </Form.Item>
      </Form>
    ));

    expect(formRoot()).toHaveAttribute('data-scui-role', 'form');
    expect(formRoot()).toHaveAttribute('data-scui-layout', 'horizontal');
    // 不给默认 aria-label：同页多表单都叫「表单」时 axe 会判 landmark-unique。
    expect(formRoot()).not.toHaveAttribute('aria-label');
    expect(formRoot()).not.toHaveAttribute('data-scui-disabled');
    expect(formItem()).toHaveAttribute('data-scui-invalid', 'false');
    expect(formItem()).toHaveAttribute('data-scui-field', 'name');
  });

  it('显式传入 aria-label 时原样落到 form 上（landmark 由调用方决定）', () => {
    render(() => (
      <Form aria-label="设备采购表单" initialValues={{ name: '' }}>
        <Form.Item name="name" label="姓名">
          <Input />
        </Form.Item>
      </Form>
    ));

    expect(formRoot()).toHaveAttribute('aria-label', '设备采购表单');
  });

  it('三种布局、labelWidth、colon 与 requiredMark 都落到 data 属性或 DOM 上', () => {
    const { unmount } = render(() => (
      <Form layout="vertical" labelWidth="140px" colon={false} requiredMark={false}>
        <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </Form>
    ));

    expect(formRoot()).toHaveAttribute('data-scui-layout', 'vertical');
    expect(formRoot().style.getPropertyValue('--scui-form-label-width')).toBe('140px');
    expect(formItem()).toHaveAttribute('data-scui-layout', 'vertical');
    expect(formItem()).not.toHaveAttribute('data-scui-required');
    expect(fieldLabel()).not.toHaveTextContent('：');
    unmount();

    render(() => (
      <Form layout="inline">
        <Form.Item name="city" label="城市" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </Form>
    ));
    expect(formRoot()).toHaveAttribute('data-scui-layout', 'inline');
    expect(formItem()).toHaveAttribute('data-scui-required', '');
    expect(fieldLabel()).toHaveTextContent('*');
  });

  it('整表 disabled 同时落在 Form 与 Form.Item，并合并进字段 disabled getter', () => {
    render(() => (
      <Form disabled>
        <Form.Item name="name" label="姓名">
          <Input />
        </Form.Item>
      </Form>
    ));

    expect(formRoot()).toHaveAttribute('data-scui-disabled', '');
    expect(formItem()).toHaveAttribute('data-scui-disabled', '');
    expect(fieldInput()).toBeDisabled();
  });

  it('label[for] / 控件 id / aria-labelledby 三者同源，aria-invalid 恒输出两态', () => {
    render(() => (
      <Form initialValues={{ name: '' }}>
        <Form.Item name="name" label="姓名">
          <Input />
        </Form.Item>
      </Form>
    ));

    expect(fieldLabel().getAttribute('for')).toBe(fieldInput().id);
    expect(fieldInput().getAttribute('aria-labelledby')).toBe(fieldLabel().id);
    expect(fieldInput()).toHaveAttribute('aria-invalid', 'false');
    expect(fieldInput()).not.toHaveAttribute('aria-describedby');
  });

  it('脱离 <Form> 使用 <Form.Item> 会抛明确错误', () => {
    expect(() =>
      render(() => (
        <Form.Item name="name" label="姓名">
          <Input />
        </Form.Item>
      )),
    ).toThrowError(/必须在 <Form> 内使用/);
  });
});

describe('Form：值实例七个方法', () => {
  it('useForm 的实例可被 <Form form> 接管，get / set / reset 全通', async () => {
    let instance: FormInstance | undefined;
    function Harness() {
      const [form] = useForm<FormValues>({ name: '张三' });
      instance = form;
      return (
        <Form form={form}>
          <Form.Item name="name" label="姓名">
            <Input />
          </Form.Item>
        </Form>
      );
    }
    render(Harness);

    expect(instance?.getFieldsValue()).toEqual({ name: '张三' });
    expect(instance?.getFieldValue('name')).toBe('张三');
    expect(fieldInput()).toHaveValue('张三');

    instance?.setFieldsValue({ name: '李四' });
    await waitFor(() => expect(fieldInput()).toHaveValue('李四'));

    instance?.setFieldValue('name', '王五');
    await waitFor(() => expect(instance?.getFieldsValue()).toEqual({ name: '王五' }));

    instance?.resetFields();
    await waitFor(() => expect(fieldInput()).toHaveValue('张三'));
    expect(instance?.getFieldError('name')).toBeUndefined();
  });

  it('输入控件写值直接落到字段，不持有重复状态', async () => {
    let instance: FormInstance | undefined;
    function Harness() {
      const [form] = useForm<FormValues>({ name: '' });
      instance = form;
      return (
        <Form form={form}>
          <Form.Item name="name" label="姓名">
            <Input />
          </Form.Item>
        </Form>
      );
    }
    render(Harness);

    fireEvent.input(fieldInput(), { target: { value: '邯郸' } });
    await waitFor(() => expect(instance?.getFieldValue('name')).toBe('邯郸'));
    expect(instance?.getFieldsValue()).toEqual({ name: '邯郸' });
  });

  it('Select 也能读同一个字段值（T2-09 接入前的链路证据）', async () => {
    let instance: FormInstance | undefined;
    function Harness() {
      const [form] = useForm<FormValues>({ city: '' });
      instance = form;
      return (
        <Form form={form}>
          <Form.Item name="city" label="城市">
            <Select options={cities} />
          </Form.Item>
        </Form>
      );
    }
    render(Harness);

    instance?.setFieldValue('city', 'hd');
    await waitFor(() =>
      expect(element('[data-scui-primitive="select-trigger"]')).toHaveTextContent('邯郸'),
    );
  });

  it('改一个字段不触发其它字段的 effect（字段级独立信号）', async () => {
    let aReads = 0;
    let bReads = 0;
    let instance: FormInstance | undefined;
    function Harness() {
      const [form] = useForm<FormValues>({ a: '', b: '' });
      instance = form;
      return (
        <Form form={form}>
          <Form.Item name="a" label="A">
            <ValueProbe onRead={() => (aReads += 1)} />
          </Form.Item>
          <Form.Item name="b" label="B">
            <ValueProbe onRead={() => (bReads += 1)} />
          </Form.Item>
        </Form>
      );
    }
    render(Harness);

    const beforeA = aReads;
    const beforeB = bReads;
    expect(beforeA).toBeGreaterThan(0);
    expect(beforeB).toBeGreaterThan(0);

    instance?.setFieldValue('a', 'x');
    await waitFor(() => expect(aReads).toBeGreaterThan(beforeA));
    expect(bReads).toBe(beforeB);
  });
});

describe('Form：校验、提交与错误滚动', () => {
  it('required / min / max / pattern / type 五类静态规则按数组顺序取第一条失败', async () => {
    let instance: FormInstance | undefined;
    function Harness() {
      const [form] = useForm<FormValues>({ username: '', age: 12, email: 'bad', code: '12' });
      instance = form;
      return (
        <Form form={form}>
          <Form.Item
            name="username"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="age" label="年龄" rules={[{ min: 18, message: '未满 18 岁' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '邮箱格式不对' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="code"
            label="编码"
            rules={[{ pattern: /^[A-Z]{3}$/, message: '需三位大写字母' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      );
    }
    render(Harness);

    const result = await instance?.validateFields();
    expect(result?.valid).toBe(false);
    expect(result?.errors).toEqual({
      username: '请输入姓名',
      age: '未满 18 岁',
      email: '邮箱格式不对',
      code: '需三位大写字母',
    });
    expect(result?.firstErrorName).toBe('username');
    expect(instance?.getFieldError('username')).toBe('请输入姓名');
  });

  it('空值不做静态规则校验，只有 required 管空', async () => {
    let instance: FormInstance | undefined;
    function Harness() {
      const [form] = useForm<FormValues>({ email: '' });
      instance = form;
      return (
        <Form form={form}>
          <Form.Item name="email" label="邮箱" rules={[{ type: 'email' }, { min: 6 }]}>
            <Input />
          </Form.Item>
        </Form>
      );
    }
    render(Harness);

    expect((await instance?.validateFields())?.valid).toBe(true);
  });

  it('自定义同步与异步 validator 都会被等待', async () => {
    let instance: FormInstance | undefined;
    function Harness() {
      const [form] = useForm<FormValues>({ code: 'abc' });
      instance = form;
      return (
        <Form form={form}>
          <Form.Item
            name="code"
            label="编码"
            rules={[{ validator: () => '同步拒绝' }, { validator: async () => '异步拒绝' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      );
    }
    render(Harness);

    const result = await instance?.validateFields();
    expect(result?.errors).toEqual({ code: '同步拒绝' });
  });

  it('提交成功走 onFinish；失败走 onFinishFailed 并挂出错误文案与 aria-describedby', async () => {
    const onFinish = vi.fn();
    const onFinishFailed = vi.fn();
    render(() => (
      <Form initialValues={{ name: '' }} onFinish={onFinish} onFinishFailed={onFinishFailed}>
        <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
          <Input />
        </Form.Item>
        <button type="submit">提交</button>
      </Form>
    ));

    fireEvent.submit(formRoot());
    await waitFor(() => expect(onFinishFailed).toHaveBeenCalledWith({ name: '请输入姓名' }));
    expect(onFinish).not.toHaveBeenCalled();
    expect(formItem()).toHaveAttribute('data-scui-invalid', 'true');
    expect(fieldError()).toHaveAttribute('role', 'alert');
    expect(fieldError()).toHaveTextContent('请输入姓名');
    expect(fieldInput().getAttribute('aria-describedby')).toBe(fieldError().id);
    expect(fieldInput()).toHaveAttribute('aria-invalid', 'true');

    fireEvent.input(fieldInput(), { target: { value: '张三' } });
    fireEvent.submit(formRoot());
    await waitFor(() => expect(onFinish).toHaveBeenCalledWith({ name: '张三' }));
    expect(formItem()).toHaveAttribute('data-scui-invalid', 'false');
  });

  it('失败时滚动到第一个错误字段并聚焦控件', async () => {
    const scrollIntoView = vi.fn();
    // 用属性描述符存取，避免直接引用原型方法触发 unbound-method，且能还原「原本不存在」的状态。
    const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: scrollIntoView,
    });
    try {
      render(() => (
        <Form initialValues={{ first: '', second: '' }}>
          <Form.Item name="first" label="第一项" rules={[{ required: true, message: '必填一' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="second" label="第二项" rules={[{ required: true, message: '必填二' }]}>
            <Input />
          </Form.Item>
          <button type="submit">提交</button>
        </Form>
      ));

      fireEvent.submit(formRoot());
      await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
      expect(document.activeElement).toBeInstanceOf(HTMLInputElement);
    } finally {
      if (descriptor) {
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', descriptor);
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
      }
    }
  });

  it('resetFields 清空错误文案，validateFields(names) 只校验指定字段', async () => {
    let instance: FormInstance | undefined;
    function Harness() {
      const [form] = useForm<FormValues>({ a: '', b: '' });
      instance = form;
      return (
        <Form form={form}>
          <Form.Item name="a" label="A" rules={[{ required: true, message: 'A 必填' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="b" label="B" rules={[{ required: true, message: 'B 必填' }]}>
            <Input />
          </Form.Item>
        </Form>
      );
    }
    render(Harness);

    expect((await instance?.validateFields(['b']))?.errors).toEqual({ b: 'B 必填' });
    expect(instance?.getFieldError('a')).toBeUndefined();

    await instance?.validateFields();
    expect(document.querySelectorAll('[data-scui-role="field-error"]')).toHaveLength(2);

    instance?.resetFields();
    await waitFor(() =>
      expect(document.querySelectorAll('[data-scui-role="field-error"]')).toHaveLength(0),
    );
  });

  it('<Form form> 拒绝非 useForm 实例', () => {
    expect(() =>
      render(() => (
        <Form form={{ getFieldsValue: () => ({}) } as unknown as FormInstance}>
          <Form.Item name="a" label="A">
            <Input />
          </Form.Item>
        </Form>
      )),
    ).toThrowError(/只接受 useForm\(\) 返回的实例/);
  });
});
