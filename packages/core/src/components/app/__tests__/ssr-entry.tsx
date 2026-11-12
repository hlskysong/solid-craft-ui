/**
 * T2-06 SSR 入口：验「服务端导入 + 静态 API 调用 + useApp() 都不报错」。
 *
 * 静态 `message` / `notification` 与 `useApp()` 在服务端必须走 no-op 上下文：
 * 一旦有人删掉 `isServer` 判定，这里会去 `document.createElement` 直接抛错。
 * 两个容器仍要输出空骨架（aria-live / placement），保证 hydration 首帧属性集一致。
 */
import { renderToString } from 'solid-js/web';

import { App } from '../App';
import { useApp } from '../app-context';
import { message, notification } from '../notice-api';

function Child() {
  const app = useApp();
  app.message.info('context 内调用');
  return <p>服务端子树</p>;
}

export async function render(): Promise<string> {
  message.success('服务端静态调用');
  notification.error('服务端通知调用');
  return renderToString(() => (
    <App>
      <Child />
    </App>
  ));
}
