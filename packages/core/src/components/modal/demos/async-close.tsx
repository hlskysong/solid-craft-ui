import { createSignal } from 'solid-js';
import { Button, Modal } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '异步关闭',
  description:
    'onOk 返回 Promise 时进入等待态：确认按钮转圈、取消与右上关闭禁用、ESC 与遮罩点击被拦截，重复点击不会再发一次请求。',
};

/** 模拟一次 900ms 的提交请求；真实业务里换成接口调用即可。 */
function submit(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 900);
  });
}

export default function ModalAsyncCloseDemo() {
  const [open, setOpen] = createSignal(false);
  const [submits, setSubmits] = createSignal(0);
  const [log, setLog] = createSignal('尚未提交');

  const onOk = (): Promise<void> => {
    setSubmits((count) => count + 1);
    setLog('提交中…');
    return submit().then(() => {
      setLog('提交完成');
    });
  };

  return (
    <>
      <DemoSection title="异步确认">
        <Button onClick={() => setOpen(true)}>打开并提交</Button>
        <output data-testid="modal-submit-count" style="margin-inline-start: 12px">
          请求次数：{submits()}
        </output>
        <output data-testid="modal-submit-log" style="margin-inline-start: 12px">
          {log()}
        </output>
        <Modal
          title="确认提交采购计划"
          open={open()}
          onOpenChange={setOpen}
          onOk={onOk}
          okText="提交审批"
        >
          <p>提交后计划将锁定，等待期内请重复点击「提交审批」验证防重。</p>
        </Modal>
      </DemoSection>
    </>
  );
}
