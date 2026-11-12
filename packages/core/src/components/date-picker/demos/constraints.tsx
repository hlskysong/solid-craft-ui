import { createSignal } from 'solid-js';
import { DatePicker } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '可选范围',
  description: 'min / max 闭区间、disabledDate 自定义禁用，以及错误与禁用态。',
};

export default function ConstraintsDemo() {
  const [booked, setBooked] = createSignal('2026-03-16');

  return (
    <>
      <DemoSection title="min / max">
        <DatePicker
          min="2026-03-10"
          max="2026-03-20"
          defaultValue="2026-03-15"
          aria-label="仅 3 月 10 至 20 日"
        />
      </DemoSection>

      <DemoSection title="自定义禁用（周末与已占用）">
        <DatePicker
          value={booked()}
          onChange={(iso) => setBooked(iso)}
          disabledDate={(date) => date.day % 7 === 0 || date.day % 7 === 6}
          aria-label="不可选周末"
        />
        <span>
          当前值：<output>{booked() === '' ? '（空）' : booked()}</output>
        </span>
      </DemoSection>

      <DemoSection title="状态">
        <DatePicker status="error" defaultValue="2026-03-15" aria-label="校验失败" />
        <DatePicker disabled defaultValue="2026-03-15" aria-label="禁用" />
      </DemoSection>
    </>
  );
}
