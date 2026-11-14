# Skeleton 骨架屏 · 微光动画（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/skeleton/demos/active.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

active 开启微光；系统开启「减弱动效」时自动静止，不靠 JS 判断。

## 完整源码

```tsx
import { Skeleton } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '微光动画',
  description: 'active 开启微光；系统开启「减弱动效」时自动静止，不靠 JS 判断。',
};

export default function SkeletonActiveDemo() {
  return (
    <>
      <DemoSection title="段落微光">
        <Skeleton active rows={4} />
      </DemoSection>

      <DemoSection title="卡片微光">
        <Skeleton active variant="card" rows={3} />
      </DemoSection>

      <DemoSection title="表格微光">
        <Skeleton active variant="table" rows={3} />
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Skeleton 骨架屏 API](../exports/skeleton.md)
- [设计 Token](../design/tokens.md)
