/**
 * 文件上传（T3-13）。
 *
 * 分工：组件只维护「文件列表状态机」，真实传输由 `customRequest` 单点注入，
 * 不内置 XHR / fetch / 云厂商 SDK。Kobalte 没有 Upload 原语（`docs/01 L164`），
 * 拖拽库要到 v1.0 才引入，所以点击与拖拽都走原生 `<input type="file">` /
 * HTML5 DragEvent，零新增依赖。
 *
 * 值来源优先级（与 `useInputValue` 同口径）：
 * `<Form.Item>` 字段值 > `fileList` > `defaultFileList` / 内部工作副本。
 * `internal()` 恒为传输状态机的工作副本；渲染真源是 `list()`，因此受控时
 * 点击只发 `onChange`、DOM 不自行回弹，而进度 / 成功 / 失败回调仍能继续跑完。
 *
 * SSR：文件列表来自 `defaultFileList` 纯数据，`createUniqueId()` + 局部自增序号
 * 保证 id 确定性；`AbortController` / `File` / `DataTransfer` 只出现在事件链里，
 * 模块顶层与渲染期都不碰 `window` / `document` / 当前时间。
 */
import {
  Index,
  Show,
  createSignal,
  createUniqueId,
  onCleanup,
  splitProps,
  type JSX,
} from 'solid-js';

import { CSS_PREFIX } from '../../scope';
import { useFormFieldOptional } from '../../form/use-form-field';
import { classNames } from '../../utils/class-names';
import type { UploadChangeInfo, UploadFile, UploadProps, UploadRequestOptions } from './types';

const UPLOAD_PROPS = [
  'fileList',
  'defaultFileList',
  'onChange',
  'customRequest',
  'beforeUpload',
  'accept',
  'maxSize',
  'maxCount',
  'multiple',
  'disabled',
  'children',
  'aria-label',
  'class',
] as const;

/** 字段值是 unknown；只在出口收窄一次，避免把任意对象渲染成 [object Object]。 */
function toFileList(value: unknown): UploadFile[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is UploadFile =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as UploadFile).uid === 'string' &&
      typeof (item as UploadFile).name === 'string',
  );
}

function matchesAccept(file: File, accept: string | undefined): boolean {
  if (accept === undefined || accept === '') return true;
  return accept
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token !== '')
    .some((token) => {
      if (token.startsWith('.')) return file.name.toLowerCase().endsWith(token);
      // 通配 accept 以星号结尾（形如 image/ 加星号）；刻意不拼「斜杠 + 星号」字面量，
      // 否则 dist 产物注释扫描会把它与后面的块注释误配成一段假注释。
      if (token.endsWith('*')) return file.type.startsWith(token.slice(0, -1));
      return file.type === token;
    });
}

function formatSize(size: number | undefined): string {
  if (size === undefined) return '';
  return `${Math.round(size / 1024)} KB`;
}

