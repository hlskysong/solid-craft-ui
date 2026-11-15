# Upload 上传（`solid-craft/upload`）

> 由 `pnpm generate:llms` 生成，请勿手工编辑。真源：`packages/core/package.json#exports` + `generated/api/*.json`（源自组件 `types.ts` JSDoc）；改源后需重新生成，否则 `pnpm check:llms` 失败。

## 概要

点击 / 拖拽共用原生文件入口，customRequest 单点注入传输并回调进度 / 成功 / 失败；文件列表支持删除、取消、重试与错误态，Form.Item 直接把 fileList 当字段值。

## 条件导出

| 条件 | 产物路径 | 说明 |
| --- | --- | --- |
| `types` | `./dist/types/components/upload/index.d.ts` | TypeScript 声明入口 |
| `solid` | `./dist/source/components/upload/index.jsx` | 保留 JSX 的源码产物，供消费方按 SSR / CSR 目标重新编译 |
| `import` | `./dist/esm/components/upload/index.js` | 编译后或静态产物 |
| `default` | `./dist/esm/components/upload/index.js` | 编译后或静态产物 |

## 引入方式

```ts
import { /* 导出符号 */ } from 'solid-craft/upload';
```

## API

### UploadFile

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `uid` | `string` | — | 列表内唯一 id；组件内由 `createUniqueId()` + 自增序号生成，不用随机数。 | 是 |
| `name` | `string` | — | 文件名。 | 是 |
| `size` | `number` | — | 字节数，缺省时不展示体积。 | 否 |
| `status` | `UploadFileStatus` | — | 上传状态。 @default 'ready' | 是 |
| `percent` | `number` | — | 0~100 进度；`uploading` 时驱动原生 `<progress>`。 | 否 |
| `response` | `unknown` | — | 服务端响应，由 `customRequest.onSuccess` 回传。 | 否 |
| `error` | `string` | — | 错误 / 取消原因，用于可读文案与 `aria-live` 输出。 | 否 |
| `originFile` | `File` | — | 浏览器原始 File；只在客户端事件链里存在，SSR 入口不传。 | 否 |

### UploadRequestOptions

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `file` | `UploadFile` | — | 当前文件项（含 `originFile`）。 | 是 |
| `onProgress` | `(percent: number) => void` | — | 上报 0~100 进度；组件会夹取到 [0, 100]。 | 是 |
| `onSuccess` | `(response?: unknown) => void` | — | 成功结束；可带回服务端响应。 | 是 |
| `onError` | `(error: Error) => void` | — | 失败结束；文件转入 `error` 并可重试。 | 是 |
| `signal` | `AbortSignal` | — | 删除 / 取消时 `abort()`，供 `fetch` 等可取消传输使用。 | 是 |

### UploadChangeInfo

继承：无

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `file` | `UploadFile` | — | 触发变化的文件项。 | 是 |
| `fileList` | `UploadFile[]` | — | 变化后的完整列表（与第一个参数同源）。 | 是 |

### UploadProps

继承：`Omit<   JSX.HTMLAttributes<HTMLDivElement>,   'onChange' \| 'children' >`

| 属性 | 类型 | 默认值 | 说明 | 必填 |
| --- | --- | --- | --- | --- |
| `fileList` | `UploadFile[]` | — | 受控文件列表；给出时所有变更只发 `onChange`，DOM 由调用方回弹。 在 `<Form.Item>` 内时字段值优先于本 prop（与 `useInputValue` 同口径）。 | 否 |
| `defaultFileList` | `UploadFile[]` | — | 非受控初始列表；同时是 SSR 静态骨架的唯一来源。 @default [] | 否 |
| `onChange` | `(fileList: UploadFile[], info: UploadChangeInfo) => void` | — | 列表变化；受控、非受控、Form 接管三种模式都只走这一个出口。 | 否 |
| `customRequest` | `(options: UploadRequestOptions) => void` | — | 自定义上传实现。不传时不做网络请求，文件直接置为 `done`。 同一文件重试会重新调用本函数并换一个新的 `AbortSignal`。 | 否 |
| `beforeUpload` | `(file: File) => boolean \| Promise<boolean>` | — | 上传前校验；返回 `false` 或 resolve 成 `false` 时文件以 `error` 入列， 不调用 `customRequest`（`docs/02 L490` 的 preventDefault 语义）。 | 否 |
| `accept` | `string` | — | 原生 accept 字符串，同时用于 `<input accept>` 与拖拽文件的二次校验。 | 否 |
| `maxSize` | `number` | — | 单文件字节上限；超限文件以 `error` 入列。 | 否 |
| `maxCount` | `number` | — | 列表条数上限；超限的新文件以 `error` 入列而不是静默丢弃。 | 否 |
| `multiple` | `boolean` | — | 是否允许多选。 @default true | 否 |
| `disabled` | `boolean` | — | 禁用选择、拖拽、删除、重试与取消。 @default false | 否 |
| `children` | `JSX.Element` | — | 触发区自定义内容；缺省为内置提示文案。 | 否 |


