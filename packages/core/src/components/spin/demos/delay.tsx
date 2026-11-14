import { Button, Spin } from 'solid-craft';
import { createSignal } from 'solid-js';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '延迟显示',
  description: 'delay=400ms：请求很快回来时一次都不闪；超过 400ms 才出遮罩，避免短请求的闪烁抖动。',
};

export default function SpinDelayDemo() {
  const [spinning, setSpinning] = createSignal(false);

  return (
    <DemoSection title="延迟 400ms">
      <Spin spinning={spinning()} delay={400} tip="正在加载" style="min-height: 88px">
        <div data-testid="delay-content">设备采购明细</div>
      </Spin>
      <div class="demo-row">
        <Button onClick={() => setSpinning(true)}>开始加载</Button>
        <Button onClick={() => setSpinning(false)}>立即结束</Button>
      </div>
    </DemoSection>
  );
}
