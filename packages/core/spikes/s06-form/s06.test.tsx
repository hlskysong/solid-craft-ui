/**
 * S-06 实证：Input + 校验 + 错误滚动 + 字段级更新不整表重渲染。
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createEffect } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ScuiForm,
  ScuiFormItem,
  ScuiFormSubmit,
  ScuiInput,
  useFormField,
} from './Form';
import { minLength, pattern, required, scrollToFirstError } from './validation';

afterEach(cleanup);

const rules = {
  name: [required('请填写姓名'), minLength(2)],
  email: [required('请填写邮箱'), pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, '邮箱格式不正确')],
};

describe('S-06 校验链路', () => {
  it('规则可组合：required / minLength / pattern', () => {
    expect(required('必填')('')).toBe('必填');
    expect(required()(' 内容 ')).toBeUndefined();
    expect(minLength(3)('ab')).toContain('3');
    expect(pattern(/^\d+$/, '须为数字')('abc')).toBe('须为数字');
    expect(pattern(/^\d+$/, '须为数字')('123')).toBeUndefined();
  });

  it('提交失败：错误展示、aria-invalid、滚动到首个错误字段', () => {
    const onFinishFailed = vi.fn();
    const onFinish = vi.fn();
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    render(() => (
      <ScuiForm
        initialValues={{ name: '', email: '' }}
        rules={rules}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
      >
        <ScuiFormItem name="name" label="姓名" />
        <ScuiFormItem name="email" label="邮箱" />
        <ScuiFormSubmit>保存</ScuiFormSubmit>
      </ScuiForm>
    ));

    fireEvent.submit(screen.getByRole('form', { name: '表单' }));
    expect(onFinish).not.toHaveBeenCalled();
    expect(onFinishFailed).toHaveBeenCalledTimes(1);
    expect(screen.getByText('请填写姓名')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '姓名' })).toHaveAttribute('aria-invalid', 'true');
    expect(document.querySelector('[data-scui-field="name"][data-scui-role="form-item"]')).toHaveAttribute(
      'data-scui-invalid',
      'true',
    );
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('填写合法值后提交成功并回传全量字段', () => {
    const onFinish = vi.fn();
    render(() => (
      <ScuiForm initialValues={{ name: '张三', email: 'a@b.com' }} rules={rules} onFinish={onFinish}>
        <ScuiFormItem name="name" label="姓名" />
        <ScuiFormItem name="email" label="邮箱" />
        <ScuiFormSubmit>保存</ScuiFormSubmit>
      </ScuiForm>
    ));
    fireEvent.submit(screen.getByRole('form', { name: '表单' }));
    expect(onFinish).toHaveBeenCalledWith({ name: '张三', email: 'a@b.com' });
  });

  it('错误滚动助手对不存在字段返回 false', () => {
    expect(scrollToFirstError(document, undefined)).toBe(false);
    expect(scrollToFirstError(document, 'missing')).toBe(false);
  });
});

describe('S-06 字段级更新', () => {
  it('改一个字段不触发其它字段的 effect（不整表重渲染）', () => {
    const counts: Record<string, number> = {};

    function CountedField(props: { name: string }) {
      const field = useFormField(props.name);
      createEffect(() => {
        field.value();
        counts[props.name] = (counts[props.name] ?? 0) + 1;
      });
      return <span data-testid={`probe-${props.name}`}>{props.name}</span>;
    }

    render(() => (
      <ScuiForm initialValues={{ name: '', email: '' }}>
        <CountedField name="name" />
        <CountedField name="email" />
        <ScuiFormItem name="name" label="姓名" />
        <ScuiFormItem name="email" label="邮箱" />
        <ScuiInput name="name" placeholder="姓名输入" />
      </ScuiForm>
    ));

    const beforeName = counts.name ?? 0;
    const beforeEmail = counts.email ?? 0;
    expect(beforeName).toBeGreaterThan(0);
    expect(beforeEmail).toBeGreaterThan(0);

    fireEvent.input(screen.getByPlaceholderText('姓名输入'), { target: { value: '李四' } });
    expect(counts.name).toBeGreaterThan(beforeName);
    expect(counts.email).toBe(beforeEmail);
  });
});
