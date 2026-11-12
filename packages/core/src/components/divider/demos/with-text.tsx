import { Divider, Text } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '带文字分割',
  description: 'plain 与默认字重的对比，以及虚线 + 文字的组合。',
};

export default function WithText() {
  return (
    <DemoSection title="文字分割线">
      <div class="demo-stack">
        <Text>设备基本信息</Text>
        <Divider>基本信息</Divider>
        <Divider plain>普通字重（plain）</Divider>
        <Divider dashed>虚线 + 文字</Divider>
        <Divider dashed plain>
          虚线 + 普通字重
        </Divider>
        <Text>维检记录</Text>
      </div>
    </DemoSection>
  );
}
