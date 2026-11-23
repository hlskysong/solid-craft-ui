import { CircleAlert, CircleCheck, Info, Star } from 'solid-craft-icons';
import { For } from 'solid-js';
import { Icon } from 'solid-craft';
import { DemoSection, SIZES } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description: '语义色图标、装饰图标与三档尺寸。',
};

export default function Basic() {
  return (
    <>
      <DemoSection title="语义图标">
        <Icon label="提示">
          <Info />
        </Icon>
        <Icon label="成功" tone="success">
          <CircleCheck />
        </Icon>
        <Icon label="警告" tone="warning">
          <CircleAlert />
        </Icon>
      </DemoSection>
      <DemoSection title="装饰图标与尺寸">
        <For each={SIZES}>
          {(size) => (
            <Icon size={size}>
              <Star />
            </Icon>
          )}
        </For>
      </DemoSection>
    </>
  );
}
