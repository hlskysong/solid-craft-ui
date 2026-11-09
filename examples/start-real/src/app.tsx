import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { Suspense } from 'solid-js';
import 'solid-craft/styles.css';

/** 应用根组件：文件路由 + 显式引入组件库 CSS（02 §决策：CSS 不隐式注入）。 */
export default function App() {
  return (
    <Router root={(props) => <Suspense>{props.children}</Suspense>}>
      <FileRoutes />
    </Router>
  );
}
