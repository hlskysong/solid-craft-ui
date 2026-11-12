/**
 * T2-09 接入证据：七类控件 × 一条 useForm 实例（2026-11-12）。
 *
 * 与 `real-form.tsx` 的字段 / 值类型一一对应，但用相对 import 读源码组件而非
 * `solid-craft` 包入口 —— 单测跑的必须是工作区源码，不能是上一次 build 的 dist。
 *
 * 三件事必须被钉住：
 *  1. 控件不各自持有 value / onChange，值只由 `<Form.Item>` 的 FieldProvider 下发；
 *  2. `setFieldsValue`（编辑）/ `resetFields`（新增）能一次驱动**全部七类**控件；
 *  3. 控件写值回流实例、校验 / aria / disabled 也都走同一条字段上下文。
 *
 * 控件层（T2-03~T2-07）本轮一行未改；若这里红了，先查接线，不要改控件。
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Checkbox, CheckboxGroup } from '../checkbox';
import { Input, InputNumber, Textarea } from '../input';
import { RadioGroup } from '../radio';
import { Select } from '../select';
import type { SelectOption } from '../select';
import { Switch } from '../switch';
import { Form } from './Form';
import { useForm } from './form-instance';
import type { FormInstance, FormValues } from './types';

afterEach(cleanup);

const CITY_OPTIONS: SelectOption[] = [
  { value: 'sjz', label: '石家庄' },
  { value: 'hd', label: '邯郸' },
  { value: 'xt', label: '邢台' },
];
const SKILL_OPTIONS = [
  { value: 'solid', label: 'SolidJS' },
  { value: 'a11y', label: '无障碍' },
  { value: 'docs', label: '文档' },
];
const LEVEL_OPTIONS = [
  { value: 'junior', label: '初级' },
  { value: 'senior', label: '高级' },
];

const EMPTY: FormValues = {
  name: '',
  city: '',
  age: null,
  bio: '',
  skills: [],
  level: '',
  enabled: false,
  agree: false,
};
const EDIT: FormValues = {
  name: '张三',
  city: 'hd',
  age: 32,
  bio: '负责设备维检计划的前端开发。',
  skills: ['solid', 'a11y'],
  level: 'senior',
  enabled: true,
  agree: true,
};

/** 按 Form.Item 的 data-scui-field 定位字段壳，避免依赖控件内部 class。 */
function field(name: string): HTMLElement {
  const node = document.querySelector(`[data-scui-field="${name}"]`);
  if (!(node instanceof HTMLElement)) throw new Error(`未找到字段 ${name}`);
  return node;
}
function control<T extends HTMLElement = HTMLElement>(name: string, selector: string): T {
  const node = field(name).querySelector(selector);
  if (!(node instanceof HTMLElement)) throw new Error(`字段 ${name} 未找到 ${selector}`);
  return node as T;
}
const textInput = (name: string) => control<HTMLInputElement>(name, 'input');
const textarea = () => control<HTMLTextAreaElement>('bio', 'textarea');
const checks = (name: string) => [
  ...field(name).querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
];
const radios = () => [...field('level').querySelectorAll<HTMLInputElement>('input[type="radio"]')];
const selectTrigger = () =>
  control<HTMLButtonElement>('city', '[data-scui-primitive="select-trigger"]');
const formRoot = () => document.querySelector<HTMLFormElement>('[data-scui-role="form"]')!;

let instance: FormInstance | undefined;
let onFinish = vi.fn();
let onFinishFailed = vi.fn();