export function Upload(props: UploadProps): JSX.Element {
  const [local, rest] = splitProps(props, UPLOAD_PROPS);
  const field = useFormFieldOptional();
  const [internal, setInternal] = createSignal<UploadFile[]>(toFileList(local.defaultFileList));
  const [dragging, setDragging] = createSignal(false);
  const controllers = new Map<string, AbortController>();
  const idSeed = createUniqueId();
  let seq = 0;
  let inputEl: HTMLInputElement | undefined;

  onCleanup(() => {
    for (const controller of controllers.values()) controller.abort();
    controllers.clear();
  });

  const list = (): UploadFile[] => {
    if (field) return toFileList(field.value());
    return local.fileList ?? internal();
  };
  const disabled = (): boolean => local.disabled === true || (field?.disabled() ?? false);
  const hasError = (): boolean => list().some((item) => item.status === 'error');
  const aria = () => field?.aria();
  const nextUid = (): string => {
    seq += 1;
    return `scui-upload-${idSeed}-${seq}`;
  };

  /** 列表变化的唯一出口：写工作副本 → 回写字段（若有）→ 发 onChange。 */
  const emit = (next: UploadFile[], file: UploadFile): void => {
    setInternal(next);
    field?.setValue(next);
    const info: UploadChangeInfo = { file, fileList: next };
    local.onChange?.(next, info);
  };

  const patch = (uid: string, change: Partial<UploadFile>): void => {
    const next = list().map((item) => (item.uid === uid ? { ...item, ...change } : item));
    const file = next.find((item) => item.uid === uid);
    if (file === undefined) return;
    emit(next, file);
  };

  const startUpload = (item: UploadFile): void => {
    controllers.get(item.uid)?.abort();
    const controller = new AbortController();
    controllers.set(item.uid, controller);
    const running: UploadFile = {
      ...item,
      status: 'uploading',
      percent: 0,
      error: undefined,
    };
    patch(item.uid, { status: 'uploading', percent: 0, error: undefined });

    const options: UploadRequestOptions = {
      file: running,
      signal: controller.signal,
      onProgress: (percent) => {
        if (controller.signal.aborted) return;
        const clamped = Math.min(100, Math.max(0, Math.round(percent)));
        patch(item.uid, { percent: clamped });
      },
      onSuccess: (response) => {
        if (controller.signal.aborted) return;
        controllers.delete(item.uid);
        patch(item.uid, {
          status: 'done',
          percent: 100,
          response,
          error: undefined,
        });
      },
      onError: (error) => {
        if (controller.signal.aborted) return;
        controllers.delete(item.uid);
        patch(item.uid, { status: 'error', error: error.message });
      },
    };

    // 不传 customRequest 时不做任何网络请求：本地列表语义，直接完成。
    if (local.customRequest === undefined) {
      options.onSuccess();
      return;
    }
    local.customRequest(options);
  };

  const addRejected = (file: File, reason: string): void => {
    const item: UploadFile = {
      uid: nextUid(),
      name: file.name,
      size: file.size,
      status: 'error',
      error: reason,
      originFile: file,
    };
    emit([...list(), item], item);
  };

  const addFile = (file: File): void => {
    const item: UploadFile = {
      uid: nextUid(),
      name: file.name,
      size: file.size,
      status: 'ready',
      originFile: file,
    };
    emit([...list(), item], item);
    startUpload(item);
  };

  const validate = (file: File): string | undefined => {
    if (!matchesAccept(file, local.accept)) return '文件类型不在允许范围';
    if (local.maxSize !== undefined && file.size > local.maxSize) return '文件超出大小上限';
    if (local.maxCount !== undefined && list().length >= local.maxCount) {
      return '文件数量已达上限';
    }
    return undefined;
  };

  const handleFiles = (files: File[]): void => {
    if (disabled() || files.length === 0) return;
    for (const file of files) {
      const reason = validate(file);
      const before = reason === undefined ? local.beforeUpload?.(file) : false;
      if (before === false) {
        addRejected(file, reason ?? '上传前校验未通过');
        continue;
      }
      if (before instanceof Promise) {
        void before
          .then((ok) => {
            if (ok) addFile(file);
            else addRejected(file, '上传前校验未通过');
          })
          .catch(() => addRejected(file, '上传前校验失败'));
        continue;
      }
      addFile(file);
    }
  };

  const handleInputChange = (): void => {
    const files = Array.from(inputEl?.files ?? []);
    handleFiles(local.multiple === false ? files.slice(0, 1) : files);
    // 允许连续选择同一个文件：不这么做第二次 change 不会触发。
    if (inputEl !== undefined) inputEl.value = '';
  };

  const handleDragOver = (event: DragEvent): void => {
    event.preventDefault();
    if (!disabled()) setDragging(true);
  };
  const handleDragLeave = (event: DragEvent): void => {
    event.preventDefault();
    setDragging(false);
  };
  const handleDrop = (event: DragEvent): void => {
    event.preventDefault();
    setDragging(false);
    const files = Array.from(event.dataTransfer?.files ?? []);
    handleFiles(local.multiple === false ? files.slice(0, 1) : files);
  };

  const remove = (item: UploadFile): void => {
    if (disabled()) return;
    controllers.get(item.uid)?.abort();
    controllers.delete(item.uid);
    emit(
      list().filter((entry) => entry.uid !== item.uid),
      item,
    );
  };
  const retry = (item: UploadFile): void => {
    if (disabled()) return;
    startUpload({ ...item, error: undefined, percent: 0 });
  };
  const cancel = (item: UploadFile): void => {
    if (disabled()) return;
    const controller = controllers.get(item.uid);
    controller?.abort();
    controllers.delete(item.uid);
    patch(item.uid, { status: 'error', error: '已取消' });
  };

  return (
    <div
      {...rest}
      class={classNames(`${CSS_PREFIX}upload`, local.class)}
      data-scui-role="upload"
      data-scui-disabled={disabled() ? '' : undefined}
      data-scui-dragging={dragging() ? '' : undefined}
      data-scui-invalid={hasError() ? 'true' : 'false'}
    >
      <input
        ref={(element) => {
          inputEl = element;
        }}
        hidden
        type="file"
        id={field?.ids.control}
        accept={local.accept}
        multiple={local.multiple !== false}
        disabled={disabled()}
        aria-label={local['aria-label'] ?? '文件上传'}
        aria-labelledby={aria()?.['aria-labelledby']}
        aria-invalid={aria()?.['aria-invalid']}
        aria-describedby={aria()?.['aria-describedby']}
        data-scui-role="upload-input"
        onChange={handleInputChange}
      />
      <button
        type="button"
        class={`${CSS_PREFIX}upload__trigger`}
        disabled={disabled()}
        data-scui-role="upload-trigger"
        onClick={() => inputEl?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {local.children ?? '点击选择文件，或把文件拖拽到此处'}
      </button>
      <ul class={`${CSS_PREFIX}upload__list`} data-scui-role="upload-list">
        {/*
         * 用 Index 而非 For（§30.52）：`patch()` 每次改字段都会产出新对象，For 按引用
         * diff，于是进度每推进一次（本例 120ms 一条）就把整行 <li> 销毁重建 —— 焦点、
         * 滚动位置与 CSS 过渡全丢，连 E2E 的点击都会撞上「节点已从 DOM 移除」。
         * Index 按位置渲染、子节点拿到访问器，字段更新只改属性，行节点恒稳。
         */}
        <Index each={list()}>
          {(item) => (
            <li
              class={`${CSS_PREFIX}upload__item`}
              data-scui-role="upload-item"
              data-scui-status={item().status}
            >
              <span class={`${CSS_PREFIX}upload__name`} data-scui-role="upload-name">
                {item().name}
              </span>
              <Show when={formatSize(item().size) !== ''}>
                <span class={`${CSS_PREFIX}upload__size`} data-scui-role="upload-size">
                  {formatSize(item().size)}
                </span>
              </Show>
              <Show when={item().status === 'uploading'}>
                <progress
                  class={`${CSS_PREFIX}upload__progress`}
                  data-scui-role="upload-progress"
                  max="100"
                  value={item().percent ?? 0}
                  aria-label={`${item().name} 上传进度`}
                />
                <button
                  type="button"
                  class={`${CSS_PREFIX}upload__action`}
                  data-scui-role="upload-cancel"
                  disabled={disabled()}
                  onClick={() => cancel(item())}
                >
                  取消
                </button>
              </Show>
              <Show when={item().status === 'error'}>
                <span
                  class={`${CSS_PREFIX}upload__error`}
                  data-scui-role="upload-error"
                  role="status"
                >
                  {item().error ?? '上传失败'}
                </span>
                <button
                  type="button"
                  class={`${CSS_PREFIX}upload__action`}
                  data-scui-role="upload-retry"
                  disabled={disabled()}
                  onClick={() => retry(item())}
                >
                  重试
                </button>
              </Show>
              <button
                type="button"
                class={`${CSS_PREFIX}upload__action`}
                data-scui-role="upload-remove"
                disabled={disabled()}
                aria-label={`删除 ${item().name}`}
                onClick={() => remove(item())}
              >
                删除
              </button>
            </li>
          )}
        </Index>
      </ul>
    </div>
  );
}
