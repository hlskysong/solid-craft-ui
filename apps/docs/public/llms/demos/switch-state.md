# Switch 开关 · 受控状态（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/switch/demos/state.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

用 createSignal 控制开关状态，onChange 回显，并演示校验态。

## 完整源码

```tsx
import { createSignal } from 'solid-js';
import { Switch } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '受控状态',
  description: '用 createSignal 控制开关状态，onChange 回显，并演示校验态。',
};

export default function SwitchStateDemo() {
  const [enabled, setEnabled] = createSignal(true);
  const [strict, setStrict] = createSignal(false);

  return (
    <>
      <DemoSection title="受控开关">
        <Switch checked={enabled()} onChange={(checked) => setEnabled(checked)}>
          启用通知
        </Switch>
        <span>
          当前状态：<output>{enabled() ? '已开启' : '已关闭'}</output>
        </span>
      </DemoSection>

      <DemoSection title="校验态">
        <Switch checked={strict()} status="error" onChange={(checked) => setStrict(checked)}>
          严格模式
        </Switch>
        <span>
          当前状态：<output>{strict() ? '已开启' : '已关闭'}</output>
        </span>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Switch 开关 API](../exports/switch.md)
- [设计 Token](../design/tokens.md)
