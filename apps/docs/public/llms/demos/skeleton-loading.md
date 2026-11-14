# Skeleton 骨架屏 · 包裹与同高（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/skeleton/demos/loading.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

loading 切换骨架与内容；右侧对照区把三行骨架和三行真实文本并排放，高度必须一致。

## 完整源码

```tsx
import { Button, Skeleton } from 'solid-craft';
import { createSignal } from 'solid-js';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '包裹与同高',
  description: 'loading 切换骨架与内容；右侧对照区把三行骨架和三行真实文本并排放，高度必须一致。',
};

export default function SkeletonLoadingDemo() {
  const [loading, setLoading] = createSignal(true);

  return (
    <>
      <DemoSection title="包裹模式">
        <Skeleton loading={loading()}>
          <div>维简设备采购计划已提交，等待机电管理部审核。</div>
          <div>本次采购数量 12 台，本次采购单价 8.6 万，合计 103.2 万。</div>
          <div>审核通过后进入招标环节，预计 15 个工作日内完成。</div>
        </Skeleton>
        <Button onClick={() => setLoading((value) => !value)}>
          {loading() ? '显示内容' : '显示骨架'}
        </Button>
      </DemoSection>

      {/* 对照区：browser 用例按 boundingBox 实测两列高度差。
          两列必须 `align-items: flex-start` —— 用 stretch 的话，flex 会把两列强行
          拉成等高，测出来的「一致」是布局凑出来的，不是骨架真的同高。
          文本列显式写字号 / 行高 token，避免受页面默认排版影响。 */}
      <DemoSection title="骨架与真实内容同高">
        <div class="demo-row" style="align-items: flex-start; gap: 24px">
          <div data-testid="skeleton-column" style="flex: 1 1 200px">
            <Skeleton rows={3} />
          </div>
          <div
            data-testid="text-column"
            style="flex: 1 1 200px; font-size: var(--scui-font-size-md); line-height: var(--scui-line-height-md)"
          >
            <div>维简设备采购计划</div>
            <div>维简设备采购计划</div>
            <div>维简设备采购计划</div>
          </div>
        </div>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Skeleton 骨架屏 API](../exports/skeleton.md)
- [设计 Token](../design/tokens.md)
