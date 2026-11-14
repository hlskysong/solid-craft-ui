# Modal 对话框 · 打开态与尺寸（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/modal/demos/open-state.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

首屏即打开，用于视觉基线与弹层态 axe 扫描；点底部按钮切换三档尺寸，关闭后可用背景按钮重新打开。

## 完整源码

```tsx
import { createSignal } from 'solid-js';
import { Button, Modal, type ModalSize } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '打开态与尺寸',
  description:
    '首屏即打开，用于视觉基线与弹层态 axe 扫描；点底部按钮切换三档尺寸，关闭后可用背景按钮重新打开。',
};

const SIZES: readonly ModalSize[] = ['small', 'medium', 'large'];

export default function ModalOpenStateDemo() {
  const [open, setOpen] = createSignal(true);
  const [size, setSize] = createSignal<ModalSize>('medium');

  return (
    <>
      <DemoSection title="首屏打开">
        <Button variant="outline" onClick={() => setOpen(true)}>
          重新打开
        </Button>
        <Modal title="打开态视觉基线" open={open()} size={size()} onOpenChange={setOpen}>
          <p>遮罩、内容、标题、正文与默认底部操作区在这一页同时参与基线截图。</p>
          <div class="demo-row">
            {SIZES.map((item) => (
              <Button variant="outline" color="neutral" onClick={() => setSize(item)}>
                {item}
              </Button>
            ))}
          </div>
          <p>当前尺寸：{size()}</p>
        </Modal>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Modal 对话框 API](../exports/modal.md)
- [设计 Token](../design/tokens.md)
