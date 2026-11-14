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
