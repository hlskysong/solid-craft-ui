# Radio 单选框 · 基础用法（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/radio/demos/basic.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

独立单选框、三档尺寸、禁用态与校验态。

## 完整源码

```tsx
import { Radio } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description: '独立单选框、三档尺寸、禁用态与校验态。',
};

export default function RadioBasicDemo() {
  return (
    <>
      <DemoSection title="独立使用">
        <Radio defaultChecked>默认选中</Radio>
        <Radio>未选中</Radio>
        <Radio aria-label="无文案的单选框" defaultChecked />
      </DemoSection>

      <DemoSection title="尺寸">
        <Radio size="small" defaultChecked>
          small
        </Radio>
        <Radio size="medium" defaultChecked>
          medium
        </Radio>
        <Radio size="large" defaultChecked>
          large
        </Radio>
      </DemoSection>

      <DemoSection title="禁用">
        <Radio disabled>禁用未选中</Radio>
        <Radio disabled defaultChecked>
          禁用已选中
        </Radio>
      </DemoSection>

      <DemoSection title="校验态">
        <Radio status="error">请选择一个选项</Radio>
        <Radio status="error" defaultChecked>
          已选中但仍有错误
        </Radio>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Radio 单选框 API](../exports/radio.md)
- [设计 Token](../design/tokens.md)
