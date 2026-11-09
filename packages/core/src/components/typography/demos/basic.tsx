import { For } from 'solid-js';
import { Link, Paragraph, Text, Title } from 'solid-craft';
import { DemoSection, LEVELS, SIZES } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description: '标题层级、文本修饰、字号语义色与段落 / 链接。',
};

export default function Basic() {
  return (
    <>
      <DemoSection title="标题层级">
        <For each={LEVELS}>{(level) => <Title level={level}>{`H${level} 标题`}</Title>}</For>
      </DemoSection>
      <DemoSection title="文本修饰">
        <Text bold>bold</Text>
        <Text underline>underline</Text>
        <Text delete>delete</Text>
        <Text mark>mark</Text>
        <Text code>code</Text>
        <Text ellipsis>ellipsis</Text>
      </DemoSection>
      <DemoSection title="字号与语义色">
        <For each={SIZES}>{(size) => <Text size={size}>{`size ${size}`}</Text>}</For>
        <Text tone="primary">primary</Text>
        <Text tone="secondary">secondary</Text>
        <Text tone="tertiary">tertiary</Text>
        <Text tone="danger">danger</Text>
      </DemoSection>
      <DemoSection title="段落与链接">
        <Paragraph>这是一段用于视觉基线的固定文本，不含随机内容与时间。</Paragraph>
        <Link href="#typography-anchor" data-testid="keyboard-link">
          跳转到锚点
        </Link>
      </DemoSection>
      <p id="typography-anchor">锚点目标</p>
    </>
  );
}
