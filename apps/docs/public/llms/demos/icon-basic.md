# Icon 图标 · 基础用法（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/icon/demos/basic.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

语义色图标、装饰图标与三档尺寸。

## 完整源码

```tsx
import { For } from 'solid-js';
import { Icon } from 'solid-craft';
import { DemoSection, DotIcon, SIZES } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description: '语义色图标、装饰图标与三档尺寸。',
};

export default function Basic() {
  return (
    <>
      <DemoSection title="语义图标">
        <Icon label="提示">
          <DotIcon />
        </Icon>
        <Icon label="成功" tone="success">
          <DotIcon />
        </Icon>
        <Icon label="警告" tone="warning">
          <DotIcon />
        </Icon>
      </DemoSection>
      <DemoSection title="装饰图标与尺寸">
        <For each={SIZES}>
          {(size) => (
            <Icon size={size}>
              <DotIcon />
            </Icon>
          )}
        </For>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Icon 图标 API](../exports/icon.md)
- [设计 Token](../design/tokens.md)
