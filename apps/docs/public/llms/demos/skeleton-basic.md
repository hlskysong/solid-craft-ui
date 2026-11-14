# Skeleton 骨架屏 · 五种形状（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/skeleton/demos/basic.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

text / card / table / button / avatar；行数与形状都走单一 variant 开关。

## 完整源码

```tsx
import { Skeleton } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '五种形状',
  description: 'text / card / table / button / avatar；行数与形状都走单一 variant 开关。',
};

export default function SkeletonBasicDemo() {
  return (
    <>
      <DemoSection title="段落">
        <Skeleton />
      </DemoSection>

      <DemoSection title="卡片">
        <Skeleton variant="card" rows={2} />
      </DemoSection>

      <DemoSection title="表格">
        <Skeleton variant="table" rows={4} />
      </DemoSection>

      <DemoSection title="按钮与头像">
        <div class="demo-row">
          <Skeleton variant="avatar" />
          <Skeleton variant="button" />
        </div>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Skeleton 骨架屏 API](../exports/skeleton.md)
- [设计 Token](../design/tokens.md)
