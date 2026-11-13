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
