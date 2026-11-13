# Pagination 分页 · 快速跳转（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/pagination/demos/quick-jumper.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

输入页码后按 Enter 提交，越界输入收敛到首末页、非法输入只清空不跳页；末尾一张展示整体禁用。

## 完整源码

```tsx
import { Pagination } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '快速跳转',
  description:
    '输入页码后按 Enter 提交，越界输入收敛到首末页、非法输入只清空不跳页；末尾一张展示整体禁用。',
};

export default function PaginationQuickJumperDemo() {
  return (
    <>
      <DemoSection title="快速跳转">
        <div class="demo-stack">
          <Pagination total={500} showQuickJumper />
        </div>
      </DemoSection>

      <DemoSection title="完整组合">
        <div class="demo-stack">
          <Pagination
            total={500}
            defaultCurrent={5}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条 / 共 ${total} 条`}
          />
        </div>
      </DemoSection>

      <DemoSection title="禁用">
        <div class="demo-stack">
          <Pagination total={500} defaultCurrent={2} showSizeChanger showQuickJumper disabled />
        </div>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Pagination 分页 API](../exports/pagination.md)
- [设计 Token](../design/tokens.md)
