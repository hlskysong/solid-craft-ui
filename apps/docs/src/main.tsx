import { render } from 'solid-js/web';
import 'solid-craft/styles.css';
// 暗色语义变量（仅 data-theme='dark' 时生效）：让站点 chrome 与 Demo 一起响应主题切换。
// 直接引 workspace 内 tokens 产物，避免给 apps/docs 新增依赖（AGENTS 硬约束 5）。
// standalone 截图宿主恒为 light，该文件对其零影响。
import '../../../packages/tokens/dist/css/theme-dark.css';
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
