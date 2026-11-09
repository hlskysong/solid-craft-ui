import { For } from 'solid-js';
import { Icon } from 'solid-craft';
import { DemoSection, DotIcon, SIZES } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description: '语义色图标、装饰图标与三档尺寸。',
};

export default function Basic() {
  return (
    <>
      <DemoSection title="语义图标">
        <Icon label="提示">
          <DotIcon />
        </Icon>
        <Icon label="成功" tone="success">
          <DotIcon />
        </Icon>
        <Icon label="警告" tone="warning">
          <DotIcon />
        </Icon>
      </DemoSection>
      <DemoSection title="装饰图标与尺寸">
        <For each={SIZES}>
          {(size) => (
            <Icon size={size}>
              <DotIcon />
            </Icon>
          )}
        </For>
      </DemoSection>
    </>
  );
}
