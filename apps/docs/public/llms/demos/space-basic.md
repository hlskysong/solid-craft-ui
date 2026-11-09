# Space 间距 · 基础用法（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/space/demos/basic.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

水平 / 垂直排列、分隔线与换行对齐。

## 完整源码

```tsx
import { For } from 'solid-js';
import { Button, Divider, Space, Text } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description: '水平 / 垂直排列、分隔线与换行对齐。',
};

export default function Basic() {
  return (
    <>
      <DemoSection title="水平 / 垂直">
        <Space size="small">
          <Button>small</Button>
          <Button>A</Button>
          <Button>B</Button>
        </Space>
        <Space direction="vertical" size="large">
          <Button>vertical 1</Button>
          <Button>vertical 2</Button>
        </Space>
      </DemoSection>
      <DemoSection title="分隔与对齐">
        <Space split={<Divider orientation="vertical" />} align="center">
          <Text>one</Text>
          <Text>two</Text>
          <Text>three</Text>
        </Space>
        <Space wrap>
          <For each={[1, 2, 3, 4, 5, 6]}>
            {(index) => <Button variant="outline">{`wrap ${index}`}</Button>}
          </For>
        </Space>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Space 间距 API](../exports/space.md)
- [设计 Token](../design/tokens.md)
