# TimePicker 时间选择 · 基础用法（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/time-picker/demos/basic.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

非受控与受控两种取值方式、清除与三档尺寸；值为 24 小时制 HH:mm。

## 完整源码

```tsx
import { createSignal } from 'solid-js';
import { TimePicker } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description: '非受控与受控两种取值方式、清除与三档尺寸；值为 24 小时制 HH:mm。',
};

export default function BasicDemo() {
  const [picked, setPicked] = createSignal('09:30');

  return (
    <>
      <DemoSection title="非受控与受控">
        <TimePicker defaultValue="08:15" allowClear aria-label="上班时间（非受控）" />
        <TimePicker
          value={picked()}
          allowClear
          onChange={setPicked}
          aria-label="会议时间（受控）"
        />
        <span>
          当前值：<output>{picked() === '' ? '（空）' : picked()}</output>
        </span>
      </DemoSection>

      <DemoSection title="尺寸">
        <TimePicker size="small" defaultValue="08:15" aria-label="small 尺寸" />
        <TimePicker size="medium" defaultValue="08:15" aria-label="medium 尺寸" />
        <TimePicker size="large" defaultValue="08:15" aria-label="large 尺寸" />
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [TimePicker 时间选择 API](../exports/time-picker.md)
- [设计 Token](../design/tokens.md)
