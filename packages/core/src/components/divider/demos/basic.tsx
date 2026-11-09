import { Divider, Text } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description: '水平 / 垂直分割线、虚线与带文字分割。',
};

export default function Basic() {
  return (
    <>
      <DemoSection title="水平分割线">
        <div class="demo-stack">
          <Text>上方内容</Text>
          <Divider />
          <Text>下方内容</Text>
          <Divider dashed>虚线分割</Divider>
          <Divider plain>带文字分割</Divider>
        </div>
      </DemoSection>
      <DemoSection title="垂直分割线">
        <div class="demo-inline">
          <Text>左</Text>
          <Divider orientation="vertical" />
          <Text>中</Text>
          <Divider orientation="vertical" dashed />
          <Text>右</Text>
        </div>
      </DemoSection>
    </>
  );
}
