# Card 卡片 · 封面（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/card/demos/cover.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

cover 位于表头之上、圆角内裁剪；传 <img> 时样式自动铺满，也可以直接放自定义块。

## 完整源码

```tsx
import { Card } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '封面',
  description: 'cover 位于表头之上、圆角内裁剪；传 <img> 时样式自动铺满，也可以直接放自定义块。',
};

const COVER_STYLE =
  'display:flex;align-items:center;justify-content:center;block-size:132px;' +
  'background:linear-gradient(120deg,#1b3a6b,#2d66f5 55%,#54c8e8);' +
  'color:#fff;font-size:18px;letter-spacing:2px';

export default function CardCoverDemo() {
  return (
    <DemoSection title="封面">
      <div class="demo-column">
        <Card
          cover={<div style={COVER_STYLE}>设备档案 · 2026</div>}
          title="主通风机"
          extra={<span>编号 SB-0421</span>}
        >
          安装地点：井下中央变电所；上次检修日期：2026-09-18。
        </Card>
        <Card cover={<div style={COVER_STYLE}>纯封面卡片</div>}>
          不传标题与操作区时，封面下面直接接正文。
        </Card>
      </div>
    </DemoSection>
  );
}
```

## 相关页面

- [Card 卡片 API](../exports/card.md)
- [设计 Token](../design/tokens.md)
