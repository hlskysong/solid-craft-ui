# DatePicker 日期选择 · 基础用法（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/date-picker/demos/basic.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

非受控与受控两种取值方式、显示格式、清除与三档尺寸。

## 完整源码

```tsx
import { createSignal } from 'solid-js';
import { DatePicker } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description: '非受控与受控两种取值方式、显示格式、清除与三档尺寸。',
};

export default function BasicDemo() {
  const [picked, setPicked] = createSignal('2026-03-15');
  const [signDate, setSignDate] = createSignal('2026-11-12');

  return (
    <>
      <DemoSection title="非受控与受控">
        <DatePicker
          defaultValue="2026-03-15"
          allowClear
          onChange={(iso) => setPicked(iso)}
          aria-label="入职日期（非受控）"
        />
        <span>
          当前值：<output>{picked() === '' ? '（空）' : picked()}</output>
        </span>
        <DatePicker
          value={signDate()}
          allowClear
          onChange={(iso) => setSignDate(iso)}
          aria-label="签署日期（受控）"
        />
        <span>
          当前值：<output>{signDate() === '' ? '（空）' : signDate()}</output>
        </span>
      </DemoSection>

      <DemoSection title="显示格式">
        <DatePicker defaultValue="2026-03-15" aria-label="默认 ISO 格式" />
        <DatePicker defaultValue="2026-03-15" format="YYYY年M月D日" aria-label="中文格式" />
        <DatePicker defaultValue="2026-03-15" format="YYYY/MM/DD" aria-label="斜杠格式" />
      </DemoSection>

      <DemoSection title="尺寸">
        <DatePicker size="small" defaultValue="2026-03-15" aria-label="small 尺寸" />
        <DatePicker size="medium" defaultValue="2026-03-15" aria-label="medium 尺寸" />
        <DatePicker size="large" defaultValue="2026-03-15" aria-label="large 尺寸" />
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [DatePicker 日期选择 API](../exports/date-picker.md)
- [设计 Token](../design/tokens.md)
