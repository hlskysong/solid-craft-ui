# Card 卡片 · 标题与操作区（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/card/demos/basic.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

表头由 title 与 extra 两块组成，任一块不传就整块缺席；操作区可放任意节点，这里用 Button。

## 完整源码

```tsx
import { Button, Card } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '标题与操作区',
  description:
    '表头由 title 与 extra 两块组成，任一块不传就整块缺席；操作区可放任意节点，这里用 Button。',
};

export default function CardBasicDemo() {
  return (
    <DemoSection title="基础用法">
      <div class="demo-column">
        <Card
          title="维简设备采购计划"
          extra={
            <Button variant="outline" size="small">
              编辑
            </Button>
          }
        >
          本次采购数量按年度维简计划填写，提交后进入审批流。
        </Card>
        <Card title="无操作区的卡片">表头只剩标题，右侧不会留下空盒子。</Card>
        <Card>既不传标题也不传操作区时，表头整块不渲染，正文直接贴着卡片内边距。</Card>
      </div>
    </DemoSection>
  );
}
```

## 相关页面

- [Card 卡片 API](../exports/card.md)
- [设计 Token](../design/tokens.md)
