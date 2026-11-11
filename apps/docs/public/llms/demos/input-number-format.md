# Input 输入框 · 精度与格式化（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/input/demos/number-format.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

precision 控制小数位、thousands 展示千分位，以及受控值在失焦时被夹到 max。

## 完整源码

```tsx
import { createSignal } from 'solid-js';
import { InputNumber } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '精度与格式化',
  description: 'precision 控制小数位、thousands 展示千分位，以及受控值在失焦时被夹到 max。',
};

export default function NumberFormatDemo() {
  const [integer, setInteger] = createSignal<number | null>(42);
  const [price, setPrice] = createSignal<number | null>(1234.5);
  const [clamped, setClamped] = createSignal<number | null>(50);

  return (
    <>
      <DemoSection title="precision 取整（0 位）">
        <InputNumber
          precision={0}
          aria-label="取整数字"
          value={integer()}
          onChange={(value) => setInteger(value)}
        />
        <span>
          当前值：
          <output>{integer() ?? '空'}</output>
        </span>
      </DemoSection>

      <DemoSection title="precision 两位小数">
        <InputNumber precision={2} aria-label="两位小数" defaultValue={12.3456} />
        <InputNumber precision={2} step={0.01} aria-label="两位小数步进" defaultValue={9.99} />
        <span>输入与步进的结果都会被裁到 2 位小数。</span>
      </DemoSection>

      <DemoSection title="千分位">
        <InputNumber
          thousands
          aria-label="千分位金额"
          value={price()}
          onChange={(value) => setPrice(value)}
        />
        <span>
          当前值：
          <output>{price() ?? '空'}</output>，输入时可带逗号也可不带。
        </span>
        <InputNumber thousands precision={0} aria-label="千分位整数" defaultValue={1234567} />
      </DemoSection>

      <DemoSection title="失焦归一化">
        <InputNumber
          min={0}
          max={100}
          aria-label="0 到 100 的数字"
          value={clamped()}
          onChange={(value) => setClamped(value)}
        />
        <span>
          当前值：
          <output>{clamped() ?? '空'}</output>，输入 123 后失焦会被夹到 100。
        </span>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Input 输入框 API](../exports/input.md)
- [设计 Token](../design/tokens.md)
