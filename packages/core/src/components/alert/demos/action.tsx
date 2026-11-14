import { Alert, Button, message } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '操作区与全局反馈接入',
  description:
    'Alert 的操作区放常规按钮；点击后通过 T2-06 的静态 message 通道给出全局提示——不新建 Message 组件，也不依赖组件树。',
};

export default function AlertActionDemo() {
  return (
    <DemoSection title="操作区">
      <div class="demo-column">
        <Alert
          kind="warning"
          title="待复核的采购明细"
          description="共 3 条明细未复核，处理后会通过全局反馈告知结果。"
          action={
            <Button
              variant="outline"
              color="neutral"
              onClick={() => void message.success('已提交复核')}
            >
              提交复核
            </Button>
          }
        />
        <Alert
          kind="info"
          title="需要帮助"
          description="操作区不传时整块不渲染，不会留下空盒子。"
        />
      </div>
    </DemoSection>
  );
}
