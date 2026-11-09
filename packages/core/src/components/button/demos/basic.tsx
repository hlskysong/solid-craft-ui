import { createSignal, For } from 'solid-js';
import { Button } from 'solid-craft';
import { COLORS, DemoSection, DotIcon, SIZES, VARIANTS } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description: '变体、语义色、尺寸形状、状态与点击 / 键盘交互的完整基线。',
};

export default function Basic() {
  const [clicks, setClicks] = createSignal(0);
  const [keyboardClicks, setKeyboardClicks] = createSignal(0);

  return (
    <>
      <DemoSection title="变体">
        <For each={VARIANTS}>
          {(variant, index) => (
            <Button data-testid={index() === 0 ? 'first-focusable' : undefined} variant={variant}>
              {`variant ${variant}`}
            </Button>
          )}
        </For>
      </DemoSection>
      <DemoSection title="语义色">
        <For each={COLORS}>{(color) => <Button color={color}>{`color ${color}`}</Button>}</For>
      </DemoSection>
      <DemoSection title="尺寸与形状">
        <For each={SIZES}>{(size) => <Button size={size}>{`size ${size}`}</Button>}</For>
        <Button shape="round">round</Button>
        <Button shape="circle" aria-label="圆形按钮" icon={<DotIcon />} />
      </DemoSection>
      <DemoSection title="状态">
        <Button disabled>disabled</Button>
        <Button loading>loading</Button>
        <Button block>block</Button>
      </DemoSection>
      <DemoSection title="交互与默认色">
        <Button data-testid="click-target" onClick={() => setClicks((n) => n + 1)}>
          计数按钮
        </Button>
        <Button data-testid="keyboard-target" onClick={() => setKeyboardClicks((n) => n + 1)}>
          键盘按钮
        </Button>
        <Button data-testid="default-primary">默认主色</Button>
        <span>
          点击 <output data-testid="click-count">{clicks()}</output> 次 / 键盘{' '}
          <output data-testid="keyboard-count">{keyboardClicks()}</output> 次
        </span>
      </DemoSection>
    </>
  );
}
