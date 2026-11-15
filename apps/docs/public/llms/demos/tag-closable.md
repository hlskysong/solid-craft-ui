# Tag 标签 · 可关闭（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/tag/demos/closable.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

关闭是非受控的：组件自己移除 DOM 并发一次 onClose。关闭按钮恒带 aria-label，可用 closeLabel 覆盖。

## 完整源码

```tsx
import { createSignal } from 'solid-js';
import { Tag } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '可关闭',
  description:
    '关闭是非受控的：组件自己移除 DOM 并发一次 onClose。关闭按钮恒带 aria-label，可用 closeLabel 覆盖。',
};

export default function TagClosableDemo() {
  const [closed, setClosed] = createSignal(0);

  const handleClose = (): void => {
    setClosed(closed() + 1);
  };

  return (
    <DemoSection title="可关闭">
      <div class="demo-column">
        <div class="demo-row">
          <Tag closable onClose={handleClose}>
            待复核
          </Tag>
          <Tag closable closeLabel="移除已通过标签" color="success" onClose={handleClose}>
            已通过
          </Tag>
          <Tag closable color="danger" onClose={handleClose}>
            已驳回
          </Tag>
          <Tag color="neutral">不可关闭</Tag>
        </div>
        <p data-testid="tag-close-count">累计关闭 {closed()} 次</p>
        <p data-testid="tag-close-log">当前状态：{closed() === 0 ? '尚未关闭' : '已有关闭'}</p>
      </div>
    </DemoSection>
  );
}
```

## 相关页面

- [Tag 标签 API](../exports/tag.md)
- [设计 Token](../design/tokens.md)
