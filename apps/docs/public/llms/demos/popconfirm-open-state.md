# Popconfirm 气泡确认 · 打开态视觉基线（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/popconfirm/demos/open-state.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

首屏受控打开，让确认气泡进入视觉基线与 axe 扫描；底部按钮组复用 Button 样式，随 popconfirm.css 一并聚合。

## 完整源码

```tsx
import { createSignal } from 'solid-js';
import { Button, Popconfirm } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '打开态视觉基线',
  description:
    '首屏受控打开，让确认气泡进入视觉基线与 axe 扫描；底部按钮组复用 Button 样式，随 popconfirm.css 一并聚合。',
};

export default function PopconfirmOpenStateDemo() {
  const [open, setOpen] = createSignal(true);

  return (
    <DemoSection title="打开态">
      <div class="demo-row">
        <Popconfirm
          title="确认删除这条采购明细？"
          description="删除后不可恢复，请确认本次采购数量与本次采购单价。"
          placement="bottom"
          open={open()}
          onOpenChange={setOpen}
          onOk={() => undefined}
        >
          删除明细
        </Popconfirm>
        <Button variant="outline" color="neutral" onClick={() => setOpen(true)}>
          重新打开
        </Button>
      </div>
      <p>气泡由 Portal 在客户端挂载，服务端只输出触发按钮静态骨架。</p>
    </DemoSection>
  );
}
```

## 相关页面

- [Popconfirm 气泡确认 API](../exports/popconfirm.md)
- [设计 Token](../design/tokens.md)
