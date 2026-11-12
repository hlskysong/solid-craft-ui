# Divider 分割线 · 垂直分割（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/divider/demos/vertical.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

在文本、链接与按钮组之间插入垂直分割线。

## 完整源码

```tsx
import { Button, Divider, Link, Text } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '垂直分割',
  description: '在文本、链接与按钮组之间插入垂直分割线。',
};

export default function Vertical() {
  return (
    <>
      <DemoSection title="文本与链接">
        <div class="demo-inline">
          <Text>计划编号</Text>
          <Divider orientation="vertical" />
          <Text>设备清单</Text>
          <Divider orientation="vertical" />
          <Link href="#divider-vertical-anchor">审批记录</Link>
        </div>
      </DemoSection>
      <DemoSection title="按钮组与虚线">
        <div class="demo-inline">
          <Button variant="text">新增</Button>
          <Divider orientation="vertical" />
          <Button variant="text">编辑</Button>
          <Divider orientation="vertical" dashed />
          <Button variant="text">删除</Button>
        </div>
        <p id="divider-vertical-anchor">锚点目标</p>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Divider 分割线 API](../exports/divider.md)
- [设计 Token](../design/tokens.md)
