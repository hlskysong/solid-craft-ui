# Drawer 抽屉 · 焦点陷阱与归还（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/drawer/demos/focus.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

与 Modal 共用 primitives/overlay 的焦点管理：打开后焦点限制在抽屉内循环，ESC 关闭后回到触发按钮。

## 完整源码

```tsx
import { createSignal } from 'solid-js';
import { Button, Drawer } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '焦点陷阱与归还',
  description:
    '与 Modal 共用 primitives/overlay 的焦点管理：打开后焦点限制在抽屉内循环，ESC 关闭后回到触发按钮。',
};

export default function DrawerFocusDemo() {
  const [open, setOpen] = createSignal(false);

  return (
    <>
      <DemoSection title="键盘链路">
        <Button data-testid="drawer-focus-trigger" onClick={() => setOpen(true)}>
          打开并检查焦点
        </Button>
        <Drawer title="设备信息登记" open={open()} onOpenChange={setOpen}>
          <label style="display: block; margin-block-end: 8px">
            计划名称
            <input data-testid="drawer-focus-input" style="display: block" />
          </label>
          <label style="display: block">
            备注
            <input data-testid="drawer-focus-note" style="display: block" />
          </label>
        </Drawer>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Drawer 抽屉 API](../exports/drawer.md)
- [设计 Token](../design/tokens.md)