function renderForm(options: { disabled?: boolean } = {}): void {
  onFinish = vi.fn();
  onFinishFailed = vi.fn();
  function Harness() {
    const [form] = useForm<FormValues>(EMPTY);
    instance = form;
    return (
      <Form
        form={form}
        disabled={options.disabled}
        aria-label="员工档案"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
      >
        <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
          <Input />
        </Form.Item>
        <Form.Item
          name="city"
          label="工作城市"
          rules={[{ required: true, message: '请选择工作城市' }]}
        >
          <Select options={CITY_OPTIONS} placeholder="请选择城市" />
        </Form.Item>
        <Form.Item name="age" label="年龄">
          <InputNumber min={18} max={65} />
        </Form.Item>
        <Form.Item name="bio" label="简介">
          <Textarea showCount maxLength={120} />
        </Form.Item>
        <Form.Item
          name="skills"
          label="技能标签"
          rules={[{ required: true, message: '请至少选择一项技能' }]}
        >
          <CheckboxGroup options={SKILL_OPTIONS} />
        </Form.Item>
        <Form.Item name="level" label="职级">
          <RadioGroup options={LEVEL_OPTIONS} />
        </Form.Item>
        <Form.Item name="enabled" label="启用账号">
          <Switch />
        </Form.Item>
        <Form.Item
          name="agree"
          label="同意条款"
          rules={[{ validator: (value) => (value === true ? undefined : '请先同意条款') }]}
        >
          <Checkbox>我已阅读并同意</Checkbox>
        </Form.Item>
        <button type="submit">提交</button>
      </Form>
    );
  }
  render(Harness);
}

describe('T2-09：编辑 / 新增一次驱动七类控件', () => {
  it('setFieldsValue 灌入既有记录后，八字段全部呈现编辑值', () => {
    renderForm();
    instance?.setFieldsValue(EDIT);

    return waitFor(() => {
      expect(textInput('name')).toHaveValue('张三');
      expect(selectTrigger()).toHaveTextContent('邯郸');
      expect(textInput('age')).toHaveValue('32');
      expect(textarea()).toHaveValue('负责设备维检计划的前端开发。');
      expect(checks('skills').map((node) => node.checked)).toEqual([true, true, false]);
      expect(radios().map((node) => node.checked)).toEqual([false, true]);
      expect(control<HTMLInputElement>('enabled', 'input')).toBeChecked();
      expect(control<HTMLInputElement>('agree', 'input')).toBeChecked();
      expect(instance?.getFieldsValue()).toEqual(EDIT);
    });
  });

  it('resetFields 回到底稿后，八字段全部清空（含 Select 占位与布尔态）', () => {
    renderForm();
    instance?.setFieldsValue(EDIT);
    instance?.resetFields();

    return waitFor(() => {
      expect(textInput('name')).toHaveValue('');
      expect(selectTrigger()).toHaveTextContent('请选择城市');
      expect(textInput('age')).toHaveValue('');
      expect(textarea()).toHaveValue('');
      expect(checks('skills').every((node) => !node.checked)).toBe(true);
      expect(radios().every((node) => !node.checked)).toBe(true);
      expect(control<HTMLInputElement>('enabled', 'input')).not.toBeChecked();
      expect(control<HTMLInputElement>('agree', 'input')).not.toBeChecked();
      expect(instance?.getFieldsValue()).toEqual(EMPTY);
    });
  });

  it('八字段的 label[for] / 控件 id / aria-labelledby 同源，aria-invalid 恒两态', () => {
    renderForm();
    for (const name of Object.keys(EMPTY)) {
      const label = field(name).querySelector('label');
      const target = label?.getAttribute('for') ?? '';
      const node = document.getElementById(target);
      expect(node, `${name} 的 label[for] 指向空处`).not.toBeNull();
      // Kobalte 的 Select 会在 trigger 上追加自己的值标签 id，因此契约是
      // 「至少包含字段 label 的 id」，不是逐字相等。
      expect(node?.getAttribute('aria-labelledby')?.split(/\s+/)).toContain(label?.id);
      expect(node?.getAttribute('aria-invalid')).toBe('false');
    }
  });

  it('字段内所有控件 id 不重复（Group 的多个原生控件不共用同一个 control id）', () => {
    renderForm();
    const ids = [...document.querySelectorAll('[data-scui-role="form"] [id]')].map(
      (node) => node.id,
    );
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    expect(duplicates).toEqual([]);
  });
});

