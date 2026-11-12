# DatePicker 日期选择 · 格式与尺寸（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/date-picker/demos/format.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

format 的 token 子集、三档尺寸与清除按钮。

## 完整源码

```tsx
import { DatePicker } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '格式与尺寸',
  description: 'format 的 token 子集、三档尺寸与清除按钮。',
};

export default function Format() {
  return (
    <>
      <DemoSection title="自定义格式">
        <DatePicker format="YYYY年M月D日" defaultValue="2026-03-15" aria-label="中文格式" />
        <DatePicker format="MM/DD" defaultValue="2026-03-15" aria-label="短格式" />
      </DemoSection>
      <DemoSection title="尺寸">
        <DatePicker size="small" defaultValue="2026-03-15" aria-label="小尺寸" />
        <DatePicker size="medium" defaultValue="2026-03-15" aria-label="中尺寸" />
        <DatePicker size="large" defaultValue="2026-03-15" aria-label="大尺寸" />
      </DemoSection>
      <DemoSection title="可清除">
        <DatePicker allowClear defaultValue="2026-03-15" aria-label="可清除" />
        <DatePicker allowClear placeholder="请选择日期" aria-label="空值可清除" />
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [DatePicker 日期选择 API](../exports/date-picker.md)
- [设计 Token](../design/tokens.md)
