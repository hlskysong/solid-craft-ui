# Divider 分割线 · 带文字分割（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/divider/demos/with-text.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

plain 与默认字重的对比，以及虚线 + 文字的组合。

## 完整源码

```tsx
import { Divider, Text } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '带文字分割',
  description: 'plain 与默认字重的对比，以及虚线 + 文字的组合。',
};

export default function WithText() {
  return (
    <DemoSection title="文字分割线">
      <div class="demo-stack">
        <Text>设备基本信息</Text>
        <Divider>基本信息</Divider>
        <Divider plain>普通字重（plain）</Divider>
        <Divider dashed>虚线 + 文字</Divider>
        <Divider dashed plain>
          虚线 + 普通字重
        </Divider>
        <Text>维检记录</Text>
      </div>
    </DemoSection>
  );
}
```

## 相关页面

- [Divider 分割线 API](../exports/divider.md)
- [设计 Token](../design/tokens.md)
