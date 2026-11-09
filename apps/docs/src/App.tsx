import { Route, Router } from '@solidjs/router';
import { Shell } from './components/Shell';
import { ComponentPage, DemoPage, Home } from './pages/ComponentPages';
import { Changelog, DesignPage, GettingStarted, NotFound } from './pages/ContentPages';

/** 02 §12.1 全量路由；文档站是内部 SPA，SSG / SEO 不是 v1 阻塞项（ADR-008）。 */
export default function App() {
  return (
    <Router root={Shell}>
      <Route path="/" component={Home} />
      <Route path="/docs/getting-started" component={GettingStarted} />
      <Route path="/docs/design/:slug" component={DesignPage} />
      <Route path="/components/:slug" component={ComponentPage} />
      <Route path="/components/:slug/:demo" component={DemoPage} />
      <Route path="/changelog" component={Changelog} />
      <Route path="*" component={NotFound} />
    </Router>
  );
}
