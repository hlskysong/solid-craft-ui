/**
 * 反馈通道 API（T2-06）：`createAppRuntime()` 给 `<App>` 用，静态 `message` /
 * `notification` 给「脱离树」用。
 *
 * SSR 边界：`solid-js/web` 在服务端把 `render` 导出成 `notSup`（调用即抛错），
 * 因此模块顶层绝不触碰 `document`，宿主只在 `!isServer` 且第一次调用时创建；
 * 服务端调用静态 API 走 NOOP_CONTEXT，返回已 resolve 的句柄，零 DOM、零定时器。
 */
import type { JSX } from 'solid-js';
import { isServer } from 'solid-js/web';

import { mountGlobalHost } from './mount-global';
import { createNoticeStore, type NoticeItem, type NoticeStore } from './notice-store';
import type {
  AppContextValue,
  AppMessageConfig,
  AppNotificationConfig,
  MessageApi,
  NoticeChannel,
  NoticeHandle,
  NoticeKind,
  NoticeOptions,
  NoticePlacement,
  NotificationApi,
} from './types';

const MESSAGE_DURATION = 3000;
const NOTIFICATION_DURATION = 4500;
const MESSAGE_MAX_COUNT = 3;
const NOTIFICATION_MAX_COUNT = 5;

/** notification 容器的默认位置；`<App>` 未配置时与全局宿主共用同一口径。 */
export const DEFAULT_NOTIFICATION_PLACEMENT: NoticePlacement = 'top-right';

interface ChannelDefaults {
  duration: number;
  maxCount: number;
  closable: boolean;
}

/** 一个运行时 = 一份队列 + 两个通道 API。`<App>` 与全局宿主各持一份，互不串队列。 */
export interface AppRuntime {
  store: NoticeStore;
  api: AppContextValue;
  clear(): void;
}

/**
 * 服务端 / 尚未挂载时的空句柄：立即 resolve，close / update 都是空操作。
 *
 * 句柄一律是「真正的 Promise + 挂上去的方法」，而不是自己写 `then` 的对象字面量：
 * 既满足 docs/04 §2.4 的 Promise 风格，也不触发 `unicorn(no-thenable)`，
 * `await` / `.then` / `.catch` 全部走原生 Promise 语义。
 */
function noopHandle(): NoticeHandle {
  return Object.assign(Promise.resolve(), {
    close: () => undefined,
    update: () => undefined,
  });
}

const NOOP_MESSAGE: MessageApi = {
  open: noopHandle,
  info: noopHandle,
  success: noopHandle,
  warning: noopHandle,
  error: noopHandle,
  loading: noopHandle,
  destroy: () => undefined,
};

const NOOP_NOTIFICATION: NotificationApi = {
  open: noopHandle,
  info: noopHandle,
  success: noopHandle,
  warning: noopHandle,
  error: noopHandle,
  destroy: () => undefined,
};

const NOOP_CONTEXT: AppContextValue = {
  message: NOOP_MESSAGE,
  notification: NOOP_NOTIFICATION,
};

