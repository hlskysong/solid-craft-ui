# Tooltip 文字提示 · 打开态与箭头（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/tooltip/demos/open-state.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

首屏受控打开，让浮层态进入视觉基线与 axe 扫描；箭头由锚定原语渲染，关闭箭头后整块不渲染。

## 完整源码

```tsx
import { createSignal } from 'solid-js';
import { Button, Tooltip } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '打开态与箭头',
  description:
    '首屏受控打开，让浮层态进入视觉基线与 axe 扫描；箭头由锚定原语渲染，关闭箭头后整块不渲染。',
};

export default function TooltipOpenStateDemo() {
  const [open, setOpen] = createSignal(true);
  const [arrow, setArrow] = createSignal(true);

  return (
    <DemoSection title="打开态视觉基线">
      <div class="demo-row">
        <Tooltip
          content="本次采购数量按年度维简计划填写，提交后进入审批流。"
          placement="bottom"
          arrow={arrow()}
          open={open()}
          onOpenChange={setOpen}
        >
          <span>采购数量说明</span>
        </Tooltip>
        <Button variant="outline" color="neutral" onClick={() => setArrow(!arrow())}>
          {arrow() ? '隐藏箭头' : '显示箭头'}
        </Button>
      </div>
      <p>提示面板由 Portal 在客户端挂载，服务端只输出触发按钮静态骨架。</p>
    </DemoSection>
  );
}
```

## 相关页面

- [Tooltip 文字提示 API](../exports/tooltip.md)
- [设计 Token](../design/tokens.md)
