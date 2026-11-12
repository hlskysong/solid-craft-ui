# App 全局反馈 · 上下文与配置（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/app/demos/context.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

在 App 内用 useApp 获取局部通道，并通过句柄就地更新提示。

## 完整源码

```tsx
import { App, Button, useApp } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '上下文与配置',
  description: '在 App 内用 useApp 获取局部通道，并通过句柄就地更新提示。',
};

function ContextPanel() {
  const app = useApp();

  return (
    <DemoSection title="局部通道">
      <Button
        onClick={() => {
          app.message.success('保存在当前 App 内');
        }}
      >
        局部成功提示
      </Button>
      <Button
        onClick={() => {
          const handle = app.message.loading('处理中');
          handle.update({ content: '处理完成', kind: 'success' });
        }}
      >
        就地更新提示
      </Button>
    </DemoSection>
  );
}

export default function AppContextDemo() {
  return (
    <App message={{ maxCount: 2, duration: 0 }}>
      <ContextPanel />
    </App>
  );
}
```

## 相关页面

- [App 全局反馈 API](../exports/app.md)
- [设计 Token](../design/tokens.md)
