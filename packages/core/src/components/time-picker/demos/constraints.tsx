import { TimePicker } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '可选范围',
  description: 'min / max 闭区间与 disabledTime 自定义禁用；手输越界同样被拒绝。',
};

export default function ConstraintsDemo() {
  return (
    <>
      <DemoSection title="时间区间">
        <TimePicker defaultValue="09:00" min="08:30" max="18:00" aria-label="工作时间" />
      </DemoSection>

      <DemoSection title="自定义禁用">
        <TimePicker
          defaultValue="10:00"
          disabledTime={(time) => time.hour >= 12 && time.hour < 13}
          aria-label="排除午休"
        />
        <TimePicker defaultValue="10:00" disabled aria-label="禁用" />
      </DemoSection>
    </>
  );
}
