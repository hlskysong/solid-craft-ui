import { For } from 'solid-js';
import { Button, Space } from 'solid-craft';
import { DemoSection, SIZES } from '../../demos/shared';

export const demo = {
  title: '间距档位',
  description: '三档间距在水平与垂直两个方向上的实际距离。',
};

export default function Sizes() {
  return (
    <>
      <DemoSection title="水平间距">
        <div class="demo-stack">
          <For each={SIZES}>
            {(size) => (
              <Space size={size}>
                <Button variant="outline">{`横向 ${size}`}</Button>
                <Button variant="outline">B</Button>
                <Button variant="outline">C</Button>
              </Space>
            )}
          </For>
        </div>
      </DemoSection>
      <DemoSection title="垂直间距">
        <Space direction="vertical" size="small">
          <Button variant="outline">small 垂直 1</Button>
          <Button variant="outline">small 垂直 2</Button>
        </Space>
        <Space direction="vertical" size="large">
          <Button variant="outline">large 垂直 1</Button>
          <Button variant="outline">large 垂直 2</Button>
        </Space>
      </DemoSection>
    </>
  );
}