describe('T2-09：控件写值回流到同一条实例', () => {
  it('Input / Textarea / InputNumber 三类的输入都落到字段', async () => {
    renderForm();
    fireEvent.input(textInput('name'), { target: { value: '李四' } });
    fireEvent.input(textarea(), { target: { value: '负责前端开发。' } });
    fireEvent.input(textInput('age'), { target: { value: '28' } });

    await waitFor(() => {
      expect(instance?.getFieldValue('name')).toBe('李四');
      expect(instance?.getFieldValue('bio')).toBe('负责前端开发。');
      expect(instance?.getFieldValue('age')).toBe(28);
    });
  });

  it('Checkbox（独立）/ Switch / CheckboxGroup / RadioGroup 的点击都落到字段', () => {
    renderForm();
    fireEvent.click(control<HTMLInputElement>('agree', 'input'));
    fireEvent.click(control<HTMLInputElement>('enabled', 'input'));
    fireEvent.click(checks('skills')[1]!);
    fireEvent.click(radios()[1]!);

    expect(instance?.getFieldValue('agree')).toBe(true);
    expect(instance?.getFieldValue('enabled')).toBe(true);
    expect(instance?.getFieldValue('skills')).toEqual(['a11y']);
    expect(instance?.getFieldValue('level')).toBe('senior');
  });

  it('Select 键盘选中后写入字符串字段，触发器显示对应 label', async () => {
    renderForm();
    fireEvent.keyDown(selectTrigger(), { key: 'ArrowDown' });
    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument());
    const option = document.querySelector('[data-scui-option="sjz"]');
    expect(option).not.toBeNull();
    fireEvent.click(option!);

    await waitFor(() => expect(instance?.getFieldValue('city')).toBe('sjz'));
    await waitFor(() => expect(selectTrigger()).toHaveTextContent('石家庄'));
  });
});

describe('T2-09：真实表单页端到端', () => {
  it('空表单提交失败挂出错误与 aria；补齐后提交成功并回显全量快照', async () => {
    renderForm();
    fireEvent.submit(formRoot());

    await waitFor(() => expect(onFinishFailed).toHaveBeenCalled());
    expect(onFinish).not.toHaveBeenCalled();
    expect(field('name')).toHaveAttribute('data-scui-invalid', 'true');
    expect(field('name').querySelector('[data-scui-role="field-error"]')).toHaveTextContent(
      '请输入姓名',
    );
    expect(textInput('name')).toHaveAttribute('aria-invalid', 'true');
    expect(textInput('name').getAttribute('aria-describedby')).toBe(
      field('name').querySelector('[data-scui-role="field-error"]')?.id,
    );

    instance?.setFieldsValue({ ...EDIT, name: '李四' });
    fireEvent.submit(formRoot());
    await waitFor(() => expect(onFinish).toHaveBeenCalled());
    expect(onFinish).toHaveBeenCalledWith(
      expect.objectContaining({ name: '李四', city: 'hd', age: 32, enabled: true }),
    );
    expect(field('name')).toHaveAttribute('data-scui-invalid', 'false');
  });

  it('整表 disabled 合并进七类控件，且字段壳也带 disabled 标记', () => {
    renderForm({ disabled: true });
    expect(formRoot()).toHaveAttribute('data-scui-disabled', '');
    for (const name of Object.keys(EMPTY)) {
      expect(field(name)).toHaveAttribute('data-scui-disabled', '');
      // Select 的无焦点隐藏字段（表单提交用）本就没有 disabled 语义，排除它。
      const nodes = field(name).querySelectorAll('input:not([type="hidden"]), textarea, button');
      expect(nodes.length, `${name} 没有可禁用控件`).toBeGreaterThan(0);
      for (const node of nodes) expect(node).toBeDisabled();
    }
  });

  it('编辑 → 改名 → 提交 → 切回新增，快照跟着模式走', async () => {
    renderForm();
    instance?.setFieldsValue(EDIT);
    await waitFor(() => expect(textInput('name')).toHaveValue('张三'));

    fireEvent.input(textInput('name'), { target: { value: '王五' } });
    fireEvent.submit(formRoot());
    await waitFor(() => expect(onFinish).toHaveBeenCalled());
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ name: '王五', city: 'hd' }));

    instance?.resetFields();
    await waitFor(() => expect(instance?.getFieldsValue()).toEqual(EMPTY));
    expect(textInput('name')).toHaveValue('');
  });
});
