# Tag 标签 · 五种配色 × 四种形态（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/tag/demos/basic.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

配色走 data-scui-color（neutral 对应 TDesign 的 default，高饱和色只落在文字或底色）；形态走 data-scui-variant，对齐 dark / light / outline / light-outline 四档。

## 完整源码

```tsx
import { Tag, type TagColor, type TagVariant } from 'solid-craft';

import { COLORS, DemoSection } from '../../demos/shared';

export const demo = {
  title: '五种配色 × 四种形态',
  description:
    '配色走 data-scui-color（neutral 对应 TDesign 的 default，高饱和色只落在文字或底色）；形态走 data-scui-variant，对齐 dark / light / outline / light-outline 四档。',
};

const LABELS: Record<TagColor, string> = {
  primary: '进行中',
  neutral: '草稿',
  success: '已通过',
  warning: '待复核',
  danger: '已驳回',
};

const VARIANTS: { value: TagVariant; label: string }[] = [
  { value: 'dark', label: '深色' },
  { value: 'light', label: '浅色' },
  { value: 'outline', label: '描边' },
  { value: 'light-outline', label: '浅色描边' },
];

export default function TagBasicDemo() {
  return (
    <>
      {VARIANTS.map((variant) => (
        <DemoSection title={variant.label}>
          <div class="demo-row" data-testid={`tag-variant-${variant.value}`}>
            {COLORS.map((color) => (
              <Tag
                color={color}
                variant={variant.value}
                data-testid={`tag-${variant.value}-${color}`}
              >
                {LABELS[color]}
              </Tag>
            ))}
          </div>
        </DemoSection>
      ))}
    </>
  );
}
```

## 相关页面

- [Tag 标签 API](../exports/tag.md)
- [设计 Token](../design/tokens.md)
