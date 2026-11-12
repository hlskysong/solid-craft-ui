import { render } from 'solid-js/web';

import { CSS_PREFIX } from '../../scope';
import { NoticeViewport } from './NoticeViewport';
import type { NoticeStore } from './notice-store';
import type { NoticePlacement } from './types';

/**
 * 把全局反馈宿主挂到 `document.body`（T2-06「脱离树亦可调用」的落点）。
 *
 * 只在客户端首次调用静态 API 时执行：本文件不含模块顶层 DOM 访问，
 * `solid-js/web` 在服务端把 `render` 导出为 `notSup`，所以连导入都不会触发副作用。
 * 返回的卸载函数同时清掉响应式树与 DOM 节点，供测试与 `destroy()` 复用。
 */
export function mountGlobalHost(
  store: NoticeStore,
  notificationPlacement: NoticePlacement,
): () => void {
  const host = document.createElement('div');
  host.className = `${CSS_PREFIX}app-host`;
  host.setAttribute('data-scui-role', 'app-host');
  document.body.appendChild(host);

  const dispose = render(
    () => (
      <>
        <NoticeViewport store={store} channel="message" placement="top" />
        <NoticeViewport store={store} channel="notification" placement={notificationPlacement} />
      </>
    ),
    host,
  );

  return () => {
    dispose();
    host.remove();
  };
}
