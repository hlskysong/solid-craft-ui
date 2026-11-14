# Empty 空状态 · 基础用法（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/empty/demos/basic.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

默认插画 + 默认文案；三档尺寸按容器宽度选，不改变文案排版。

## 完整源码

```tsx
import { Empty } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description: '默认插画 + 默认文案；三档尺寸按容器宽度选，不改变文案排版。',
};

export default function EmptyBasicDemo() {
  return (
    <>
      <DemoSection title="默认">
        <Empty />
      </DemoSection>

      <DemoSection title="自定义描述">
        <Empty description="还没有任何设备采购计划" />
      </DemoSection>

      <DemoSection title="三档尺寸">
        <div class="demo-row">
          <Empty size="small" description="small" />
          <Empty size="medium" description="medium" />
          <Empty size="large" description="large" />
        </div>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Empty 空状态 API](../exports/empty.md)
- [设计 Token](../design/tokens.md)
