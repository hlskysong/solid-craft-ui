# Icon 图标 · 语义色与旋转（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/icon/demos/tones.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

七档语义色一次对照，以及 spin 在加载态里的用法。

## 完整源码

```tsx
import {
  Activity,
  Bell,
  ChartColumn,
  Folder,
  House,
  Loader,
  Search,
  Star,
} from 'solid-craft-icons';
import { For, type Component } from 'solid-js';
import { Icon } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

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

/** 按 tone 建索引而不是按下标取数组：`noUncheckedIndexedAccess` 下后者会带 undefined。 */
const TONE_ICONS: Record<(typeof TONES)[number], Component> = {
  primary: House,
  secondary: Search,
  tertiary: Star,
  disabled: Folder,
  success: Activity,
  warning: Bell,
  danger: ChartColumn,
};

export default function Tones() {
  return (
    <>
      <DemoSection title="语义色">
        <For each={TONES}>
          {(tone) => {
            const Glyph = TONE_ICONS[tone];
            return (
              <Icon tone={tone} label={`${tone} 图标`}>
                <Glyph />
              </Icon>
            );
          }}
        </For>
      </DemoSection>
      <DemoSection title="加载旋转">
        <Icon spin label="正在加载">
          <Loader />
        </Icon>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Icon 图标 API](../exports/icon.md)
- [设计 Token](../design/tokens.md)
