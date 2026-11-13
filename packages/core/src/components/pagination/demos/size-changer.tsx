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
