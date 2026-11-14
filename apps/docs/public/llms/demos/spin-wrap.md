# Spin 加载中 · 包裹内容（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/spin/demos/wrap.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

遮罩盖在内容上层，容器同步 aria-busy；关掉后内容原样可见，不做透明度衰减。

## 完整源码

```tsx
import { Button, Spin } from 'solid-craft';
import { createSignal } from 'solid-js';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '包裹内容',
  description: '遮罩盖在内容上层，容器同步 aria-busy；关掉后内容原样可见，不做透明度衰减。',
};

export default function SpinWrapDemo() {
  const [spinning, setSpinning] = createSignal(true);

  return (
    <>
      <DemoSection title="包裹一段内容">
        <Spin spinning={spinning()} tip="正在提交审核" style="min-height: 96px">
          <div>维简设备采购计划 · 2026 年第三批</div>
          <div>本次采购数量 12 台，本次采购单价 8.6 万</div>
        </Spin>
        <Button onClick={() => setSpinning((value) => !value)}>
          {spinning() ? '结束加载' : '开始加载'}
        </Button>
      </DemoSection>

      <DemoSection title="无文案（读屏仍有「加载中」）">
        <Spin style="min-height: 72px">
          <div>设备台账</div>
        </Spin>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Spin 加载中 API](../exports/spin.md)
- [设计 Token](../design/tokens.md)
