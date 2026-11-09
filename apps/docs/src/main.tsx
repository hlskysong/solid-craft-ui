import { render } from 'solid-js/web';
import 'solid-craft/styles.css';
import { catalog } from './lib/catalog';
import './styles/base.css';
import './styles/docs.css';

const root = document.getElementById('app');
if (!root) throw new Error('[docs] missing #app container');

// 供 E2E 断言「测试清单」与「文档站目录」同源，避免任一侧漏页。
document.documentElement.dataset.demoIds = catalog.slugs.join(',');

// 独立 Demo 页不加载 Router / Fuse / 站点页面，保证截图宿主最小且稳定。
if (new URLSearchParams(window.location.search).get('standalone') === '1') {
  const { renderStandalone } = await import('./standalone');
  renderStandalone(root);
} else {
  const { default: App } = await import('./App');
  render(() => <App />, root);
}
