# Alert 警告提示 · 可关闭与关闭回调（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/alert/demos/closable.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

右上角关闭按钮点击后移除整条反馈并触发 onClose；closable=false 与 icon=null 可分别去掉关闭按钮和图标。

## 完整源码

```tsx
import { createSignal, Show } from 'solid-js';
import { Alert, Button } from 'solid-craft';

import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '可关闭与关闭回调',
  description:
    '右上角关闭按钮点击后移除整条反馈并触发 onClose；closable=false 与 icon=null 可分别去掉关闭按钮和图标。',
};

export default function AlertClosableDemo() {
  const [count, setCount] = createSignal(0);
  const [show, setShow] = createSignal(true);

  return (
    <>
      <DemoSection title="关闭路径">
        <div class="demo-column">
          <Alert
            kind="warning"
            title="这条提示可以关掉"
            description="关闭后组件自身从 DOM 移除，同时发一次 onClose。"
            onClose={() => setCount(count() + 1)}
          />
          <Alert kind="info" title="常驻说明" description="这条不提供关闭入口。" closable={false} />
          <Alert kind="success" title="纯文字提示" description="不显示类型图标。" icon={null} />
        </div>
        <p data-testid="alert-close-count">累计关闭 {count()} 次</p>
      </DemoSection>

      <DemoSection title="由调用方决定是否渲染">
        <Button variant="outline" onClick={() => setShow(!show())}>
          {show() ? '隐藏' : '显示'}反馈条
        </Button>
        <div class="demo-column">
          <Show when={show()}>
            <Alert title="受控渲染由页面决定">组件不额外提供 visible 受控态。</Alert>
          </Show>
        </div>
      </DemoSection>
    </>
  );
}
```

## 相关页面

- [Alert 警告提示 API](../exports/alert.md)
- [设计 Token](../design/tokens.md)
