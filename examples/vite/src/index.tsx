import { render } from 'solid-js/web';
import { Button } from 'solid-craft/button';
import { ConfigProvider } from 'solid-craft/config-provider';
import 'solid-craft/styles.css';

/**
 * S-01 最小消费页面：只按子路径引入 Button / ConfigProvider，
 * 供 check-consumers.mjs 验证 tree-shaking（其他组件不得进入 bundle）。
 */
const root = document.getElementById('app');
if (!root) {
  throw new Error('[example-vite] missing #app container');
}

render(
  () => (
    <ConfigProvider theme="light" density="default" direction="ltr">
      <Button>三端消费冒烟</Button>
    </ConfigProvider>
  ),
  root,
);
