# Button 按钮 · 变体与语义色（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/button/demos/variants.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

五种视觉变体与五种语义色可自由组合；默认变体为 solid、默认色为 primary。

## 完整源码

```tsx
import { For } from 'solid-js';
import { Button } from 'solid-craft';
import { COLORS, VARIANTS } from '../../demos/shared';

export const demo = {
  title: '变体与语义色',
  description: '五种视觉变体与五种语义色可自由组合；默认变体为 solid、默认色为 primary。',
};

export default function Variants() {
  return (
    <div class="demo-stack">
      <div class="demo-row">
        <For each={VARIANTS}>{(variant) => <Button variant={variant}>{variant}</Button>}</For>
      </div>
      <div class="demo-row">
        <For each={COLORS}>
          {(color) => (
            <Button variant="outline" color={color}>
              {color}
            </Button>
          )}
        </For>
      </div>
    </div>
  );
}
```

## 相关页面

- [Button 按钮 API](../exports/button.md)
- [设计 Token](../design/tokens.md)
