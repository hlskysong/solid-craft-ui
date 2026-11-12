# App 全局反馈 · 通知卡片（源码）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/src/components/app/demos/notification.tsx`（与文档站渲染 / 展示 / 截图基线同源）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 说明

带描述与关闭按钮的卡片，覆盖静态与上下文两条通道。

## 完整源码

```tsx
import { App, Button, notification, useApp } from 'solid-craft';
import { DemoSection } from '../../demos/shared';

export const demo = {
  title: '通知卡片',
  description: '带描述与关闭按钮的卡片，覆盖静态与上下文两条通道。',
};

function NotificationPanel() {
  const app = useApp();

  return (
    <DemoSection title="通知操作">
      <Button
        onClick={() => {
          notification.open({
            content: '发布完成',
            description: '新版本已部署到预览环境。',
            kind: 'success',
            duration: 0,
          });
        }}
      >
        打开成功通知
      </Button>
      <Button
        onClick={() => {
          app.notification.error('同步失败，请稍后重试');
        }}
      >
        发送错误通知
      </Button>
    </DemoSection>
  );
}

export default function AppNotificationDemo() {
  return (
    <App notification={{ placement: 'top-right', duration: 0 }}>
      <NotificationPanel />
    </App>
  );
}
```

## 相关页面

- [App 全局反馈 API](../exports/app.md)
- [设计 Token](../design/tokens.md)
