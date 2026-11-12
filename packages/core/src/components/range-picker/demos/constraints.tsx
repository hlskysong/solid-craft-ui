import { createSignal } from 'solid-js';
import { RangePicker } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '可选范围',
  description:
    'min / max 闭区间、disabledDate 自定义禁用（两端共用同一约束）、同日选择，以及错误与禁用态。',
};

export default function ConstraintsDemo() {
  const [stay, setStay] = createSignal<readonly [string, string]>(['2026-03-16', '2026-03-18']);

  return (
    <>
      <DemoSection title="min / max">
        <RangePicker min="2026-03-10" max="2026-03-20" aria-label="仅 3 月 10 至 20 日" />
      </DemoSection>

      <DemoSection title="自定义禁用（周末与已占用）">
        <RangePicker
          value={stay()}
          onChange={(value) => setStay(value)}
          disabledDate={(date) => date.day % 7 === 0 || date.day % 7 === 6}
          aria-label="不可选周末"
        />
        <span>
          当前值：<output>{stay()[0] === '' ? '（空）' : `${stay()[0]} 至 ${stay()[1]}`}</output>
        </span>
      </DemoSection>

      <DemoSection title="同日区间">
        <RangePicker defaultValue={['2026-03-15', '2026-03-15']} aria-label="同一天" />
      </DemoSection>

      <DemoSection title="状态">
        <RangePicker
          status="error"
          defaultValue={['2026-03-10', '2026-03-20']}
          aria-label="校验失败"
        />
        <RangePicker disabled defaultValue={['2026-03-10', '2026-03-20']} aria-label="禁用" />
      </DemoSection>
    </>
  );
}
