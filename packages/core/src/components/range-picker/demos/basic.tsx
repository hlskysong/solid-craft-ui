import { createSignal } from 'solid-js';
import { RangePicker } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description:
    '非受控与受控两种取值方式、显示格式、三档尺寸。选完起点后悬停任意日期即可预览区间，移出日历回到单点。',
};

export default function BasicDemo() {
  const [trip, setTrip] = createSignal<readonly [string, string]>(['2026-03-10', '2026-03-20']);
  const [contract, setContract] = createSignal<readonly [string, string]>([
    '2026-11-01',
    '2027-01-31',
  ]);

  const text = (value: readonly [string, string]) =>
    value[0] === '' ? '（空）' : `${value[0]} 至 ${value[1]}`;

  return (
    <>
      <DemoSection title="非受控与受控">
        <RangePicker
          defaultValue={['2026-03-10', '2026-03-20']}
          allowClear
          aria-label="出差日期范围"
          onChange={(value) => setTrip(value)}
        />
        <span>
          当前值：<output>{text(trip())}</output>
        </span>
        <RangePicker
          value={contract()}
          allowClear
          aria-label="合同有效期"
          onChange={(value) => setContract(value)}
        />
        <span>
          当前值：<output>{text(contract())}</output>
        </span>
      </DemoSection>

      <DemoSection title="显示格式">
        <RangePicker defaultValue={['2026-03-10', '2026-03-20']} aria-label="默认 ISO 格式" />
        <RangePicker
          defaultValue={['2026-03-10', '2026-03-20']}
          format="YYYY年M月D日"
          aria-label="中文格式"
        />
        <RangePicker
          defaultValue={['2026-03-10', '2026-03-20']}
          format="YYYY/MM/DD"
          aria-label="斜杠格式"
        />
      </DemoSection>

      <DemoSection title="尺寸">
        <RangePicker
          size="small"
          defaultValue={['2026-03-10', '2026-03-20']}
          aria-label="small 尺寸"
        />
        <RangePicker
          size="medium"
          defaultValue={['2026-03-10', '2026-03-20']}
          aria-label="medium 尺寸"
        />
        <RangePicker
          size="large"
          defaultValue={['2026-03-10', '2026-03-20']}
          aria-label="large 尺寸"
        />
      </DemoSection>
    </>
  );
}
