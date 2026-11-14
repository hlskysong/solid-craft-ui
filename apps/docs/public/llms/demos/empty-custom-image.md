# Empty 空状态 · 自定义插画（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/empty/demos/custom-image.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

image 整体替换内置图形而非叠加；自定义图形默认对读屏可见，装饰性图形请自行加 aria-hidden。

## 完整源码

```tsx
import { Empty } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '自定义插画',
  description:
    'image 整体替换内置图形而非叠加；自定义图形默认对读屏可见，装饰性图形请自行加 aria-hidden。',
};

export default function EmptyCustomImageDemo() {
  return (
    <>
      <DemoSection title="自定义图形">
        <Empty
          description="所有任务都处理完了"
          image={
            <svg viewBox="0 0 96 72" fill="none" aria-hidden="true">
              <circle cx="48" cy="34" r="22" stroke="currentColor" stroke-width="2.5" />
              <path
                d="M38 34l7 7 13-14"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          }
        />
      </DemoSection>

      <DemoSection title="纯文字（不要插画）">
        <Empty image={null} description="这一列暂时没有数据" />
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Empty 空状态 API](../exports/empty.md)
- [设计 Token](../design/tokens.md)
