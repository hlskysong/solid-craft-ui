import { createSignal } from 'solid-js';
import { Button, Modal } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '焦点陷阱与归还',
  description:
    '打开后焦点被限制在弹层内循环；按 ESC 关闭时焦点会回到当初的触发按钮，而不是丢在 body 上。',
};

export default function ModalFocusDemo() {
  const [open, setOpen] = createSignal(false);

  return (
    <>
      <DemoSection title="键盘链路">
        <Button data-testid="modal-focus-trigger" onClick={() => setOpen(true)}>
          打开并检查焦点
        </Button>
        <Modal title="设备信息登记" open={open()} onOpenChange={setOpen} okText="保存">
          <label style="display: block; margin-block-end: 8px">
            计划名称
            <input data-testid="modal-focus-input" style="display: block" />
          </label>
          <label style="display: block">
            备注
            <input data-testid="modal-focus-note" style="display: block" />
          </label>
        </Modal>
      </DemoSection>
    </>
  );
}
