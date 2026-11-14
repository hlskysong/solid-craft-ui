import { createSignal } from 'solid-js';
import { message, Popconfirm } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '异步确认与全局反馈接入',
  description:
    'onOk 返回 Promise 期间进入 pending：确认按钮 loading、取消禁用、ESC 与外部点击被拦；resolve 后关闭并调用 T2-06 的静态 message。',
};

export default function PopconfirmBasicDemo() {
  const [count, setCount] = createSignal(0);
  const [log, setLog] = createSignal('等待操作');

  const submit = (): Promise<void> =>
    new Promise((resolve) => {
      setLog('提交中');
      setTimeout(() => {
        setCount(count() + 1);
        setLog('提交完成');
        void message.success('已删除采购明细');
        resolve();
      }, 900);
    });

  return (
    <>
      <DemoSection title="删除确认">
        <Popconfirm
          title="确认删除这条采购明细？"
          description="删除后不可恢复。提交期间所有关闭入口都会失效。"
          placement="right"
          onOk={submit}
          onCancel={() => {
            setLog('已取消');
            void message.info('已取消删除');
          }}
        >
          删除明细
        </Popconfirm>
      </DemoSection>

      <DemoSection title="状态出口">
        <p data-testid="popconfirm-submit-count">累计提交 {count()} 次</p>
        <p data-testid="popconfirm-submit-log">当前状态：{log()}</p>
      </DemoSection>
    </>
  );
}
