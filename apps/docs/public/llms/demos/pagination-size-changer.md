# Pagination 分页 · 每页条数（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/pagination/demos/size-changer.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

切换每页条数会让总页数变化，当前页按新总页数自动收敛；候选值可自定义，当前值不在候选里时会补进选项。

## 完整源码

```tsx
import { createSignal } from 'solid-js';
import { Pagination } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '每页条数',
  description:
    '切换每页条数会让总页数变化，当前页按新总页数自动收敛；候选值可自定义，当前值不在候选里时会补进选项。',
};

export default function PaginationSizeChangerDemo() {
  const [pageSize, setPageSize] = createSignal(50);
  const [page, setPage] = createSignal(1);

  return (
    <DemoSection title="每页条数">
      <div class="demo-stack">
        <Pagination total={200} showSizeChanger />

        <Pagination
          total={200}
          defaultPageSize={20}
          showSizeChanger
          pageSizeOptions={[5, 10, 20]}
        />

        <Pagination
          total={200}
          showSizeChanger
          pageSize={pageSize()}
          current={page()}
          onChange={(change) => {
            setPageSize(change.pageSize);
            setPage(change.current);
          }}
        />
        <span>
          每页 <output>{pageSize()}</output> 条，第 <output>{page()}</output> 页
        </span>
      </div>
    </DemoSection>
  );
}
```

## 相关页面

- [Pagination 分页 API](../exports/pagination.md)
- [设计 Token](../design/tokens.md)
