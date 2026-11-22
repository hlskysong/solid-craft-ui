# TimePicker 时间选择 · 格式与显示（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/time-picker/demos/format.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

12 / 24 小时制、带秒、自定义显示格式；显示变化不影响 24 小时制的值。

## 完整源码

```tsx
import { TimePicker } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '格式与显示',
  description: '12 / 24 小时制、带秒、自定义显示格式；显示变化不影响 24 小时制的值。',
};

export default function FormatDemo() {
  return (
    <>
      <DemoSection title="24 小时制">
        <TimePicker defaultValue="14:05" aria-label="24 小时制" />
        <TimePicker defaultValue="14:05:30" showSeconds aria-label="带秒" />
      </DemoSection>

      <DemoSection title="12 小时制">
        <TimePicker defaultValue="14:05" hour12 aria-label="12 小时制" />
        <TimePicker defaultValue="14:05:30" hour12 showSeconds aria-label="12 小时制带秒" />
      </DemoSection>

      <DemoSection title="自定义显示格式">
        <TimePicker defaultValue="14:05" format="H 时 mm 分" aria-label="中文格式" />
        <TimePicker defaultValue="14:05" hour12 format="A HH:mm" aria-label="上午下午格式" />
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [TimePicker 时间选择 API](../exports/time-picker.md)
- [设计 Token](../design/tokens.md)
