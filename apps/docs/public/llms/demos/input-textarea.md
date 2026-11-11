# Input 输入框 · 多行输入（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/input/demos/textarea.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

自动高度（true 与 minRows / maxRows 两种口径）、字数统计、清除按钮与禁用态。

## 完整源码

```tsx
import { createSignal } from 'solid-js';
import { Textarea } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '多行输入',
  description: '自动高度（true 与 minRows / maxRows 两种口径）、字数统计、清除按钮与禁用态。',
};

export default function TextareaDemo() {
  const [remark, setRemark] = createSignal('这段文字由 createSignal 驱动，可以继续输入。');
  const [limited, setLimited] = createSignal('');

  const limit = 50;

  return (
    <>
      <DemoSection title="自动高度（true）">
        <Textarea
          autoSize
          aria-label="备注内容"
          defaultValue={'第一行\n第二行\n第三行'}
          placeholder="内容增多时会自动撑高，不封顶"
        />
      </DemoSection>

      <DemoSection title="自动高度（minRows / maxRows）">
        <Textarea
          autoSize={{ minRows: 3, maxRows: 6 }}
          aria-label="多行备注"
          defaultValue={'最少显示 3 行，最多 6 行，超出后内部滚动。\n可以继续输入观察高度变化。'}
          placeholder="行数在 3 到 6 之间伸缩"
        />
        <Textarea
          autoSize={{ minRows: 2, maxRows: 4 }}
          disabled
          aria-label="禁用态多行输入"
          defaultValue="禁用态不参与交互"
        />
      </DemoSection>

      <DemoSection title="字数统计与上限">
        <Textarea
          showCount
          maxLength={limit}
          aria-label="受限备注"
          value={limited()}
          onChange={(value) => setLimited(value)}
          placeholder="最多输入 50 个字"
        />
        <Textarea
          showCount
          aria-label="无上限备注"
          defaultValue="不传 maxLength 时只显示已输入字数，不显示上限。"
          placeholder="展示已输入字数"
        />
      </DemoSection>

      <DemoSection title="允许清除">
        <Textarea
          allowClear
          aria-label="可清除备注"
          defaultValue="有值时右下角出现清除按钮。"
          placeholder="试试清空"
        />
        <Textarea
          allowClear
          showCount
          maxLength={80}
          aria-label="清除与统计"
          value={remark()}
          onChange={(value) => setRemark(value)}
          placeholder="清除与统计可以同时出现"
        />
      </DemoSection>

      <DemoSection title="禁用">
        <Textarea
          disabled
          aria-label="禁用的多行输入"
          defaultValue="禁用状态下不可编辑，也不出现清除按钮。"
        />
        <Textarea
          showCount
          maxLength={40}
          disabled
          aria-label="禁用但计数的多行输入"
          defaultValue="禁用但保留字数统计。"
        />
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Input 输入框 API](../exports/input.md)
- [设计 Token](../design/tokens.md)
