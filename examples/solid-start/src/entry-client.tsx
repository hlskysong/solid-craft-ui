import { hydrate } from 'solid-js/web';
import { App } from './App';

/** 客户端 hydration 入口；打包成 IIFE 后直接执行副作用。 */
const container = document.getElementById('app');
if (!container) {
  throw new Error('[solid-start smoke] missing #app container');
}
hydrate(() => <App />, container);
