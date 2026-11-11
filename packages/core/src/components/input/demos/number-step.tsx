import { createSignal } from 'solid-js';
import { InputNumber } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '步进与范围',
  description:
    '小数步进 0.1、十位步进 10、min / max 到界后按钮置灰，以及 createSignal 驱动的受控写法。',
};

export default function NumberStepDemo() {
  const [decimal, setDecimal] = createSignal<number | null>(0);
  const [count, setCount] = createSignal<number | null>(5);

  return (
    <>
      <DemoSection title="小数步进 0.1">
        <InputNumber
          step={0.1}
          aria-label="小数步进"
          value={decimal()}
          onChange={(value) => setDecimal(value)}
        />
        <span>
          当前值：
          <output>{decimal() ?? '空'}</output>，连点 3 次上箭头得到 0.3。
        </span>
      </DemoSection>

      <DemoSection title="十位步进 10">
        <InputNumber step={10} aria-label="十位步进" defaultValue={100} />
        <span>每次步进 10，适合以十为单位调整的数量。</span>
      </DemoSection>

      <DemoSection title="到达上下界后按钮禁用">
        <InputNumber min={0} max={10} aria-label="已到上界的数字" defaultValue={10} />
        <InputNumber min={0} max={10} aria-label="已到下界的数字" defaultValue={0} />
        <span>到达 min / max 后对应按钮变灰禁用，避免「点了没反应」。</span>
      </DemoSection>

      <DemoSection title="受控用法">
        <InputNumber
          min={0}
          max={20}
          aria-label="受控数字"
          value={count()}
          onChange={(value) => setCount(value)}
        />
        <span>
          当前值：
          <output>{count() ?? '空'}</output>
        </span>
        <button type="button" onClick={() => setCount(20)}>
          设为 20
        </button>
      </DemoSection>
    </>
  );
}
