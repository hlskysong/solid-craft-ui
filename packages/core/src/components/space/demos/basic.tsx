import { For } from 'solid-js';
import { Button, Divider, Space, Text } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description: '水平 / 垂直排列、分隔线与换行对齐。',
};

export default function Basic() {
  return (
    <>
      <DemoSection title="水平 / 垂直">
        <Space size="small">
          <Button>small</Button>
          <Button>A</Button>
          <Button>B</Button>
        </Space>
        <Space direction="vertical" size="large">
          <Button>vertical 1</Button>
          <Button>vertical 2</Button>
        </Space>
      </DemoSection>
      <DemoSection title="分隔与对齐">
        <Space split={<Divider orientation="vertical" />} align="center">
          <Text>one</Text>
          <Text>two</Text>
          <Text>three</Text>
        </Space>
        <Space wrap>
          <For each={[1, 2, 3, 4, 5, 6]}>
            {(index) => <Button variant="outline">{`wrap ${index}`}</Button>}
          </For>
        </Space>
      </DemoSection>
    </>
  );
}
