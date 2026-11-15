# Upload 上传 · 与 Form.Item 接入（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/upload/demos/form.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

Upload 在 <Form.Item> 内由字段上下文接管 fileList，值优先级高于 props；删除、重试、进度都回写同一个字段，提交时拿到的是变更后的列表。必填规则对空数组同样生效。

## 完整源码

```tsx
import { createSignal } from 'solid-js';
import { Button, Form, Upload, useForm, type FormValues, type UploadFile } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '与 Form.Item 接入',
  description:
    'Upload 在 <Form.Item> 内由字段上下文接管 fileList，值优先级高于 props；删除、重试、进度都回写同一个字段，提交时拿到的是变更后的列表。必填规则对空数组同样生效。',
};

const initial: UploadFile[] = [
  { uid: 'form-1', name: '立项批复.pdf', size: 30720, status: 'done', percent: 100 },
  { uid: 'form-2', name: '预算明细.pdf', size: 15360, status: 'done', percent: 100 },
];

export default function UploadFormDemo() {
  const [form] = useForm<FormValues>({ attachments: initial });
  const [result, setResult] = createSignal('尚未提交');

  return (
    <DemoSection title="表单接入">
      <div class="demo-column">
        <Form
          form={form}
          aria-label="附件提交表单"
          data-testid="upload-form"
          onFinish={(values: FormValues) => {
            const raw = values.attachments;
            const count = Array.isArray(raw) ? raw.length : 0;
            setResult(`提交成功：${count} 个附件`);
          }}
        >
          <Form.Item
            name="attachments"
            label="附件"
            rules={[{ required: true, message: '请至少上传一个附件' }]}
          >
            <Upload aria-label="表单附件" data-testid="upload-form-control" />
          </Form.Item>
          <Button htmlType="submit" data-testid="upload-form-submit">
            提交附件
          </Button>
        </Form>
        <p data-testid="upload-form-result">{result()}</p>
      </div>
    </DemoSection>
  );
}
```

## 相关页面

- [Upload 上传 API](../exports/upload.md)
- [设计 Token](../design/tokens.md)
