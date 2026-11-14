import { Spin } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '独立使用',
  description: '不传 children 时是独立转圈；三档尺寸 + 可选文案。',
};

export default function SpinBasicDemo() {
  return (
    <>
      <DemoSection title="三档尺寸">
        <div class="demo-row">
          <Spin size="small" />
          <Spin />
          <Spin size="large" />
        </div>
      </DemoSection>

      <DemoSection title="带文案">
        <Spin tip="正在加载设备清单" />
      </DemoSection>
    </>
  );
}
