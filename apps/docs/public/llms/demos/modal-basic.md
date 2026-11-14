# Modal 对话框 · 基础用法（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/modal/demos/basic.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

外部按钮受控打开；默认底部是「取消 / 确定」。三档尺寸共用同一套交互，显式 width 可覆盖尺寸档位。

## 完整源码

```tsx
import { createSignal } from 'solid-js';
import { Button, Modal, type ModalSize } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description:
    '外部按钮受控打开；默认底部是「取消 / 确定」。三档尺寸共用同一套交互，显式 width 可覆盖尺寸档位。',
};

export default function ModalBasicDemo() {
  const [open, setOpen] = createSignal(false);
  const [size, setSize] = createSignal<ModalSize>('medium');
  const [customOpen, setCustomOpen] = createSignal(false);

  const openWith = (next: ModalSize) => {
    setSize(next);
    setOpen(true);
  };

  return (
    <>
      <DemoSection title="三档尺寸">
        <div class="demo-row">
          <Button variant="outline" onClick={() => openWith('small')}>
            打开 small
          </Button>
          <Button variant="outline" onClick={() => openWith('medium')}>
            打开 medium
          </Button>
          <Button variant="outline" onClick={() => openWith('large')}>
            打开 large
          </Button>
        </div>
        <Modal title="新增设备采购计划" open={open()} size={size()} onOpenChange={setOpen}>
          <p>按年度维简计划填写本次采购数量与本次采购单价，提交后进入审批流。</p>
          <p>当前尺寸：{size()}</p>
        </Modal>
      </DemoSection>

      <DemoSection title="自定义宽度与 footer">
        <Button variant="outline" onClick={() => setCustomOpen(true)}>
          打开纯展示对话框
        </Button>
        <Modal
          title="采购明细说明"
          open={customOpen()}
          width="60vw"
          onOpenChange={setCustomOpen}
          footer={null}
        >
          <p>纯展示场景可以去掉底部按钮，只保留右上角关闭按钮。</p>
        </Modal>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Modal 对话框 API](../exports/modal.md)
- [设计 Token](../design/tokens.md)
