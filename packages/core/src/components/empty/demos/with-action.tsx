import { Button, Empty } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '带操作',
  description: 'children 落在描述下方，通常放一个主按钮；不传 children 时该区块不渲染。',
};

export default function EmptyWithActionDemo() {
  return (
    <>
      <DemoSection title="引导新建">
        <Empty description="还没有维简设备采购计划">
          <Button variant="solid">新建计划</Button>
        </Empty>
      </DemoSection>

      <DemoSection title="两个操作">
        <Empty description="当前筛选条件下没有匹配结果">
          <Button>清空筛选</Button>
          <Button variant="solid">新建记录</Button>
        </Empty>
      </DemoSection>
    </>
  );
}
