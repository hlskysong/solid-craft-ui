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
