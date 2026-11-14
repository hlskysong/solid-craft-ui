# Spin 加载中 · 独立使用（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/spin/demos/basic.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

不传 children 时是独立转圈；三档尺寸 + 可选文案。

## 完整源码

```tsx
import { Spin } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '独立使用',
  description: '不传 children 时是独立转圈；三档尺寸 + 可选文案。',
};

export default function SpinBasicDemo() {
  return (
    <>
      <DemoSection title="三档尺寸">
        <div class="demo-row">
          <Spin size="small" />
          <Spin />
          <Spin size="large" />
        </div>
      </DemoSection>

      <DemoSection title="带文案">
        <Spin tip="正在加载设备清单" />
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Spin 加载中 API](../exports/spin.md)
- [设计 Token](../design/tokens.md)
