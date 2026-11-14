# Empty 空状态 · 带操作（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/empty/demos/with-action.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

children 落在描述下方，通常放一个主按钮；不传 children 时该区块不渲染。

## 完整源码

```tsx
import { Button, Empty } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '带操作',
  description: 'children 落在描述下方，通常放一个主按钮；不传 children 时该区块不渲染。',
};

export default function EmptyWithActionDemo() {
  return (
    <>
      <DemoSection title="引导新建">
        <Empty description="还没有维简设备采购计划">
          <Button variant="solid">新建计划</Button>
        </Empty>
      </DemoSection>

      <DemoSection title="两个操作">
        <Empty description="当前筛选条件下没有匹配结果">
          <Button>清空筛选</Button>
          <Button variant="solid">新建记录</Button>
        </Empty>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Empty 空状态 API](../exports/empty.md)
- [设计 Token](../design/tokens.md)
