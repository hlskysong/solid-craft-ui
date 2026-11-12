# RangePicker 日期范围 · 格式与尺寸（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/range-picker/demos/format.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

格式与分隔文案两端共用，三档尺寸与清除按钮。

## 完整源码

```tsx
import { RangePicker } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '格式与尺寸',
  description: '格式与分隔文案两端共用，三档尺寸与清除按钮。',
};

export default function Format() {
  return (
    <>
      <DemoSection title="自定义格式">
        <RangePicker
          format="MM/DD"
          defaultValue={['2026-03-10', '2026-03-20']}
          aria-label="短格式区间"
        />
        <RangePicker
          format="YYYY年M月D日"
          defaultValue={['2026-03-10', '2026-03-20']}
          aria-label="中文格式区间"
        />
      </DemoSection>
      <DemoSection title="自定义分隔与占位">
        <RangePicker
          separator="～"
          startPlaceholder="入住"
          endPlaceholder="离店"
          aria-label="自定义分隔"
        />
        <RangePicker separator="→" defaultValue={['2026-03-10', '2026-03-14']} aria-label="箭头" />
      </DemoSection>
      <DemoSection title="尺寸">
        <RangePicker size="small" defaultValue={['2026-03-10', '2026-03-20']} aria-label="小尺寸" />
        <RangePicker size="large" defaultValue={['2026-03-10', '2026-03-20']} aria-label="大尺寸" />
      </DemoSection>
      <DemoSection title="可清除">
        <RangePicker allowClear defaultValue={['2026-03-10', '2026-03-20']} aria-label="可清除" />
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [RangePicker 日期范围 API](../exports/range-picker.md)
- [设计 Token](../design/tokens.md)
