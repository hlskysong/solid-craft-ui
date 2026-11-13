# Pagination 分页 · 基础用法（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/pagination/demos/basic.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

页码、边界禁用与总数文案；受控示例把 onChange 的 current 回写后再传回去，形成正常翻页闭环。

## 完整源码

```tsx
import { createSignal } from 'solid-js';
import { Pagination } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '基础用法',
  description:
    '页码、边界禁用与总数文案；受控示例把 onChange 的 current 回写后再传回去，形成正常翻页闭环。',
};

export default function PaginationBasicDemo() {
  const [page, setPage] = createSignal(3);

  return (
    <>
      <DemoSection title="基础分页">
        <div class="demo-stack">
          <Pagination total={85} />
        </div>
      </DemoSection>

      <DemoSection title="带总数文案">
        <div class="demo-stack">
          <Pagination
            total={85}
            defaultCurrent={3}
            showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条 / 共 ${total} 条`}
          />
        </div>
      </DemoSection>

      <DemoSection title="受控当前页">
        <div class="demo-stack">
          <Pagination
            total={85}
            current={page()}
            onChange={(change) => {
              setPage(change.current);
            }}
          />
          <span>
            当前第 <output>{page()}</output> 页
          </span>
        </div>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Pagination 分页 API](../exports/pagination.md)
- [设计 Token](../design/tokens.md)
