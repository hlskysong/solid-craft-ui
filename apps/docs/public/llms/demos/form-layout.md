# Form 表单 · 布局与状态（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/form/demos/layout.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

水平、垂直、行内三种布局；标签宽度、冒号、必填标记与整表禁用。

## 完整源码

```tsx
import { Form, Input } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '布局与状态',
  description: '水平、垂直、行内三种布局；标签宽度、冒号、必填标记与整表禁用。',
};

export default function LayoutDemo() {
  return (
    <>
      <DemoSection title="水平布局">
        <Form initialValues={{ username: '' }} labelWidth="120px">
          <Form.Item name="username" label="姓名" rules={[{ required: true }]}>
            <Input placeholder="标签宽度 120px" />
          </Form.Item>
        </Form>
      </DemoSection>

      <DemoSection title="垂直布局">
        <Form layout="vertical" initialValues={{ department: '' }} colon={false}>
          <Form.Item name="department" label="部门">
            <Input placeholder="无冒号" />
          </Form.Item>
        </Form>
      </DemoSection>

      <DemoSection title="行内布局与禁用">
        <Form layout="inline" initialValues={{ city: '' }}>
          <Form.Item name="city" label="城市">
            <Input placeholder="行内字段" />
          </Form.Item>
        </Form>
        <Form disabled initialValues={{ note: '' }}>
          <Form.Item name="note" label="备注">
            <Input placeholder="整表禁用" />
          </Form.Item>
        </Form>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Form 表单 API](../exports/form.md)
- [设计 Token](../design/tokens.md)
