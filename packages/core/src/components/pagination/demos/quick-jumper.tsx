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
