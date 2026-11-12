# Icon 图标 · 语义色与旋转（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/icon/demos/tones.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

七档语义色一次对照，以及 spin 在加载态里的用法。

## 完整源码

```tsx
import { For } from 'solid-js';
import { Icon } from 'solid-craft';
import { DemoSection, DotIcon } from '../../demos/shared';

export const demo = {
  title: '语义色与旋转',
  description: '七档语义色一次对照，以及 spin 在加载态里的用法。',
};

/** 顺序与 `IconProps['tone']` 的声明顺序一致；`as const` 让取值不接受拼错。 */
const TONES = [
  'primary',
  'secondary',
  'tertiary',
  'disabled',
  'success',
  'warning',
  'danger',
] as const;

export default function Tones() {
  return (
    <>
      <DemoSection title="语义色">
        <For each={TONES}>
          {(tone) => (
            <Icon tone={tone} label={`${tone} 图标`}>
              <DotIcon />
            </Icon>
          )}
        </For>
      </DemoSection>
      <DemoSection title="加载旋转">
        <Icon spin label="正在加载">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path
              d="M8 1.5A6.5 6.5 0 1 1 1.5 8"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </Icon>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Icon 图标 API](../exports/icon.md)
- [设计 Token](../design/tokens.md)