## 类型定义源码（含 JSDoc 全文）

源：`packages/core/src/components/upload/types.ts`。此区块直接读取组件源码，因此 JSDoc / 默认值变更而未重新生成时会让 `pnpm check:llms` 失败。

```ts
/**
 * `Upload` 的公共类型（T3-13，§4.2 与 `docs/04 §5.5` P0）。
 *
 * 范围严格按冻结规范收口：点击 / 拖拽、多文件、accept / maxSize / maxCount、
 * beforeUpload、customRequest、进度、取消、删除、重试、错误状态。
 * 图片预览 / 粘贴 / 目录上传 / 拖拽排序 / 分片续传都是 P1 / P2，本轮不做。
 *
 * **零新增依赖**：`docs/01 L164` 把 Upload 列为 Kobalte 缺口、须自研；拖拽库
 * `@atlaskit/pragmatic-drag-and-drop` 要到 v1.0 才引入（`docs/01 L54`），
 * 所以本组件只用原生 HTML5 DragEvent 与 `<input type="file">`，不碰任何新包。
 *
 * **网络层不在组件内**：组件只维护「文件列表状态机」，真实传输由 `customRequest`
 * 单点注入（P1 的 OSS / S3 直传也走这条缝）。未提供时不做任何网络请求，
 * 文件直接进入 `done`，并在文档中写明这是本地列表语义。
 *
 * 属性口径：
 * - 禁用复用 `data-scui-disabled`，校验态复用 `data-scui-invalid`（恒输出两态）。
 * - 新增两个语义：`data-scui-status`（单个文件的上传状态，恒输出四态之一）与
 *   `data-scui-dragging`（拖拽悬停，存在即真）。两者都登记进 attribute registry，
 *   不复用被 Skeleton 占用的 `-active`、原语专用的 `-state`、文本语义的 `-tone`。
 *
 * R3：`customRequest` / `beforeUpload` / `onChange` 是函数型 prop，直接声明为函数，
 * 不用 `MaybeAccessor` 包裹（`resolveValue` 靠 typeof 区分值与 getter，函数型会歧义）。
 */
import type { JSX } from 'solid-js';

/** 单个文件的上传状态，恒输出为 `data-scui-status`。 */
export type UploadFileStatus = 'ready' | 'uploading' | 'done' | 'error';

/** 文件列表项。SSR 静态骨架只需 uid / name / status，不依赖浏览器 `File`。 */
export interface UploadFile {
  /** 列表内唯一 id；组件内由 `createUniqueId()` + 自增序号生成，不用随机数。 */
  uid: string;
  /** 文件名。 */
  name: string;
  /** 字节数，缺省时不展示体积。 */
  size?: number;
  /** 上传状态。 @default 'ready' */
  status: UploadFileStatus;
  /** 0~100 进度；`uploading` 时驱动原生 `<progress>`。 */
  percent?: number;
  /** 服务端响应，由 `customRequest.onSuccess` 回传。 */
  response?: unknown;
  /** 错误 / 取消原因，用于可读文案与 `aria-live` 输出。 */
  error?: string;
  /** 浏览器原始 File；只在客户端事件链里存在，SSR 入口不传。 */
  originFile?: File;
}

/** `customRequest` 拿到的全部控制面；组件不内置任何传输实现。 */
export interface UploadRequestOptions {
  /** 当前文件项（含 `originFile`）。 */
  file: UploadFile;
  /** 上报 0~100 进度；组件会夹取到 [0, 100]。 */
  onProgress: (percent: number) => void;
  /** 成功结束；可带回服务端响应。 */
  onSuccess: (response?: unknown) => void;
  /** 失败结束；文件转入 `error` 并可重试。 */
  onError: (error: Error) => void;
  /** 删除 / 取消时 `abort()`，供 `fetch` 等可取消传输使用。 */
  signal: AbortSignal;
}

/** `onChange` 的第二参，便于调用方知道是哪一项触发了变化。 */
export interface UploadChangeInfo {
  /** 触发变化的文件项。 */
  file: UploadFile;
  /** 变化后的完整列表（与第一个参数同源）。 */
  fileList: UploadFile[];
}

/** `<Upload>` 入参。原生属性透传到根节点。 */
export interface UploadProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'children'
> {
  /**
   * 受控文件列表；给出时所有变更只发 `onChange`，DOM 由调用方回弹。
   * 在 `<Form.Item>` 内时字段值优先于本 prop（与 `useInputValue` 同口径）。
   */
  fileList?: UploadFile[];
  /** 非受控初始列表；同时是 SSR 静态骨架的唯一来源。 @default [] */
  defaultFileList?: UploadFile[];
  /** 列表变化；受控、非受控、Form 接管三种模式都只走这一个出口。 */
  onChange?: (fileList: UploadFile[], info: UploadChangeInfo) => void;
  /**
   * 自定义上传实现。不传时不做网络请求，文件直接置为 `done`。
   * 同一文件重试会重新调用本函数并换一个新的 `AbortSignal`。
   */
  customRequest?: (options: UploadRequestOptions) => void;
  /**
   * 上传前校验；返回 `false` 或 resolve 成 `false` 时文件以 `error` 入列，
   * 不调用 `customRequest`（`docs/02 L490` 的 preventDefault 语义）。
   */
  beforeUpload?: (file: File) => boolean | Promise<boolean>;
  /** 原生 accept 字符串，同时用于 `<input accept>` 与拖拽文件的二次校验。 */
  accept?: string;
  /** 单文件字节上限；超限文件以 `error` 入列。 */
  maxSize?: number;
  /** 列表条数上限；超限的新文件以 `error` 入列而不是静默丢弃。 */
  maxCount?: number;
  /** 是否允许多选。 @default true */
  multiple?: boolean;
  /** 禁用选择、拖拽、删除、重试与取消。 @default false */
  disabled?: boolean;
  /** 触发区自定义内容；缺省为内置提示文案。 */
  children?: JSX.Element;
  /** 上传区无障碍名称；恒输出。 @default '文件上传' */
  'aria-label'?: string;
}
```

## 相关 Demo（完整源码见链接页）

- [点击 / 拖拽与上传前校验](../demos/upload-basic.md)：原生 input[type=file] 与 HTML5 拖拽共用同一个入口；accept / maxSize / maxCount / beforeUpload 的拒绝结果以 error 状态留在列表里说明原因，不静默丢弃。受控 fileList 演示「只发事件、DOM 不回弹」。（源文件 `packages/core/src/components/upload/demos/basic.tsx`）
- [与 Form.Item 接入](../demos/upload-form.md)：Upload 在 <Form.Item> 内由字段上下文接管 fileList，值优先级高于 props；删除、重试、进度都回写同一个字段，提交时拿到的是变更后的列表。必填规则对空数组同样生效。（源文件 `packages/core/src/components/upload/demos/form.tsx`）
- [customRequest 进度 / 取消 / 重试](../demos/upload-progress.md)：组件不内置任何传输实现：customRequest 拿到 onProgress / onSuccess / onError 与 AbortSignal，删除或取消时 abort 并清掉定时器。列表初始态直接给出 uploading / done / error 三态静态骨架。（源文件 `packages/core/src/components/upload/demos/progress.tsx`）

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
