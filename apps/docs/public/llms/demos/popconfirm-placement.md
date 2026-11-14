# Popconfirm 气泡确认 · 定位与文案覆盖（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/popconfirm/demos/placement.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

四向 placement 由 Floating UI 负责翻转；okText / cancelText 与 arrow 开关都只影响展示，不改变异步确认协议。

## 完整源码

```tsx
import { createSignal } from 'solid-js';
import { Button, Popconfirm, type PopconfirmPlacement } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '定位与文案覆盖',
  description:
    '四向 placement 由 Floating UI 负责翻转；okText / cancelText 与 arrow 开关都只影响展示，不改变异步确认协议。',
};

const SIDES: readonly PopconfirmPlacement[] = ['top', 'bottom', 'left', 'right'];

export default function PopconfirmPlacementDemo() {
  const [placement, setPlacement] = createSignal<PopconfirmPlacement>('top');
  const [arrow, setArrow] = createSignal(true);

  return (
    <>
      <DemoSection title="四向定位">
        <div class="demo-row">
          {SIDES.map((item) => (
            <Button variant="outline" color="neutral" onClick={() => setPlacement(item)}>
              {item}
            </Button>
          ))}
        </div>
        <p>当前方向：{placement()}</p>
      </DemoSection>

      <DemoSection title="自定义文案">
        <Popconfirm
          title="确认归档？"
          description="归档后该计划不再出现在待办列表。"
          placement={placement()}
          arrow={arrow()}
          okText="归档"
          cancelText="返回"
          onOk={() => undefined}
        >
          归档计划
        </Popconfirm>
        <Button variant="outline" color="neutral" onClick={() => setArrow(!arrow())}>
          {arrow() ? '隐藏箭头' : '显示箭头'}
        </Button>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Popconfirm 气泡确认 API](../exports/popconfirm.md)
- [设计 Token](../design/tokens.md)
