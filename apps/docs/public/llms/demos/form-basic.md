# Form 表单 · 基础用法（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/form/demos/basic.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

useForm 创建实例，Form.Item 接管控件取值，提交后回显全量快照。

## 完整源码

```tsx
import { createSignal } from 'solid-js';
import { Button, Form, Input, useForm } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description: 'useForm 创建实例，Form.Item 接管控件取值，提交后回显全量快照。',
};

export default function BasicDemo() {
  const [form] = useForm({ username: '', department: '' });
  const [submitted, setSubmitted] = createSignal('尚未提交');

  return (
    <DemoSection title="受控表单">
      <Form form={form} onFinish={(values) => setSubmitted(JSON.stringify(values))}>
        <Form.Item name="username" label="姓名">
          <Input placeholder="请输入姓名" />
        </Form.Item>
        <Form.Item name="department" label="部门">
          <Input placeholder="请输入部门" />
        </Form.Item>
        <Button htmlType="submit">提交</Button>
      </Form>
      <span>
        提交结果：<output>{submitted()}</output>
      </span>
    </DemoSection>
  );
}
```

## 相关页面

- [Form 表单 API](../exports/form.md)
- [设计 Token](../design/tokens.md)
