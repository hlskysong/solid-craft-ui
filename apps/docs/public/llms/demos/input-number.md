# Input 输入框 · 数字输入框（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/input/demos/number.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

默认 1 步进、三档尺寸、禁用态、单位前后缀与关闭步进按钮。

## 完整源码

```tsx
import { createSignal } from 'solid-js';
import { InputNumber } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '数字输入框',
  description: '默认 1 步进、三档尺寸、禁用态、单位前后缀与关闭步进按钮。',
};

export default function NumberDemo() {
  const [amount, setAmount] = createSignal<number | null>(128);
  const [ratio, setRatio] = createSignal<number | null>(80);

  return (
    <>
      <DemoSection title="基础用法">
        <InputNumber aria-label="基础数字" defaultValue={1} />
        <InputNumber aria-label="带初始值的数字" defaultValue={10} />
        <InputNumber aria-label="空值数字" placeholder="请输入数字" />
        <span>默认步进为 1，点右侧上下按钮或按 ↑ / ↓ 键即可增减。</span>
      </DemoSection>

      <DemoSection title="尺寸">
        <InputNumber size="small" aria-label="small 尺寸数字" defaultValue={1} />
        <InputNumber size="medium" aria-label="medium 尺寸数字" defaultValue={1} />
        <InputNumber size="large" aria-label="large 尺寸数字" defaultValue={1} />
      </DemoSection>

      <DemoSection title="禁用">
        <InputNumber disabled aria-label="禁用态数字" defaultValue={5} />
        <InputNumber disabled aria-label="禁用且为空的数字" placeholder="禁用占位文案" />
      </DemoSection>

      <DemoSection title="前后缀单位">
        <InputNumber
          prefix="¥"
          suffix="元"
          aria-label="金额"
          value={amount()}
          onChange={(value) => setAmount(value)}
        />
        <InputNumber
          suffix="%"
          min={0}
          max={100}
          aria-label="百分比"
          value={ratio()}
          onChange={(value) => setRatio(value)}
        />
        <span>
          当前金额：
          <output>{amount() ?? '空'}</output> 元，当前百分比：
          <output>{ratio() ?? '空'}</output>%
        </span>
      </DemoSection>

      <DemoSection title="关闭步进按钮">
        <InputNumber controls={false} aria-label="关闭步进按钮的数字" defaultValue={42} />
        <span>关闭后不再渲染上下按钮，但仍可用 ↑ / ↓ 键步进。</span>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Input 输入框 API](../exports/input.md)
- [设计 Token](../design/tokens.md)
