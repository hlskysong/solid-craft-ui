/**
 * T2-09 SSR 入口：真实表单页（新增 + 编辑）的静态骨架。
 *
 * 两张表单共用八字段、覆盖七类控件；编辑态由 `initialValues` 预填，验证服务端就能
 * 输出受控值（Input value / Select label / checkbox checked），而不是靠客户端 hydrate
 * 后补。校验只在提交时跑、Portal 只在客户端挂，因此 field-error 与 select-search
 * 在服务端必须一次都不出现（counts 锁 0）。
 *
 * 不进 dist / npm 包：collect-sources 与 tsconfig.build.json 排除 `__tests__`。
 */
import { renderToString } from 'solid-js/web';

import { Checkbox, CheckboxGroup } from '../../checkbox';
import { Input, InputNumber, Textarea } from '../../input';
import { RadioGroup } from '../../radio';
import { Select } from '../../select';
import { Switch } from '../../switch';
import { Form } from '../Form';

const CITY_OPTIONS = [
  { value: 'sjz', label: '石家庄' },
  { value: 'hd', label: '邯郸' },
];
const SKILL_OPTIONS = [
  { value: 'solid', label: 'SolidJS' },
  { value: 'a11y', label: '无障碍' },
];
const LEVEL_OPTIONS = [
  { value: 'junior', label: '初级' },
  { value: 'senior', label: '高级' },
];

const EMPTY = {
  name: '',
  city: '',
  age: null,
  bio: '',
  skills: [],
  level: '',
  enabled: false,
  agree: false,
};
const EDIT = {
  name: '张三',
  city: 'hd',
  age: 32,
  bio: '负责设备维检计划的前端开发。',
  skills: ['solid', 'a11y'],
  level: 'senior',
  enabled: true,
  agree: true,
};

/** 八字段壳；放在 FormContext 内执行，字段值由各自 <Form initialValues> 下发。 */
function Fields() {
  return (
    <>
      <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
        <Input placeholder="请输入姓名" />
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
      <Form.Item name="skills" label="技能标签">
        <CheckboxGroup options={SKILL_OPTIONS} />
      </Form.Item>
      <Form.Item name="level" label="职级">
        <RadioGroup options={LEVEL_OPTIONS} />
      </Form.Item>
      <Form.Item name="enabled" label="启用账号">
        <Switch />
      </Form.Item>
      <Form.Item name="agree" label="同意条款">
        <Checkbox>我已阅读并同意</Checkbox>
      </Form.Item>
    </>
  );
}

export async function render(): Promise<string> {
  return renderToString(() => (
    <div lang="zh-CN">
      <Form layout="horizontal" initialValues={EMPTY} aria-label="员工档案（新增）">
        <Fields />
      </Form>
      <Form layout="vertical" initialValues={EDIT} aria-label="员工档案（编辑）">
        <Fields />
      </Form>
    </div>
  ));
}
