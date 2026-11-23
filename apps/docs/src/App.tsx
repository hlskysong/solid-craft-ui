import { Route, Router } from '@solidjs/router';
import { lazy } from 'solid-js';
import { Shell } from './components/Shell';
import { ComponentPage, DemoPage, Home } from './pages/ComponentPages';
import { Changelog, DesignPage, GettingStarted, LlmsPage, NotFound } from './pages/ContentPages';

// /icons 页按需加载（含 1.6 MB 图标清单），不进首屏模块图。
const IconGallery = lazy(() => import('./pages/IconGallery').then((m) => ({ default: m.IconGallery })));

/** 02 §12.1 全量路由；文档站是内部 SPA，SSG / SEO 不是 v1 阻塞项（ADR-008）。 */
export default function App() {
  return (
    <Router root={Shell}>
      <Route path="/" component={Home} />
      <Route path="/docs/getting-started" component={GettingStarted} />
      <Route path="/docs/design/:slug" component={DesignPage} />
      <Route path="/components/:slug" component={ComponentPage} />
      <Route path="/components/:slug/:demo" component={DemoPage} />
      <Route path="/icons" component={IconGallery} />
      <Route path="/changelog" component={Changelog} />
      <Route path="/llms" component={LlmsPage} />
      <Route path="*" component={NotFound} />
    </Router>
  );
}
