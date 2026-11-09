import { generateHydrationScript, renderToString } from 'solid-js/web';
import { App } from './App';

export interface RenderResult {
  html: string;
  hydrationScript: string;
}

/** 服务端渲染入口；产物由 scripts/smoke.mjs 加载。 */
export function render(): RenderResult {
  return {
    html: renderToString(() => <App />),
    // Solid 的 hydrate 依赖 window._$HY；真实框架由宿主框架注入这段脚本。
    hydrationScript: generateHydrationScript({}),
  };
}
