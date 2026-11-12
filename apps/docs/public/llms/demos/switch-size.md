# Switch 开关 · 尺寸与禁用（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/switch/demos/size.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

small / medium / large 三档尺寸，以及禁用态下的开与关。

## 完整源码

```tsx
import { Switch } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '尺寸与禁用',
  description: 'small / medium / large 三档尺寸，以及禁用态下的开与关。',
};

export default function SwitchSizeDemo() {
  return (
    <>
      <DemoSection title="尺寸">
        <Switch size="small" defaultChecked>
          small
        </Switch>
        <Switch size="medium" defaultChecked>
          medium
        </Switch>
        <Switch size="large" defaultChecked>
          large
        </Switch>
      </DemoSection>

      <DemoSection title="禁用">
        <Switch disabled>禁用且关闭</Switch>
        <Switch disabled defaultChecked>
          禁用且开启
        </Switch>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Switch 开关 API](../exports/switch.md)
- [设计 Token](../design/tokens.md)
