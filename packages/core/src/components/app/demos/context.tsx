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
