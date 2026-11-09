# Divider 分割线 · 基础用法（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/divider/demos/basic.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

水平 / 垂直分割线、虚线与带文字分割。

## 完整源码

```tsx
import { Divider, Text } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description: '水平 / 垂直分割线、虚线与带文字分割。',
};

export default function Basic() {
  return (
    <>
      <DemoSection title="水平分割线">
        <div class="demo-stack">
          <Text>上方内容</Text>
          <Divider />
          <Text>下方内容</Text>
          <Divider dashed>虚线分割</Divider>
          <Divider plain>带文字分割</Divider>
        </div>
      </DemoSection>
      <DemoSection title="垂直分割线">
        <div class="demo-inline">
          <Text>左</Text>
          <Divider orientation="vertical" />
          <Text>中</Text>
          <Divider orientation="vertical" dashed />
          <Text>右</Text>
        </div>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Divider 分割线 API](../exports/divider.md)
- [设计 Token](../design/tokens.md)
