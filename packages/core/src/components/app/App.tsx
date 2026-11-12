import { onCleanup, splitProps, type JSX } from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import { classNames } from '../../utils/class-names';
import { AppContext } from './app-context';
import { NoticeViewport } from './NoticeViewport';
import { createAppRuntime, DEFAULT_NOTIFICATION_PLACEMENT } from './notice-api';
import type { AppProps } from './types';

/**
 * 反馈上下文宿主（T2-06）。
 *
 * 两个设计点：
 *  - 根节点 `display: contents`，不改变子树布局；反馈容器内联渲染而非 Portal 到 body，
 *    因此能继承 `ConfigProvider` 写在祖先上的 CSS 变量（主题 / 密度 / 书写方向）。
 *  - 队列归 `<App>` 自己所有，与静态 `message` / `notification` 的全局队列互不干扰；
 *    `useApp()` 在树内拿局部通道，脱离树才回落全局。服务端两者都不写队列。
 */
export function App(props: AppProps): JSX.Element {
  const [local, rest] = splitProps(props, ['children', 'class', 'message', 'notification']);
  const runtime = createAppRuntime(local.message, local.notification);
  onCleanup(() => runtime.clear());

  return (
    <AppContext.Provider value={runtime.api}>
      <div {...rest} class={classNames(`${CSS_PREFIX}app`, local.class)} data-scui-role="app">
        {local.children}
        <NoticeViewport store={runtime.store} channel="message" placement="top" />
        <NoticeViewport
          store={runtime.store}
          channel="notification"
          placement={local.notification?.placement ?? DEFAULT_NOTIFICATION_PLACEMENT}
        />
      </div>
    </AppContext.Provider>
  );
}
