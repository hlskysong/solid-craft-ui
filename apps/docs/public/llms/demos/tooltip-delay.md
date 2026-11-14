# Tooltip 文字提示 · 打开与关闭延迟（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/tooltip/demos/delay.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

openDelay / closeDelay 直接透传给锚定原语，由 Kobalte 的 hover 时序统一执行；onOpenChange 是唯一状态出口。

## 完整源码

```tsx
import { createSignal } from 'solid-js';
import { Tooltip } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '打开与关闭延迟',
  description:
    'openDelay / closeDelay 直接透传给锚定原语，由 Kobalte 的 hover 时序统一执行；onOpenChange 是唯一状态出口。',
};

export default function TooltipDelayDemo() {
  const [log, setLog] = createSignal('等待悬停');

  return (
    <>
      <DemoSection title="两条不同延迟">
        <div class="demo-row">
          <Tooltip
            content="这条没有延迟"
            openDelay={0}
            closeDelay={0}
            onOpenChange={(open) => setLog(open ? '快速提示打开' : '快速提示关闭')}
          >
            <span>立即显示</span>
          </Tooltip>
          <Tooltip
            content="这条等 600ms 才出现"
            openDelay={600}
            closeDelay={400}
            onOpenChange={(open) => setLog(open ? '延迟提示打开' : '延迟提示关闭')}
          >
            <span>延迟 600ms</span>
          </Tooltip>
        </div>
      </DemoSection>

      <DemoSection title="状态出口">
        <p data-testid="tooltip-delay-log">{log()}</p>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Tooltip 文字提示 API](../exports/tooltip.md)
- [设计 Token](../design/tokens.md)