export function createAppRuntime(
  messageConfig: AppMessageConfig = {},
  notificationConfig: AppNotificationConfig = {},
): AppRuntime {
  const resolvers = new Map<number, () => void>();
  const store = createNoticeStore({
    onRemove: (id) => {
      const resolve = resolvers.get(id);
      if (!resolve) return;
      resolvers.delete(id);
      resolve();
    },
  });

  const defaults: Record<NoticeChannel, ChannelDefaults> = {
    message: {
      duration: messageConfig.duration ?? MESSAGE_DURATION,
      maxCount: messageConfig.maxCount ?? MESSAGE_MAX_COUNT,
      closable: false,
    },
    notification: {
      duration: notificationConfig.duration ?? NOTIFICATION_DURATION,
      maxCount: notificationConfig.maxCount ?? NOTIFICATION_MAX_COUNT,
      closable: true,
    },
  };

  function open(channel: NoticeChannel, options: NoticeOptions): NoticeHandle {
    if (isServer) return noopHandle();
    const conf = defaults[channel];
    const draft: Omit<NoticeItem, 'id' | 'channel'> = {
      kind: options.kind ?? 'info',
      content: options.content,
      description: options.description,
      closable: options.closable ?? conf.closable,
      duration: options.duration ?? conf.duration,
      onClose: options.onClose,
    };
    const id = store.add(channel, draft, conf.maxCount);

    // Promise 风格：关闭（含自动到期 / 被挤出队列）时由 store.onRemove 触发 resolve。
    // executor 同步执行，注册在构造器内即可，不需要额外的中间变量。
    const done = new Promise<void>((settle) => {
      resolvers.set(id, settle);
    });

    return Object.assign(done, {
      close: () => store.remove(id),
      update: (patch: Partial<NoticeOptions>) => store.update(id, patch),
    });
  }

  function quick(
    channel: NoticeChannel,
    kind: NoticeKind,
    content: JSX.Element,
    duration?: number,
  ): NoticeHandle {
    return open(channel, { content, kind, duration });
  }

  const clear = (): void => store.clear();

  const message: MessageApi = {
    open: (options) => open('message', options),
    info: (content, duration) => quick('message', 'info', content, duration),
    success: (content, duration) => quick('message', 'success', content, duration),
    warning: (content, duration) => quick('message', 'warning', content, duration),
    error: (content, duration) => quick('message', 'error', content, duration),
    loading: (content, duration) => quick('message', 'loading', content, duration),
    destroy: clear,
  };

  const notification: NotificationApi = {
    open: (options) => open('notification', options),
    info: (content, duration) => quick('notification', 'info', content, duration),
    success: (content, duration) => quick('notification', 'success', content, duration),
    warning: (content, duration) => quick('notification', 'warning', content, duration),
    error: (content, duration) => quick('notification', 'error', content, duration),
    destroy: clear,
  };

  return { store, api: { message, notification }, clear };
}

let globalRuntime: AppRuntime | undefined;
let globalUnmount: (() => void) | undefined;

function ensureGlobalRuntime(): AppRuntime {
  if (globalRuntime) return globalRuntime;
  const created = createAppRuntime();
  globalRuntime = created;
  globalUnmount = mountGlobalHost(created.store, DEFAULT_NOTIFICATION_PLACEMENT);
  return created;
}

/** 销毁静态 API 的全局宿主：清队列、卸载响应式树、移除 DOM 节点。 */
export function destroyGlobal(): void {
  globalRuntime?.clear();
  globalUnmount?.();
  globalRuntime = undefined;
  globalUnmount = undefined;
}

/** 供 `useApp()` 在无 Provider 时回落；SSR 下返回 no-op 上下文。 */
export function getGlobalApi(): AppContextValue {
  if (isServer) return NOOP_CONTEXT;
  return ensureGlobalRuntime().api;
}

/** 静态短提示：脱离组件树直接调用，首次调用惰性挂载全局宿主。 */
export const message: MessageApi = {
  open: (options) => getGlobalApi().message.open(options),
  info: (content, duration) => getGlobalApi().message.info(content, duration),
  success: (content, duration) => getGlobalApi().message.success(content, duration),
  warning: (content, duration) => getGlobalApi().message.warning(content, duration),
  error: (content, duration) => getGlobalApi().message.error(content, duration),
  loading: (content, duration) => getGlobalApi().message.loading(content, duration),
  destroy: () => destroyGlobal(),
};

/** 静态通知卡片：脱离组件树直接调用，与 `message` 共用同一个全局宿主。 */
export const notification: NotificationApi = {
  open: (options) => getGlobalApi().notification.open(options),
  info: (content, duration) => getGlobalApi().notification.info(content, duration),
  success: (content, duration) => getGlobalApi().notification.success(content, duration),
  warning: (content, duration) => getGlobalApi().notification.warning(content, duration),
  error: (content, duration) => getGlobalApi().notification.error(content, duration),
  destroy: () => destroyGlobal(),
};
