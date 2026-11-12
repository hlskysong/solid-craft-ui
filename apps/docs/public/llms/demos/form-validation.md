# Form 表单 · 校验规则（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/form/demos/validation.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

必填、长度、正则、类型与自定义规则按数组顺序执行，失败时展示错误并回显结果。

## 完整源码

```tsx
import { createSignal } from 'solid-js';
import { Button, Form, Input } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '校验规则',
  description: '必填、长度、正则、类型与自定义规则按数组顺序执行，失败时展示错误并回显结果。',
};

export default function ValidationDemo() {
  const [result, setResult] = createSignal('尚未校验');

  return (
    <DemoSection title="提交时校验">
      <Form
        initialValues={{ username: '', code: '', email: '' }}
        onFinish={(values) => setResult(`通过 ${JSON.stringify(values)}`)}
        onFinishFailed={(errors) => setResult(`失败 ${JSON.stringify(errors)}`)}
      >
        <Form.Item name="username" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
          <Input placeholder="必填" />
        </Form.Item>
        <Form.Item
          name="code"
          label="编码"
          rules={[
            { required: true, message: '请输入编码' },
            { pattern: /^[A-Z]{3}$/, message: '需三位大写字母' },
          ]}
        >
          <Input placeholder="例如 ABC" />
        </Form.Item>
        <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '邮箱格式不正确' }]}>
          <Input placeholder="非必填，填写后校验格式" />
        </Form.Item>
        <Button htmlType="submit">校验并提交</Button>
      </Form>
      <span>
        校验结果：<output>{result()}</output>
      </span>
    </DemoSection>
  );
}
```

## 相关页面

- [Form 表单 API](../exports/form.md)
- [设计 Token](../design/tokens.md)
