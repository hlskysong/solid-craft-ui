# Drawer 抽屉 · 打开态与方向切换（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/drawer/demos/open-state.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

首屏即打开，用于视觉基线与弹层态 axe 扫描；弹层内可切换四个贴边方向，关闭后可用背景按钮重新打开。

## 完整源码

```tsx
import { createSignal } from 'solid-js';
import { Button, Drawer, type DrawerPlacement } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '打开态与方向切换',
  description:
    '首屏即打开，用于视觉基线与弹层态 axe 扫描；弹层内可切换四个贴边方向，关闭后可用背景按钮重新打开。',
};

const SIDES: readonly DrawerPlacement[] = ['left', 'right', 'top', 'bottom'];

export default function DrawerOpenStateDemo() {
  const [open, setOpen] = createSignal(true);
  const [side, setSide] = createSignal<DrawerPlacement>('right');

  return (
    <>
      <DemoSection title="首屏打开">
        <Button variant="outline" onClick={() => setOpen(true)}>
          重新打开
        </Button>
        <Drawer
          title="打开态视觉基线"
          open={open()}
          placement={side()}
          onOpenChange={setOpen}
          footer={
            <Button variant="outline" color="neutral" onClick={() => setOpen(false)}>
              收起抽屉
            </Button>
          }
        >
          <p>遮罩、贴边容器、标题、正文与底部操作区在这一页同时参与基线截图。</p>
          <div class="demo-row">
            {SIDES.map((item) => (
              <Button variant="outline" color="neutral" onClick={() => setSide(item)}>
                {item}
              </Button>
            ))}
          </div>
          <p>当前方向：{side()}</p>
        </Drawer>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Drawer 抽屉 API](../exports/drawer.md)
- [设计 Token](../design/tokens.md)
