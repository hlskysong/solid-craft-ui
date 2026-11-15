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
