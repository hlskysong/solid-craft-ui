import { Skeleton } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '微光动画',
  description: 'active 开启微光；系统开启「减弱动效」时自动静止，不靠 JS 判断。',
};

export default function SkeletonActiveDemo() {
  return (
    <>
      <DemoSection title="段落微光">
        <Skeleton active rows={4} />
      </DemoSection>

      <DemoSection title="卡片微光">
        <Skeleton active variant="card" rows={3} />
      </DemoSection>

      <DemoSection title="表格微光">
        <Skeleton active variant="table" rows={3} />
      </DemoSection>
    </>
  );
}
