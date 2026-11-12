# Icon 图标 · 自定义图标与内联（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/icon/demos/custom.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

自带 SVG 直接嵌入、尺寸由 Icon 统一控制，以及按钮内的图标对齐。

## 完整源码

```tsx
import { For } from 'solid-js';
import { Button, Icon } from 'solid-craft';
import { DemoSection, SIZES } from '../../demos/shared';

export const demo = {
  title: '自定义图标与内联',
  description: '自带 SVG 直接嵌入、尺寸由 Icon 统一控制，以及按钮内的图标对齐。',
};

/** 自定义 SVG 只负责形状：宽高由 `Icon` 的 `size` 统一决定。 */
function Triangle() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 2 14 13H2Z" fill="currentColor" />
    </svg>
  );
}

export default function Custom() {
  return (
    <>
      <DemoSection title="自定义 SVG 与尺寸">
        <For each={SIZES}>
          {(size) => (
            <Icon size={size} label={`${size} 三角图标`}>
              <Triangle />
            </Icon>
          )}
        </For>
      </DemoSection>
      <DemoSection title="按钮内对齐">
        <Button>
          <Icon size="small">
            <Triangle />
          </Icon>
          导出
        </Button>
        <Button variant="outline">
          <Icon size="small">
            <Triangle />
          </Icon>
          复制
        </Button>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Icon 图标 API](../exports/icon.md)
- [设计 Token](../design/tokens.md)
