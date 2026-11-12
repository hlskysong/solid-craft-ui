/**
 * App / Message / Notification 的公共类型契约（T2-06）。
 *
 * 一个队列、两个容器：`<App>` 提供 context，静态 `message` / `notification`
 * 在没有 Provider 时也能调用（首次调用才惰性把宿主挂到 `document.body`）。
 * `<Form>` 的校验错误直接复用 `message.error` / `notification.error`，
 * 不另造一套提示组件 —— 这是 T2-09 接 Form 时不需要再动控件层的前提。
 */
import type { JSX } from 'solid-js';

/** 反馈语义类型。只表达反馈种类，不表达控件状态。 */
export type NoticeKind = 'info' | 'success' | 'warning' | 'error' | 'loading';

/** 容器出现位置。`message` 固定 `top`，只有 `notification` 可配。 */
export type NoticePlacement =
  'top' | 'top-left' | 'top-right' | 'bottom' | 'bottom-left' | 'bottom-right';

/** 反馈通道，决定渲染到哪个容器。 */
export type NoticeChannel = 'message' | 'notification';

/** 单条反馈的入参。 */
export interface NoticeOptions {
  /** 主文案；允许任意 JSX，便于 Form 把整段校验错误复用到这里。 */
  content: JSX.Element;
  /** 副文案；仅 `notification` 展示。 */
  description?: JSX.Element;
  /**
   * 语义类型。
   * @default 'info'
   */
  kind?: NoticeKind;
  /**
   * 自动关闭毫秒数；`0` 表示常驻，需手动 `close()`。
   * @default 3000（message）/ 4500（notification）
   */
  duration?: number;
  /**
   * 是否显示关闭按钮。
   * @default false（message）/ true（notification）
   */
  closable?: boolean;
  /** 关闭时回调（自动到期、手动关闭、被队列挤出都会触发一次）。 */
  onClose?: () => void;
}

/**
 * 单条反馈的句柄。**Promise 风格**：`await message.success('已保存')`
 * 会等到该条提示关闭（自动到期 / `close()` / 被 `maxCount` 挤出）才继续。
 */
export interface NoticeHandle extends PromiseLike<void> {
  /** 立即关闭并让 Promise resolve。 */
  close(): void;
  /** 就地更新文案 / 类型 / 时长，不新增一条。 */
  update(patch: Partial<NoticeOptions>): void;
}

/** 全局短提示 API。脱离组件树亦可调用。 */
export interface MessageApi {
  /** 用完整配置打开一条提示。 */
  open(options: NoticeOptions): NoticeHandle;
  /** 普通提示。 */
  info(content: JSX.Element, duration?: number): NoticeHandle;
  /** 成功提示。 */
  success(content: JSX.Element, duration?: number): NoticeHandle;
  /** 警告提示。 */
  warning(content: JSX.Element, duration?: number): NoticeHandle;
  /** 错误提示；Form 校验失败复用此通道。 */
  error(content: JSX.Element, duration?: number): NoticeHandle;
  /** 进行中提示；通常配合 `handle.update()` 收尾。 */
  loading(content: JSX.Element, duration?: number): NoticeHandle;
  /** 清空当前队列。 */
  destroy(): void;
}

/** 通知卡片 API。位置、持续时间与关闭按钮在 `<App>` 上配置。 */
export interface NotificationApi {
  /** 用完整配置打开一条通知。 */
  open(options: NoticeOptions): NoticeHandle;
  /** 普通通知。 */
  info(content: JSX.Element, duration?: number): NoticeHandle;
  /** 成功通知。 */
  success(content: JSX.Element, duration?: number): NoticeHandle;
  /** 警告通知。 */
  warning(content: JSX.Element, duration?: number): NoticeHandle;
  /** 错误通知；Form 校验失败复用此通道。 */
  error(content: JSX.Element, duration?: number): NoticeHandle;
  /** 清空当前队列。 */
  destroy(): void;
}

/** `useApp()` 与静态 API 暴露的统一形状。 */
export interface AppContextValue {
  message: MessageApi;
  notification: NotificationApi;
}

/** message 通道默认配置。 */
export interface AppMessageConfig {
  /**
   * 默认自动关闭毫秒数；`0` 常驻。
   * @default 3000
   */
  duration?: number;
  /**
   * 同屏最多保留条数，超出时挤掉最旧一条。
   * @default 3
   */
  maxCount?: number;
}

/** notification 通道默认配置。 */
export interface AppNotificationConfig extends AppMessageConfig {
  /**
   * 默认出现位置。
   * @default 'top-right'
   */
  placement?: NoticePlacement;
  /**
   * 默认自动关闭毫秒数。
   * @default 4500
   */
  duration?: number;
  /**
   * 同屏最多保留条数。
   * @default 5
   */
  maxCount?: number;
}

/**
 * `<App>` 入参。根节点是 `display: contents` 的透传容器，不改变子树布局；
 * 两个反馈容器由组件自己渲染，因而能继承 `ConfigProvider` 的 CSS 变量主题。
 */
export interface AppProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** 子树。 */
  children?: JSX.Element;
  /** message 通道默认配置。 */
  message?: AppMessageConfig;
  /** notification 通道默认配置。 */
  notification?: AppNotificationConfig;
}
