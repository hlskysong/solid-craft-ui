# Space 间距 · 交叉轴对齐（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/space/demos/cross-align.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

四种 align 在高度不一致的子项上如何对齐。

## 完整源码

```tsx
import { For } from 'solid-js';
import { Space, Text } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '交叉轴对齐',
  description: '四种 align 在高度不一致的子项上如何对齐。',
};

const ALIGNS = ['start', 'center', 'end', 'baseline'] as const;

/** 用不同字号撑出高度差，让 align 的差异肉眼可见。 */
function Box(props: { size: 'small' | 'medium' | 'large'; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        'align-items': 'center',
        padding: '4px 8px',
        border: '1px solid #d9d9d9',
        'background-color': '#fafafa',
      }}
    >
      <Text size={props.size}>{props.label}</Text>
    </span>
  );
}

export default function CrossAlign() {
  return (
    <DemoSection title="align">
      <div class="demo-stack">
        <For each={ALIGNS}>
          {(align) => (
            <Space align={align} size="small">
              <Box size="small" label={`${align} · small`} />
              <Box size="large" label={`${align} · large`} />
              <Box size="medium" label={`${align} · medium`} />
            </Space>
          )}
        </For>
      </div>
    </DemoSection>
  );
}
```

## 相关页面

- [Space 间距 API](../exports/space.md)
- [设计 Token](../design/tokens.md)
