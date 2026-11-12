# Radio 单选框 · 受控状态（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/radio/demos/state.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

受控 value 配合 onChange 回显，整组禁用时保持当前选中项。

## 完整源码

```tsx
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
```

## 相关页面

- [Radio 单选框 API](../exports/radio.md)
- [设计 Token](../design/tokens.md)
