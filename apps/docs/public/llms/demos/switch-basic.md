# Switch 开关 · 基础用法（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/switch/demos/basic.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

开与关两种状态，可带文案；无文案时必须提供 aria-label。

## 完整源码

```tsx
import { Switch } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description: '开与关两种状态，可带文案；无文案时必须提供 aria-label。',
};

export default function SwitchBasicDemo() {
  return (
    <>
      <DemoSection title="开关状态">
        <Switch defaultChecked>已开启</Switch>
        <Switch>已关闭</Switch>
      </DemoSection>

      <DemoSection title="带文案">
        <Switch defaultChecked>接收系统通知</Switch>
        <Switch>自动更新</Switch>
      </DemoSection>

      <DemoSection title="无文案">
        <Switch aria-label="无文案开关（开）" defaultChecked />
        <Switch aria-label="无文案开关（关）" />
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Switch 开关 API](../exports/switch.md)
- [设计 Token](../design/tokens.md)
