# App 全局反馈（`solid-craft/app`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

Message / Notification 的上下文宿主与静态 API，脱离组件树亦可调用，错误提示可被 Form 复用。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/app/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/app/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/app/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/app/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/app';
```

## API

### NoticeOptions

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `content` | `JSX.Element` | — | 主文案；允许任意 JSX，便于 Form 把整段校验错误复用到这里。 | 是 |
| `description` | `JSX.Element` | — | 副文案；仅 `notification` 展示。 | 否 |
| `kind` | `NoticeKind` | `'info'` | 语义类型。 | 否 |
| `duration` | `number` | `3000（message）/ 4500（notification）` | 自动关闭毫秒数；`0` 表示常驻，需手动 `close()`。 | 否 |
| `closable` | `boolean` | `false（message）/ true（notification）` | 是否显示关闭按钮。 | 否 |
| `onClose` | `() => void` | — | 关闭时回调（自动到期、手动关闭、被队列挤出都会触发一次）。 | 否 |

### NoticeHandle

继承：`PromiseLike<void>`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |

### MessageApi

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |

### NotificationApi

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |

### AppContextValue

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `message` | `MessageApi` | — | — | 是 |
| `notification` | `NotificationApi` | — | — | 是 |

### AppMessageConfig

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `duration` | `number` | `3000` | 默认自动关闭毫秒数；`0` 常驻。 | 否 |
| `maxCount` | `number` | `3` | 同屏最多保留条数，超出时挤掉最旧一条。 | 否 |

### AppNotificationConfig

继承：`AppMessageConfig`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `placement` | `NoticePlacement` | `'top-right'` | 默认出现位置。 | 否 |
| `duration` | `number` | `4500` | 默认自动关闭毫秒数。 | 否 |
| `maxCount` | `number` | `5` | 同屏最多保留条数。 | 否 |

### AppProps

继承：`Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children'>`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `children` | `JSX.Element` | — | 子树。 | 否 |
| `message` | `AppMessageConfig` | — | message 通道默认配置。 | 否 |
| `notification` | `AppNotificationConfig` | — | notification 通道默认配置。 | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/app/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
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
```

## 相关 Demo（完整源码见链接页）

- [基础用法](../demos/app-basic.md)：脱离组件树调用静态 message，五种语义各用一个按钮触发。（源文件 `packages/core/src/components/app/demos/basic.tsx`）
- [上下文与配置](../demos/app-context.md)：在 App 内用 useApp 获取局部通道，并通过句柄就地更新提示。（源文件 `packages/core/src/components/app/demos/context.tsx`）
- [通知卡片](../demos/app-notification.md)：带描述与关闭按钮的卡片，覆盖静态与上下文两条通道。（源文件 `packages/core/src/components/app/demos/notification.tsx`）

## 相关规范

> 规范摘录：`docs/02-架构设计.md` → ### 6.1 命名与 Props


```tsx
export interface ButtonProps
  extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: 'solid' | 'outline' | 'dashed' | 'text' | 'link';
  /** 语义色，默认 primary（v0.3 / Q16 已定） */
  color?: 'primary' | 'neutral' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'medium' | 'large';
  block?: boolean;
  loading?: boolean;
  icon?: JSX.Element;
  iconPosition?: 'start' | 'end';
  shape?: 'default' | 'round' | 'circle';
  htmlType?: 'button' | 'submit' | 'reset';
}
```

约定：

- 尺寸统一 `small | medium | large`（24 / 32 / 40 px），与 TDesign/AntD 习惯一致。
- 变体统一 `variant` + `color`；表单状态统一 `status: 'error' | 'warning' | 'success'`。
- 继承原生属性；`class` / `style` 合并而不是覆盖。
- `ref` 支持 `HTMLElement` 或回调；不额外发明 `forwardRef`。
- 布尔 prop 用肯定语义：`disabled`、`loading`、`block`、`clearable`、`searchable`。
- 不使用 `isXxx` 前缀；不使用 `onXxxChange` 之外的自定义事件名。
