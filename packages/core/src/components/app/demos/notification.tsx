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
