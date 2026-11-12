import { createSignal } from 'solid-js';
import { RadioGroup } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '受控状态',
  description: '受控 value 配合 onChange 回显，整组禁用时保持当前选中项。',
};

const SPEED_OPTIONS = [
  { label: '慢速', value: 'slow' },
  { label: '标准', value: 'standard' },
  { label: '快速', value: 'fast' },
];

export default function RadioStateDemo() {
  const [speed, setSpeed] = createSignal('standard');
  const speedLabel = () =>
    SPEED_OPTIONS.find((option) => option.value === speed())?.label ?? speed();

  return (
    <>
      <DemoSection title="受控值">
        <RadioGroup
          aria-label="运行速度"
          options={SPEED_OPTIONS}
          value={speed()}
          onChange={(value) => setSpeed(value)}
        />
        <span>
          当前速度：<output>{speedLabel()}</output>
        </span>
      </DemoSection>

      <DemoSection title="整组禁用">
        <RadioGroup
          aria-label="禁用的运行速度"
          options={SPEED_OPTIONS}
          defaultValue="fast"
          disabled
        />
      </DemoSection>
    </>
  );
}
