import { Empty } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description: '默认插画 + 默认文案；三档尺寸按容器宽度选，不改变文案排版。',
};

export default function EmptyBasicDemo() {
  return (
    <>
      <DemoSection title="默认">
        <Empty />
      </DemoSection>

      <DemoSection title="自定义描述">
        <Empty description="还没有任何设备采购计划" />
      </DemoSection>

      <DemoSection title="三档尺寸">
        <div class="demo-row">
          <Empty size="small" description="small" />
          <Empty size="medium" description="medium" />
          <Empty size="large" description="large" />
        </div>
      </DemoSection>
    </>
  );
}
