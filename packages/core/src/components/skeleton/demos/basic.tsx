import { Skeleton } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '五种形状',
  description: 'text / card / table / button / avatar；行数与形状都走单一 variant 开关。',
};

export default function SkeletonBasicDemo() {
  return (
    <>
      <DemoSection title="段落">
        <Skeleton />
      </DemoSection>

      <DemoSection title="卡片">
        <Skeleton variant="card" rows={2} />
      </DemoSection>

      <DemoSection title="表格">
        <Skeleton variant="table" rows={4} />
      </DemoSection>

      <DemoSection title="按钮与头像">
        <div class="demo-row">
          <Skeleton variant="avatar" />
          <Skeleton variant="button" />
        </div>
      </DemoSection>
    </>
  );
}
