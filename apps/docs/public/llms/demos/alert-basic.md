# Alert 警告提示 · 四种反馈类型（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/alert/demos/basic.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

info / success / warning / error 共用同一个 data-scui-kind 属性；标题、描述与类型图标都是同一套结构。

## 完整源码

```tsx
import { Alert, type AlertKind } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '四种反馈类型',
  description:
    'info / success / warning / error 共用同一个 data-scui-kind 属性；标题、描述与类型图标都是同一套结构。',
};

const KINDS: readonly { kind: AlertKind; title: string; description: string }[] = [
  {
    kind: 'info',
    title: '填报说明',
    description: '本次采购数量按年度维简计划填写，提交后进入审批流。',
  },
  { kind: 'success', title: '保存成功', description: '采购明细已写入草稿，可继续添加设备。' },
  {
    kind: 'warning',
    title: '金额超出预算',
    description: '本次采购金额高于季度预算，请复核后提交。',
  },
  { kind: 'error', title: '提交失败', description: '网络请求未完成，已保留页面内容，请稍后重试。' },
];

export default function AlertBasicDemo() {
  return (
    <DemoSection title="基础用法">
      <div class="demo-column">
        {KINDS.map((item) => (
          <Alert kind={item.kind} title={item.title} description={item.description} />
        ))}
      </div>
    </DemoSection>
  );
}
```

## 相关页面

- [Alert 警告提示 API](../exports/alert.md)
- [设计 Token](../design/tokens.md)
